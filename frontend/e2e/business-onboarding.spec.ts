import { expect, test } from '@playwright/test';

// E2E for the onboarding + settings flow (spec 0004). Requires the dev stack:
// backend on :4000, frontend on :3000, MongoDB running.
// Covers AC-1, AC-4, AC-5. Run with: npm run e2e --workspace @f-commerce/frontend
test.describe('business onboarding flow', () => {
  test('owner who completed onboarding lands on the dashboard, not the wizard', async ({
    page,
  }) => {
    // Precondition: a logged-in OWNER whose business has onboardingComplete=true.
    // The page redirects away from the wizard to the dashboard.
    await page.goto('/onboarding');

    await page.waitForURL('/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /keep today moving/i })).toBeVisible();
  });

  test('a fresh owner walks the wizard to completion and reaches the dashboard', async ({
    page,
  }) => {
    // Precondition: logged in as an OWNER whose business is still incomplete.
    await page.goto('/onboarding');

    // Step 1: business name gates Continue
    const name = page.getByRole('textbox', { name: /business name/i });
    await expect(page.getByRole('button', { name: /^continue$/i })).toBeDisabled();
    await name.fill('E2E Test Co');
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Step 2: address
    await page.getByRole('heading', { name: /billing address/i }).waitFor();
    await page.getByRole('textbox', { name: /street/i }).fill('1 Test Street');
    await page.getByRole('textbox', { name: /city/i }).fill('Dhaka');
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Step 3: currency + logo (logo is optional, so skip the upload)
    await page.getByRole('heading', { name: /your currency and logo/i }).waitFor();
    await page.getByRole('combobox', { name: /currency/i }).selectOption('BDT');
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Step 4: review and finish
    await page.getByRole('heading', { name: /review and finish/i }).waitFor();
    await expect(page.getByText('E2E Test Co')).toBeVisible();
    await page.getByRole('button', { name: /enter order desk/i }).click();

    await page.waitForURL('/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /keep today moving/i })).toBeVisible();
  });

  test('owner edits the profile from settings and sees the confirmation', async ({ page }) => {
    await page.goto('/settings');

    const name = page.getByRole('textbox', { name: /business name/i });
    await name.fill('Renamed by E2E');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByRole('status', { name: /profile updated/i })).toBeVisible();
  });

  test('staff can view settings but not save', async ({ page }) => {
    // Precondition: logged in as a STAFF member.
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /business profile/i })).toBeVisible();
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByRole('alert', { name: /insufficient permissions/i })).toBeVisible();
  });
});
