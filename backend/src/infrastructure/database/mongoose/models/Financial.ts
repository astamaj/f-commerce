import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod } from '../../../../domain/entities/financial.entity.js';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface PaymentDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  paymentDate: Date;
  businessId: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    referenceNumber: { type: String },
    notes: { type: String },
    paymentDate: { type: Date, required: true, default: Date.now },
  },
  baseSchemaOptions,
);

PaymentSchema.plugin(tenantPlugin);

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', PaymentSchema);

export interface ExpenseCategoryDocument extends Document {
  name: string;
  description?: string;
  businessId: mongoose.Types.ObjectId;
}

const ExpenseCategorySchema = new Schema<ExpenseCategoryDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
  },
  baseSchemaOptions,
);

ExpenseCategorySchema.plugin(tenantPlugin);

export const ExpenseCategoryModel = mongoose.model<ExpenseCategoryDocument>(
  'ExpenseCategory',
  ExpenseCategorySchema,
);

export interface ExpenseDocument extends Document {
  categoryId?: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  referenceNumber?: string;
  notes?: string;
  businessId: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<ExpenseDocument>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    referenceNumber: { type: String },
    notes: { type: String },
  },
  baseSchemaOptions,
);

ExpenseSchema.plugin(tenantPlugin);

export const ExpenseModel = mongoose.model<ExpenseDocument>('Expense', ExpenseSchema);
