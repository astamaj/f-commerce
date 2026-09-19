import { BaseEntity } from './base.entity.js';

export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  name: string;
  oauth: { provider: string; providerId: string }[];
  isActive: boolean;
}
