import { describe, expect, it } from 'vitest';
import Home from './page';

describe('frontend scaffold', () => {
  it('exports the home page', () => {
    expect(Home).toBeTypeOf('function');
  });
});
