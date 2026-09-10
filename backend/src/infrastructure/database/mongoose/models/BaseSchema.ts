import { Schema } from 'mongoose';

export const baseSchemaOptions = {
  timestamps: true,
  optimisticConcurrency: true,
};

export const tenantSchemaOptions = {
  ...baseSchemaOptions,
};

// Reusable plugin to ensure businessId is indexed
export function tenantPlugin(schema: Schema) {
  schema.add({ businessId: { type: Schema.Types.ObjectId, required: true, index: true } });
}
