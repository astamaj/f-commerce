import { TenantEntity } from './base.entity.js';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export interface Order extends TenantEntity {
  customerId: string;
  orderNumber: string; // Human-readable order identifier
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number; // subtotal + deliveryFee - discount
  paidAmount: number;
  dueAmount: number; // total - paidAmount
  shippingAddress?: string;
  courierId?: string;
  trackingNumber?: string;
  source?: string; // e.g., 'Facebook', 'WhatsApp', 'Direct'
  notes?: string;
  idempotencyKey?: string;
}

export interface OrderItem extends TenantEntity {
  orderId: string;
  productId: string;
  productNameSnapshot: string; // Snapshot of name at time of order
  priceSnapshot: number; // Snapshot of price at time of order
  costSnapshot: number; // Snapshot of cost at time of order
  quantity: number;
  subtotal: number; // quantity * priceSnapshot
}
