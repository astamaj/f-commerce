import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './index.js';

describe('contracts scaffold', () => {
  it('parses the health response', () => {
    expect(
      healthResponseSchema.parse({
        success: true,
        data: { status: 'ok' },
        message: 'Backend is healthy',
      }),
    ).toMatchObject({ success: true });
  });

  it('rejects a health response with the wrong status', () => {
    expect(() =>
      healthResponseSchema.parse({
        success: true,
        data: { status: 'down' },
        message: 'Backend is healthy',
      }),
    ).toThrow();
  });
});
