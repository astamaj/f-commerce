import mongoose, { Schema, Document } from 'mongoose';
import { baseSchemaOptions } from './BaseSchema.js';

export interface BusinessDocument extends Document {
  name: string;
}

const BusinessSchema = new Schema<BusinessDocument>(
  {
    name: { type: String, required: true },
  },
  baseSchemaOptions,
);

export const BusinessModel = mongoose.model<BusinessDocument>('Business', BusinessSchema);
