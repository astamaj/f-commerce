import { expect, test } from '@playwright/test';

test.describe('seller console foundation', () => {
  test('renders a complete dashboard surface', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /keep today moving/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: "Today's pulse" })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' }).first()).toHaveAttribute(
      'href',
      '/orders',
    );

    const viewport = page.viewportSize();
    const navigationName =
      viewport && viewport.width < 1024 ? 'Mobile navigation' : 'Primary navigation';
    await expect(page.getByRole('navigation', { name: navigationName })).toBeVisible();
  });
});
