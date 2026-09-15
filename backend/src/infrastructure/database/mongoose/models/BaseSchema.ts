import { Schema } from 'mongoose';
import { getTenantId } from '../context.js';

export const baseSchemaOptions = {
  timestamps: true,
  optimisticConcurrency: true,
};

export const tenantSchemaOptions = {
  ...baseSchemaOptions,
};

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
    schema.pre(type as any, function (this: any, next) {
      if (this.options?.bypassTenantIsolation) {
        return next();
      }

      const tenantId = getTenantId();

      if (!tenantId) {
        return next(new Error('Tenant isolation failed: no businessId found in context'));
      }

      this.where({ businessId: tenantId });
      next();
    });
  });

  schema.pre('save', function (next) {
    if (this.$locals?.bypassTenantIsolation) {
      return next();
    }
    
    const tenantId = getTenantId();
    if (!tenantId) {
      return next(new Error('Tenant isolation failed: no businessId found in context on save'));
    }

    if (this.isNew || this.isModified('businessId')) {
      if (this.businessId && this.businessId.toString() !== tenantId.toString()) {
        return next(new Error('Tenant isolation failed: trying to save document for different businessId'));
      }
      this.businessId = tenantId;
    }

    next();
  });
}
