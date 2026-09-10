import { TenantEntity } from './base.entity.js';

export enum InventoryTransactionType {
  RESERVATION = 'RESERVATION',
  DEDUCTION = 'DEDUCTION',
  RESTORATION = 'RESTORATION',
  ADJUSTMENT = 'ADJUSTMENT', // Manual corrections
}

export interface InventoryTransaction extends TenantEntity {
  productId: string;
  type: InventoryTransactionType;
  quantity: number; // Positive or negative
  orderId?: string; // Nullable, as adjustments might not have an order
  reason?: string;
}
