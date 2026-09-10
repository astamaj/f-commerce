import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

export interface CategoryDocument extends Document {
  name: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
  },
  baseSchemaOptions,
);

CategorySchema.plugin(tenantPlugin);

export const CategoryModel = mongoose.model<CategoryDocument>('Category', CategorySchema);

export interface ProductDocument extends Document {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  imageUrl?: string;
  categoryId?: mongoose.Types.ObjectId;
  stockCount: number;
  lowStockThreshold: number;
  isArchived: boolean;
  businessId: mongoose.Types.ObjectId;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    sku: { type: String },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, min: 0 },
    imageUrl: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    stockCount: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isArchived: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

ProductSchema.plugin(tenantPlugin);

// Ensure unique SKU per business if SKU is provided
ProductSchema.index(
  { businessId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $exists: true, $type: 'string' } } },
);

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
