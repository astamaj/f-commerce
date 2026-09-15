import mongoose, { Schema, Document } from 'mongoose';
import { baseSchemaOptions } from './BaseSchema.js';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  oauth: { provider: string; providerId: string }[];
  isActive: boolean;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String }, // Optional because OAuth might not set a password immediately
    name: { type: String, required: true },
    oauth: [
      {
        provider: { type: String, required: true },
        providerId: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
