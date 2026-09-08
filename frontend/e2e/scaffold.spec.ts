import { expect, test } from '@playwright/test';

test.describe('frontend scaffold', () => {
  test('renders the home page on desktop and mobile', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /to get started/i })).toBeVisible();
    await expect(page.getByAltText('Next.js logo')).toBeVisible();
  });

  test('keeps the learning resource reachable', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Learning' })).toHaveAttribute(
      'href',
      'https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app',
    );
  });
});
