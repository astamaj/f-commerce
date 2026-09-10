import { TenantEntity } from './base.entity.js';

export interface AuditLog extends TenantEntity {
  userId: string;
  action: string; // e.g., 'ORDER_STATUS_CHANGED'
  entityType: string; // e.g., 'Order'
  entityId: string;
  previousValue?: string; // JSON string representation
  newValue?: string; // JSON string representation
  metadata?: string; // JSON string representation of extra info
}
