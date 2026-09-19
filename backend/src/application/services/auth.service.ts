import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { IAuthRepository } from '../../domain/repositories/auth.repository.js';
import { config } from '../../infrastructure/config.js';
import { User } from '../../domain/entities/user.entity.js';
import {
  DuplicateEmailError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../domain/errors.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(
    email: string,
    passwordHash: string,
    name: string,
    businessName: string,
  ): Promise<AuthTokens> {
    const existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailError('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordHash, salt);

    const user = await this.authRepository.createUser({
      email,
      passwordHash: hashed,
      name,
      oauth: [],
      isActive: true,
    });

    const business = await this.authRepository.createBusiness(businessName);

    await this.authRepository.createBusinessMember({
      businessId: business._id,
      userId: user.id,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    return this.generateTokens(user.id, [{ businessId: business._id, role: 'OWNER' }]);
  }

  async login(email: string, passwordHash: string): Promise<AuthTokens> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.createTokensForUser(user);
  }

  async oauthLogin(
    email: string,
    name: string,
    provider: string,
    providerId: string,
  ): Promise<AuthTokens> {
    let user = await this.authRepository.findUserByEmail(email);

    if (user) {
      const providerExists = user.oauth?.some(
        (o) => o.provider === provider && o.providerId === providerId,
      );
      if (!providerExists) {
        const updatedOauth = [...(user.oauth || []), { provider, providerId }];
        await this.authRepository.updateUser(user.id, { oauth: updatedOauth });
        user.oauth = updatedOauth;
      }
    } else {
      user = await this.authRepository.createUser({
        email,
        name,
        oauth: [{ provider, providerId }],
        isActive: true,
      });

      const business = await this.authRepository.createBusiness(`${name}'s Business`);

      await this.authRepository.createBusinessMember({
        businessId: business._id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      });
    }

    return this.createTokensForUser(user);
  }

  private async createTokensForUser(user: User): Promise<AuthTokens> {
    const members = (await this.authRepository.findUserBusinesses(user.id)) as {
      businessId: string | { _id: string };
      role: string;
    }[];
    const memberships = members.map((m) => ({
      businessId: (m.businessId as Record<string, unknown>)._id
        ? String((m.businessId as Record<string, unknown>)._id)
        : String(m.businessId),
      role: m.role,
    }));

    return this.generateTokens(user.id, memberships);
  }

  private async generateTokens(
    userId: string,
    memberships: { businessId: string; role: string }[],
  ): Promise<AuthTokens> {
    const accessToken = jwt.sign({ userId, memberships }, config.JWT_SECRET, { expiresIn: '15m' });

    const refreshTokenValue = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.createRefreshToken(userId, refreshTokenValue, expiresAt);

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async refresh(token: string): Promise<AuthTokens> {
    const refreshTokenDoc = (await this.authRepository.findRefreshToken(token)) as {
      userId: string;
      revoked: boolean;
      expiresAt: Date;
    } | null;
    if (!refreshTokenDoc || refreshTokenDoc.revoked || refreshTokenDoc.expiresAt < new Date()) {
      if (refreshTokenDoc && !refreshTokenDoc.revoked) {
        await this.authRepository.revokeRefreshToken(token);
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(refreshTokenDoc.userId.toString());
    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    await this.authRepository.revokeRefreshToken(token);

    return this.createTokensForUser(user);
  }

  async logout(token: string): Promise<void> {
    await this.authRepository.revokeRefreshToken(token);
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new NotFoundError('User not found');

    const businesses = await this.authRepository.findUserBusinesses(userId);
    return {
      user: { id: user.id, email: user.email, name: user.name, isActive: user.isActive },
      businesses,
    };
  }

  async inviteStaff(email: string, role: 'OWNER' | 'STAFF', businessId: string): Promise<void> {
    let user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      user = await this.authRepository.createUser({
        email,
        name: 'Pending Invite',
        oauth: [],
        isActive: false,
      });
    }

    const existingMember = await this.authRepository.findBusinessMember(businessId, user.id);
    if (existingMember) {
      throw new ConflictError('User is already a member or invited to this business');
    }

    await this.authRepository.createBusinessMember({
      businessId,
      userId: user.id,
      role,
      status: 'INVITED',
    });
  }
}
