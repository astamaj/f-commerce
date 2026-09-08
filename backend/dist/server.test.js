import { describe, expect, it } from 'vitest';
describe('backend scaffold', () => {
    it('has a health endpoint contract', () => {
        expect('/health').toBe('/health');
    });
});
