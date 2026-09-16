import { Schema } from 'mongoose';
import { getTenantId } from '../context.js';

export const baseSchemaOptions = {
  timestamps: true,
  optimisticConcurrency: true,
};

export const tenantSchemaOptions = {
  ...baseSchemaOptions,
};

type Next = (error?: Error) => void;

// Reusable plugin to ensure businessId is indexed and isolated
export function tenantPlugin(schema: Schema) {
  schema.add({ businessId: { type: Schema.Types.ObjectId, required: true, index: true } });

  const types = [
    'find',
    'findOne',
    'countDocuments',
    'estimatedDocumentCount',
    'findOneAndUpdate',
    'updateMany',
    'updateOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'deleteMany',
    'deleteOne',
  ];

  types.forEach((type) => {
    schema.pre(type as any, function (this: Record<string, unknown>, next: Next) {
      if ((this.options as Record<string, unknown>)?.bypassTenantIsolation) {
        return next();
      }

      const tenantId = getTenantId();

      if (!tenantId) {
        return next(new Error('Tenant isolation failed: no businessId found in context'));
      }

      (this as any).where({ businessId: tenantId });
      next();
    });
  });

  schema.pre('save' as any, function (this: Record<string, unknown>, next: Next) {
    if ((this.$locals as Record<string, unknown>)?.bypassTenantIsolation) {
      return next();
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error('Tenant isolation failed: no businessId found in context on save'));
    }

    if ((this as any).isNew || (this as any).isModified('businessId')) {
      const businessId = (this as any).businessId;
      if (businessId && businessId.toString() !== tenantId.toString()) {
        return next(new Error('Tenant isolation failed: trying to save document for different businessId'));
      }
      (this as any).businessId = tenantId;
    }

    next();
  });
}
