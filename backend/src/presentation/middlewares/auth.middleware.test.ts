import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireBusinessRole } from './auth.middleware.js';
import jwt from 'jsonwebtoken';
import { runWithContext } from '../../infrastructure/database/mongoose/context.js';
import { Request, Response, NextFunction } from 'express';

vi.mock('jsonwebtoken');
vi.mock('../../infrastructure/database/mongoose/context.js');

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('returns 401 if no auth header', () => {
      requireAuth(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 if token is invalid', () => {
      req.headers!.authorization = 'Bearer invalid';
      vi.mocked(jwt.verify).mockImplementation(() => { throw new Error(); });

      requireAuth(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls next and sets user if token is valid', () => {
      req.headers!.authorization = 'Bearer valid';
      vi.mocked(jwt.verify).mockReturnValue({ userId: '123' } as any);

      requireAuth(req as Request, res as Response, next);
      expect((req as any).user).toEqual({ userId: '123' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireBusinessRole', () => {
    it('returns 400 if no x-business-id header', () => {
      const middleware = requireBusinessRole(['OWNER']);
      middleware(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 403 if user lacks access to business', () => {
      req.headers!['x-business-id'] = 'biz1';
      (req as any).user = { userId: '123', memberships: [{ businessId: 'biz2', role: 'OWNER' }] };

      const middleware = requireBusinessRole(['OWNER']);
      middleware(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('sets context and calls next if role matches', () => {
      req.headers!['x-business-id'] = 'biz1';
      (req as any).user = { userId: '123', memberships: [{ businessId: 'biz1', role: 'OWNER' }] };
      vi.mocked(runWithContext).mockImplementation((ctx, fn) => fn());

      const middleware = requireBusinessRole(['OWNER']);
      middleware(req as Request, res as Response, next);

      expect(runWithContext).toHaveBeenCalledWith(
        { userId: '123', businessId: 'biz1', role: 'OWNER' },
        expect.any(Function)
      );
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 when user has insufficient permissions', () => {
      req.headers!['x-business-id'] = 'biz1';
      (req as any).user = { userId: '123', memberships: [{ businessId: 'biz1', role: 'STAFF' }] };
      vi.mocked(runWithContext).mockImplementation((ctx, fn) => fn());

      const middleware = requireBusinessRole(['OWNER']);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
