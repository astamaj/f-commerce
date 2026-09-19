export interface JwtPayload {
  userId: string;
  memberships: { businessId: string; role: 'OWNER' | 'STAFF' }[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
