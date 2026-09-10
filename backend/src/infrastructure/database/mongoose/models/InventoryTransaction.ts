import mongoose, { Schema, Document } from 'mongoose';
import { InventoryTransactionType } from '../../../../domain/entities/inventory.entity.js';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface InventoryTransactionDocument extends Document {
  productId: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;
  orderId?: mongoose.Types.ObjectId;
  reason?: string;
  businessId: mongoose.Types.ObjectId;
}

const InventoryTransactionSchema = new Schema<InventoryTransactionDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: Object.values(InventoryTransactionType), required: true },
    quantity: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    reason: { type: String },
  },
  baseSchemaOptions,
);

InventoryTransactionSchema.plugin(tenantPlugin);

// Index for querying history of a product
InventoryTransactionSchema.index({ businessId: 1, productId: 1 });

export const InventoryTransactionModel = mongoose.model<InventoryTransactionDocument>(
  'InventoryTransaction',
  InventoryTransactionSchema,
);
