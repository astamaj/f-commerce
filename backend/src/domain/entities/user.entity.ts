import { TenantEntity } from './base.entity.js';

export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

export interface User extends TenantEntity {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}
