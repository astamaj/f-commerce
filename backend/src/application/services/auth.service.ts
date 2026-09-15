import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { UserModel, UserDocument } from '../../infrastructure/database/mongoose/models/User.js';
import { BusinessModel } from '../../infrastructure/database/mongoose/models/Business.js';
import { BusinessMemberModel, BusinessMemberDocument } from '../../infrastructure/database/mongoose/models/BusinessMember.js';
import { RefreshTokenModel } from '../../infrastructure/database/mongoose/models/RefreshToken.js';
import { config } from '../../infrastructure/config.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(email: string, passwordHash: string, name: string, businessName: string): Promise<AuthTokens> {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordHash, salt);

    // Create User, Business, and BusinessMember
    // Note: To truly do this transactionally, a MongoDB session should be used
    const user = await UserModel.create({
      email,
      passwordHash: hashed,
      name,
      oauth: [],
    });

    const business = await BusinessModel.create({
      name: businessName,
    });

    const member = await BusinessMemberModel.create({
      businessId: business._id,
      userId: user._id,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    return this.generateTokens(user._id.toString(), [{ businessId: business._id.toString(), role: 'OWNER' }]);
  }

  async login(email: string, passwordHash: string): Promise<AuthTokens> {
    const user = await UserModel.findOne({ email });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return this.createTokensForUser(user);
  }

  async oauthLogin(email: string, name: string, provider: string, providerId: string): Promise<AuthTokens> {
    let user = await UserModel.findOne({ email });
    
    if (user) {
      // Link account if provider not present
      const providerExists = user.oauth.some(o => o.provider === provider && o.providerId === providerId);
      if (!providerExists) {
        user.oauth.push({ provider, providerId });
        await user.save();
      }
    } else {
      // Need to create a user and a default business for OAuth if they don't exist
      user = await UserModel.create({
        email,
        name,
        oauth: [{ provider, providerId }],
      });

      const business = await BusinessModel.create({
        name: `${name}'s Business`,
      });

      await BusinessMemberModel.create({
        businessId: business._id,
        userId: user._id,
        role: 'OWNER',
        status: 'ACTIVE',
      });
    }

    return this.createTokensForUser(user);
  }

  private async createTokensForUser(user: UserDocument): Promise<AuthTokens> {
    const members = await BusinessMemberModel.find({ userId: user._id, status: 'ACTIVE' });
    const memberships = members.map(m => ({
      businessId: m.businessId.toString(),
      role: m.role,
    }));

    return this.generateTokens(user._id.toString(), memberships);
  }

  private async generateTokens(userId: string, memberships: { businessId: string; role: string }[]): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId, memberships },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshTokenValue = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshTokenModel.create({
      userId,
      token: refreshTokenValue,
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async refresh(token: string): Promise<AuthTokens> {
    const refreshTokenDoc = await RefreshTokenModel.findOne({ token });
    if (!refreshTokenDoc || refreshTokenDoc.revoked || refreshTokenDoc.expiresAt < new Date()) {
      if (refreshTokenDoc && !refreshTokenDoc.revoked) {
         refreshTokenDoc.revoked = true;
         await refreshTokenDoc.save();
      }
      throw new Error('Invalid refresh token');
    }

    const user = await UserModel.findById(refreshTokenDoc.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token (rotation)
    refreshTokenDoc.revoked = true;
    await refreshTokenDoc.save();

    return this.createTokensForUser(user);
  }

  async logout(token: string): Promise<void> {
    await RefreshTokenModel.updateOne({ token }, { revoked: true });
  }

  async getProfile(userId: string) {
    const user = await UserModel.findById(userId).select('-passwordHash');
    if (!user) throw new Error('User not found');

    const businesses = await BusinessMemberModel.find({ userId }).populate('businessId');
    return {
      user,
      businesses
    };
  }
}
