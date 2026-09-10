import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../../../domain/entities/user.entity.js';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  businessId: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

UserSchema.plugin(tenantPlugin);

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
