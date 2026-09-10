import mongoose, { Schema, Document } from 'mongoose';
import { baseSchemaOptions } from './BaseSchema.js';

export interface BusinessDocument extends Document {
  name: string;
  currency: string;
  logoUrl?: string;
  address?: string;
}

const BusinessSchema = new Schema<BusinessDocument>(
  {
    name: { type: String, required: true },
    currency: { type: String, required: true },
    logoUrl: { type: String },
    address: { type: String },
  },
  baseSchemaOptions,
);

export const BusinessModel = mongoose.model<BusinessDocument>('Business', BusinessSchema);
