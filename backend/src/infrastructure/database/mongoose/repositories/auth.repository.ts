import { IAuthRepository } from '../../../../domain/repositories/auth.repository.js';
import { UserModel } from '../models/User.js';
import { BusinessModel } from '../models/Business.js';
import { BusinessMemberModel } from '../models/BusinessMember.js';
import { RefreshTokenModel } from '../models/RefreshToken.js';
import { User } from '../../../../domain/entities/user.entity.js';

export class MongooseAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      oauth: doc.oauth.map((o: { provider: string; providerId: string }) => ({
        provider: o.provider,
        providerId: o.providerId,
      })),
      isActive: doc.isActive,
      createdAt: (doc as unknown as { createdAt: Date }).createdAt,
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
    };
  }

  async findUserById(userId: string): Promise<User | null> {
    const doc = await UserModel.findById(userId);
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      oauth: doc.oauth.map((o: { provider: string; providerId: string }) => ({
        provider: o.provider,
        providerId: o.providerId,
      })),
      isActive: doc.isActive,
      createdAt: (doc as unknown as { createdAt: Date }).createdAt,
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
    };
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const doc = await UserModel.create(userData);
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      oauth: doc.oauth.map((o: { provider: string; providerId: string }) => ({
        provider: o.provider,
        providerId: o.providerId,
      })),
      isActive: doc.isActive,
      createdAt: (doc as unknown as { createdAt: Date }).createdAt,
      updatedAt: (doc as unknown as { updatedAt: Date }).updatedAt,
    };
  }

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, data);
  }

  async createBusiness(name: string): Promise<{ _id: string; name: string }> {
    const doc = await BusinessModel.create({ name });
    return { _id: doc._id.toString(), name: doc.name };
  }

  async createBusinessMember(data: {
    businessId: string;
    userId: string;
    role: 'OWNER' | 'STAFF';
    status: 'ACTIVE' | 'INVITED';
  }): Promise<void> {
    await BusinessMemberModel.create(data);
  }

  async findBusinessMember(businessId: string, userId: string): Promise<unknown | null> {
    return BusinessMemberModel.findOne({ businessId, userId }).lean();
  }

  async findUserBusinesses(userId: string): Promise<unknown[]> {
    return BusinessMemberModel.find({ userId }).populate('businessId').lean();
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await RefreshTokenModel.create({ userId, token, expiresAt });
  }

  async findRefreshToken(token: string): Promise<unknown | null> {
    return RefreshTokenModel.findOne({ token }).lean();
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await RefreshTokenModel.updateOne({ token }, { revoked: true });
  }
}
