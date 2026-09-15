import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { UserModel } from '../../infrastructure/database/mongoose/models/User.js';
import { BusinessModel } from '../../infrastructure/database/mongoose/models/Business.js';
import { BusinessMemberModel } from '../../infrastructure/database/mongoose/models/BusinessMember.js';
import { RefreshTokenModel } from '../../infrastructure/database/mongoose/models/RefreshToken.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../infrastructure/database/mongoose/models/User.js');
vi.mock('../../infrastructure/database/mongoose/models/Business.js');
vi.mock('../../infrastructure/database/mongoose/models/BusinessMember.js');
vi.mock('../../infrastructure/database/mongoose/models/RefreshToken.js');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('throws error if email already exists', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce({ _id: '123' } as any);

      await expect(authService.register('test@test.com', 'pass', 'Test User', 'Test Biz'))
        .rejects.toThrow('Email already exists');
    });

    it('creates user, business, member, and tokens successfully', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.genSalt).mockResolvedValueOnce('salt' as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_pass' as any);

      vi.mocked(UserModel.create).mockResolvedValueOnce({ _id: 'user1' } as any);
      vi.mocked(BusinessModel.create).mockResolvedValueOnce({ _id: 'biz1' } as any);
      vi.mocked(BusinessMemberModel.create).mockResolvedValueOnce({ _id: 'mem1' } as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({ _id: 'token1' } as any);
      vi.mocked(jwt.sign).mockReturnValue('access_token' as any);

      const result = await authService.register('test@test.com', 'pass', 'Test User', 'Test Biz');

      expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@test.com' }));
      expect(BusinessModel.create).toHaveBeenCalledWith({ name: 'Test Biz' });
      expect(BusinessMemberModel.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'OWNER' }));
      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('throws error for invalid email', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce(null);
      await expect(authService.login('test@test.com', 'pass')).rejects.toThrow('Invalid credentials');
    });

    it('throws error for invalid password', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce({ passwordHash: 'hash' } as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as any);
      await expect(authService.login('test@test.com', 'wrong_pass')).rejects.toThrow('Invalid credentials');
    });

    it('returns tokens for valid credentials', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce({ _id: 'user1', passwordHash: 'hash' } as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as any);
      vi.mocked(BusinessMemberModel.find).mockResolvedValueOnce([{ businessId: 'biz1', role: 'OWNER' }] as any);
      vi.mocked(jwt.sign).mockReturnValue('access_token' as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({} as any);

      const result = await authService.login('test@test.com', 'pass');
      expect(result.accessToken).toBe('access_token');
    });
  });

  describe('oauthLogin', () => {
    it('creates new user and business when email does not exist', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValueOnce(null);
      vi.mocked(UserModel.create).mockResolvedValueOnce({ _id: 'user1' } as any);
      vi.mocked(BusinessModel.create).mockResolvedValueOnce({ _id: 'biz1' } as any);
      vi.mocked(BusinessMemberModel.create).mockResolvedValueOnce({ _id: 'mem1' } as any);
      vi.mocked(BusinessMemberModel.find).mockResolvedValueOnce([{ businessId: 'biz1', role: 'OWNER' }] as any);
      vi.mocked(jwt.sign).mockReturnValue('access_token' as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({} as any);

      const result = await authService.oauthLogin('test@google.com', 'Test User', 'google', 'google123');

      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@google.com', oauth: [{ provider: 'google', providerId: 'google123' }] }),
      );
      expect(BusinessModel.create).toHaveBeenCalledWith({ name: "Test User's Business" });
      expect(result.accessToken).toBe('access_token');
    });

    it('links existing account when OAuth email already exists', async () => {
      const existingUser = {
        _id: 'user1',
        oauth: [{ provider: 'facebook', providerId: 'fb123' }],
        save: vi.fn().mockResolvedValueOnce(undefined),
      } as any;

      vi.mocked(UserModel.findOne).mockResolvedValueOnce(existingUser);
      vi.mocked(BusinessMemberModel.find).mockResolvedValueOnce([{ businessId: 'biz1', role: 'OWNER' }] as any);
      vi.mocked(jwt.sign).mockReturnValue('access_token' as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({} as any);

      const result = await authService.oauthLogin('test@google.com', 'Test User', 'google', 'google123');

      expect(existingUser.oauth).toHaveLength(2);
      expect(existingUser.oauth).toContainEqual({ provider: 'google', providerId: 'google123' });
      expect(existingUser.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('access_token');
    });

    it('does not re-link OAuth provider when already linked', async () => {
      const existingUser = {
        _id: 'user1',
        oauth: [{ provider: 'google', providerId: 'google123' }],
        save: vi.fn().mockResolvedValueOnce(undefined),
      } as any;

      vi.mocked(UserModel.findOne).mockResolvedValueOnce(existingUser);
      vi.mocked(BusinessMemberModel.find).mockResolvedValueOnce([{ businessId: 'biz1', role: 'OWNER' }] as any);
      vi.mocked(jwt.sign).mockReturnValue('access_token' as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({} as any);

      const result = await authService.oauthLogin('test@google.com', 'Test User', 'google', 'google123');

      expect(existingUser.save).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('access_token');
    });
  });

  describe('refresh', () => {
    it('throws error for invalid refresh token', async () => {
      vi.mocked(RefreshTokenModel.findOne).mockResolvedValueOnce(null);
      await expect(authService.refresh('invalid_token')).rejects.toThrow('Invalid refresh token');
    });

    it('throws error for expired refresh token and revokes it', async () => {
      const expiredToken = {
        token: 'expired',
        revoked: false,
        expiresAt: new Date('2020-01-01'),
        save: vi.fn().mockResolvedValueOnce(undefined),
      } as any;

      vi.mocked(RefreshTokenModel.findOne).mockResolvedValueOnce(expiredToken);

      await expect(authService.refresh('expired')).rejects.toThrow('Invalid refresh token');
      expect(expiredToken.revoked).toBe(true);
      expect(expiredToken.save).toHaveBeenCalled();
    });

    it('throws error for revoked refresh token', async () => {
      const revokedToken = {
        token: 'revoked',
        revoked: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      } as any;

      vi.mocked(RefreshTokenModel.findOne).mockResolvedValueOnce(revokedToken);
      await expect(authService.refresh('revoked')).rejects.toThrow('Invalid refresh token');
    });

    it('rotates refresh token and returns new tokens for valid token', async () => {
      const oldToken = {
        token: 'old_refresh',
        revoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: 'user1',
        save: vi.fn().mockResolvedValueOnce(undefined),
      } as any;

      vi.mocked(RefreshTokenModel.findOne).mockResolvedValueOnce(oldToken);
      vi.mocked(UserModel.findById).mockResolvedValueOnce({ _id: 'user1', isActive: true } as any);
      vi.mocked(BusinessMemberModel.find).mockResolvedValueOnce([{ businessId: 'biz1', role: 'OWNER' }] as any);
      vi.mocked(jwt.sign).mockReturnValue('new_access_token' as any);
      vi.mocked(RefreshTokenModel.create).mockResolvedValueOnce({ _id: 'new_token' } as any);

      const result = await authService.refresh('old_refresh');

      expect(oldToken.revoked).toBe(true);
      expect(oldToken.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBeDefined();
      expect(RefreshTokenModel.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      vi.mocked(RefreshTokenModel.updateOne).mockResolvedValueOnce({ modifiedCount: 1 } as any);

      await authService.logout('some_token');

      expect(RefreshTokenModel.updateOne).toHaveBeenCalledWith({ token: 'some_token' }, { revoked: true });
    });
  });

  describe('getProfile', () => {
    it('returns user profile with business memberships', async () => {
      const mockUser = { _id: 'user1', name: 'Test' } as any;
      const mockSelect = vi.fn().mockResolvedValueOnce(mockUser);
      vi.mocked(UserModel.findById).mockReturnValue({ select: mockSelect } as any);

      const mockBusiness = { _id: 'biz1', name: 'Test Biz' };
      const mockFind = vi.fn().mockReturnValue({ populate: vi.fn().mockResolvedValueOnce([{ businessId: mockBusiness, role: 'OWNER' }] as any) });
      vi.mocked(BusinessMemberModel.find).mockImplementationOnce(mockFind as any);

      const result = await authService.getProfile('user1');

      expect(UserModel.findById).toHaveBeenCalledWith('user1');
      expect(result.user).toBeDefined();
      expect(result.businesses).toBeDefined();
    });

    it('throws error when user not found', async () => {
      const mockSelect = vi.fn().mockResolvedValueOnce(null);
      vi.mocked(UserModel.findById).mockReturnValue({ select: mockSelect } as any);

      await expect(authService.getProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
