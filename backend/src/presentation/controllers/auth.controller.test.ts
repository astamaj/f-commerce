import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './auth.controller.js';
import { AuthService } from '../../application/services/auth.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

vi.mock('../../application/services/auth.service.js');
vi.mock('../middlewares/auth.middleware.js', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = { userId: '123', memberships: [] };
    next();
  })
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 on success', async () => {
      vi.mocked(AuthService.prototype.register).mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 't@t.com', password: 'p', name: 'N', businessName: 'B' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ accessToken: 'access' });
      expect(res.header['set-cookie'][0]).toContain('refreshToken=refresh');
    });

    it('returns 409 if email exists', async () => {
      vi.mocked(AuthService.prototype.register).mockRejectedValueOnce(new Error('Email already exists'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 't@t.com', password: 'p', name: 'N', businessName: 'B' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 on success', async () => {
      vi.mocked(AuthService.prototype.login).mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 't@t.com', password: 'p' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ accessToken: 'access' });
    });

    it('returns 401 on invalid credentials', async () => {
      vi.mocked(AuthService.prototype.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 't@t.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/oauth/:provider', () => {
    it('returns 200 on OAuth success', async () => {
      vi.mocked(AuthService.prototype.oauthLogin).mockResolvedValueOnce({
        accessToken: 'oauth_access',
        refreshToken: 'oauth_refresh'
      });

      const res = await request(app)
        .post('/api/auth/oauth/google')
        .send({ email: 't@google.com', name: 'Test', providerId: 'google123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ accessToken: 'oauth_access' });
      expect(res.header['set-cookie'][0]).toContain('refreshToken=oauth_refresh');
    });

    it('returns 401 on OAuth failure', async () => {
      vi.mocked(AuthService.prototype.oauthLogin).mockRejectedValueOnce(new Error('OAuth fail'));

      const res = await request(app)
        .post('/api/auth/oauth/google')
        .send({ email: 't@google.com', name: 'Test', providerId: 'google123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 200 with new access token', async () => {
      vi.mocked(AuthService.prototype.refresh).mockResolvedValueOnce({
        accessToken: 'new_access',
        refreshToken: 'new_refresh'
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=old_refresh');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ accessToken: 'new_access' });
      expect(res.header['set-cookie'][0]).toContain('refreshToken=new_refresh');
    });

    it('returns 401 when refresh token is missing', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid refresh token', async () => {
      vi.mocked(AuthService.prototype.refresh).mockRejectedValueOnce(new Error('Invalid refresh token'));

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and revokes token', async () => {
      vi.mocked(AuthService.prototype.logout).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'refreshToken=some_token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 and profile', async () => {
      vi.mocked(AuthService.prototype.getProfile).mockResolvedValueOnce({ user: { name: 'Test' }, businesses: [] } as any);

      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({ name: 'Test' });
      expect(requireAuth).toHaveBeenCalled();
    });

    it('returns 401 when unauthorized', async () => {
      vi.mocked(requireAuth).mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});
