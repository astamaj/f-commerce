import mongoose, { Schema, Document } from 'mongoose';
import { baseSchemaOptions } from './BaseSchema.js';

export interface BusinessMemberDocument extends Document {
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'OWNER' | 'STAFF';
  status: 'ACTIVE' | 'INVITED';
}

const BusinessMemberSchema = new Schema<BusinessMemberDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['OWNER', 'STAFF'], required: true },
    status: { type: String, enum: ['ACTIVE', 'INVITED'], default: 'ACTIVE' },
  },
  baseSchemaOptions,
);

// Ensure a user can only have one role per business
BusinessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });

export const BusinessMemberModel = mongoose.model<BusinessMemberDocument>(
  'BusinessMember',
  BusinessMemberSchema,
);
