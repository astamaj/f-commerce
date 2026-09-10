import { TenantEntity } from './base.entity.js';

export interface Courier extends TenantEntity {
  name: string;
  contactNumber?: string;
  trackingUrlTemplate?: string; // E.g., 'https://courier.com/track?id={{trackingNumber}}'
}
