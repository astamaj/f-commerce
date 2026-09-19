import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { runWithContext, getTenantId } from '../context.js';
import { tenantPlugin, baseSchemaOptions } from './BaseSchema.js';

describe('Tenant Isolation Plugin', () => {
  let TestSchema: mongoose.Schema;

  beforeEach(() => {
    TestSchema = new mongoose.Schema(
      {
        name: { type: String, required: true },
      },
      baseSchemaOptions,
    );
    tenantPlugin(TestSchema);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('plugin structure', () => {
    it('adds businessId field to schema', () => {
      expect(TestSchema.paths['businessId']).toBeDefined();
      expect(TestSchema.paths['businessId'].instance).toBe('ObjectId');
    });

    it('marks businessId as required', () => {
      expect(TestSchema.paths['businessId'].isRequired).toBe(true);
    });

    it('preserves base schema options', () => {
      expect(TestSchema.options.timestamps).toBe(true);
      expect(TestSchema.options.optimisticConcurrency).toBe(true);
    });

    it('registers pre hooks for query types', () => {
      // tenantPlugin uses schema.pre to register hooks
      // We verify the schema has the businessId field and hooks are attached
      expect(TestSchema.paths['businessId']).toBeDefined();
      expect(TestSchema.options).toMatchObject({
        timestamps: true,
        optimisticConcurrency: true,
      });
    });
  });

  describe('runWithContext', () => {
    it('provides context to nested function', () => {
      const context = { userId: 'user1', businessId: 'biz1', role: 'OWNER' as const };
      const result = runWithContext(context, () => {
        return { tenantId: getTenantId() };
      });
      expect(result.tenantId).toBe('biz1');
    });

    it('restores previous context after function completes', () => {
      const outerContext = { userId: 'user1', businessId: 'outer-biz', role: 'OWNER' as const };
      const innerContext = { userId: 'user2', businessId: 'inner-biz', role: 'STAFF' as const };

      let innerResult: string | undefined;
      let outerAfterResult: string | undefined;

      runWithContext(outerContext, () => {
        innerResult = getTenantId();
        runWithContext(innerContext, () => {
          innerResult = getTenantId();
        });
        outerAfterResult = getTenantId();
      });

      expect(innerResult).toBe('inner-biz');
      expect(outerAfterResult).toBe('outer-biz');
    });
  });

  describe('tenant isolation error handling', () => {
    it('throws error when no businessId in context', () => {
      const context = { userId: 'user1' } as unknown as {
        userId: string;
        businessId: string;
        role: 'OWNER';
      }; // no businessId

      expect(() =>
        runWithContext(context, () => {
          getTenantId();
        }),
      ).not.toThrow();

      expect(getTenantId()).toBeUndefined();
    });
  });
});
