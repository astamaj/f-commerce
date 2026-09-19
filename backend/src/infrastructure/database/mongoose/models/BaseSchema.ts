import mongoose, { Schema } from 'mongoose';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema.pre(type as any, function (this: Record<string, unknown>, next: Next) {
      if ((this.options as Record<string, unknown>)?.bypassTenantIsolation) {
        return next();
      }

      const tenantId = getTenantId();

      if (!tenantId) {
        return next(new Error('Tenant isolation failed: no businessId found in context'));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).where({ businessId: tenantId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update = (this as any).getUpdate?.();
      if (update) {
        if (update.businessId || update.$set?.businessId) {
          return next(
            new Error('Tenant isolation failed: cannot mutate businessId in update operation'),
          );
        }
      }

      next();
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre('aggregate' as any, function (this: any, next: Next) {
    if (this.options?.bypassTenantIsolation) {
      return next();
    }
    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error('Tenant isolation failed: no businessId found in context'));
    }
    this.pipeline().unshift({ $match: { businessId: new mongoose.Types.ObjectId(tenantId) } });
    next();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema.pre('save' as any, function (this: Record<string, unknown>, next: Next) {
    if ((this.$locals as Record<string, unknown>)?.bypassTenantIsolation) {
      return next();
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error('Tenant isolation failed: no businessId found in context on save'));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any).isNew || (this as any).isModified('businessId')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const businessId = (this as any).businessId;
      if (businessId && businessId.toString() !== tenantId.toString()) {
        return next(
          new Error('Tenant isolation failed: trying to save document for different businessId'),
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).businessId = tenantId;
    }

    next();
  });
}
