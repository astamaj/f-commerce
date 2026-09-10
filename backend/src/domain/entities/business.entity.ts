import { BaseEntity } from './base.entity.js';

export interface Business extends BaseEntity {
  name: string;
  currency: string;
  logoUrl?: string;
  address?: string;
}
