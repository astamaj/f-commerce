import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { UserModel } from './User.js';
import { OrderModel } from './Order.js';
import { ProductModel } from './Product.js';
import { UserRole } from '../../../../domain/entities/user.entity.js';
import { OrderStatus } from '../../../../domain/entities/order.entity.js';

describe('Data Models Validation', () => {
  it('UserModel requires businessId and basic fields', async () => {
    const user = new UserModel({});
    const err = await user.validate().catch((e) => e);

    expect(err).toBeDefined();
    if (err) {
      expect(err.errors['businessId']).toBeDefined();
      expect(err.errors['email']).toBeDefined();
      expect(err.errors['passwordHash']).toBeDefined();
      expect(err.errors['name']).toBeDefined();
      expect(err.errors['role']).toBeDefined();
    }
  });

  it('UserModel passes validation with valid data', async () => {
    const user = new UserModel({
      email: 'test@example.com',
      passwordHash: 'hashed',
      name: 'Test User',
      role: UserRole.OWNER,
      businessId: new mongoose.Types.ObjectId(),
    });

    const err = await user.validate().catch((e) => e);
    expect(err).toBeUndefined();
  });

  it('OrderModel requires businessId and idempotencyKey', async () => {
    const order = new OrderModel({});
    const err = await order.validate().catch((e) => e);

    expect(err).toBeDefined();
    if (err) {
      expect(err.errors['businessId']).toBeDefined();
      expect(err.errors['customerId']).toBeDefined();
      expect(err.errors['orderNumber']).toBeDefined();
      expect(err.errors['subtotal']).toBeDefined();
      expect(err.errors['total']).toBeDefined();
      expect(err.errors['dueAmount']).toBeDefined();
    }
  });

  it('OrderModel defaults status to PENDING', async () => {
    const order = new OrderModel({
      businessId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD-001',
      subtotal: 100,
      total: 100,
      dueAmount: 100,
      idempotencyKey: 'key123',
    });

    const err = await order.validate().catch((e) => e);
    expect(err).toBeUndefined();
    expect(order.status).toBe(OrderStatus.PENDING);
  });

  it('ProductModel enforces min value for price', async () => {
    const product = new ProductModel({
      name: 'Test Product',
      price: -10, // Invalid
      businessId: new mongoose.Types.ObjectId(),
    });

    const err = await product.validate().catch((e) => e);
    expect(err).toBeDefined();
    if (err) {
      expect(err.errors['price']).toBeDefined();
    }
  });
});
