import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface CourierDocument extends Document {
  name: string;
  contactNumber?: string;
  trackingUrlTemplate?: string;
  businessId: mongoose.Types.ObjectId;
}

const CourierSchema = new Schema<CourierDocument>(
  {
    name: { type: String, required: true },
    contactNumber: { type: String },
    trackingUrlTemplate: { type: String },
  },
  baseSchemaOptions,
);

CourierSchema.plugin(tenantPlugin);

export const CourierModel = mongoose.model<CourierDocument>('Courier', CourierSchema);
