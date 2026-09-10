import { TenantEntity } from './base.entity.js';

export interface Category extends TenantEntity {
  name: string;
  description?: string;
  parentId?: string; // For hierarchical categories
}

export interface Product extends TenantEntity {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number; // Cost of goods sold
  imageUrl?: string;
  categoryId?: string;
  stockCount: number;
  lowStockThreshold: number;
  isArchived: boolean;
}
