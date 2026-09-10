import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface CustomerDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  businessId: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    notes: { type: String },
  },
  baseSchemaOptions,
);

CustomerSchema.plugin(tenantPlugin);

// Unique phone per business
CustomerSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export const CustomerModel = mongoose.model<CustomerDocument>('Customer', CustomerSchema);
