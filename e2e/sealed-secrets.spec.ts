import { test, expect } from '@playwright/test';

test.describe('Sealed Secrets plugin smoke tests', () => {
  test('sidebar contains sealed-secrets entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });
    await expect(sidebar.getByRole('button', { name: /sealed.secrets/i })).toBeVisible();
  });

  test('sidebar sealed-secrets entry is clickable and navigates to list view', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    const sealedSecretsEntry = sidebar.getByRole('button', { name: /sealed.secrets/i });
    await expect(sealedSecretsEntry).toBeVisible();
    await sealedSecretsEntry.click();

    await expect(page).toHaveURL(/\/sealedsecrets/);
    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible();
  });

  test('sealed secrets list page renders table or empty state', async ({ page }) => {
    await page.goto('/c/main/sealedsecrets');

    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible({
      timeout: 15_000,
    });

    // Either a populated table or an empty-state indicator must be visible
    const hasTable = await page.locator('table').first().isVisible().catch(() => false);
    const hasEmptyState = await page
      .locator('text=/no.*sealed|no.*secret|0 item|empty/i')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test('sealing keys page renders table or empty state', async ({ page }) => {
    await page.goto('/c/main/sealedsecrets/keys');

    await expect(page.getByRole('heading', { name: /sealing.key/i })).toBeVisible({
      timeout: 15_000,
    });

    const hasTable = await page.locator('table').first().isVisible().catch(() => false);
    const hasEmptyState = await page
      .locator('text=/no.*key|0 item|empty/i')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test('navigation between sealed-secrets views works', async ({ page }) => {
    await page.goto('/c/main/sealedsecrets');
    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible({
      timeout: 15_000,
    });

    // Navigate to Sealing Keys via sidebar
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });
    const keysLink = sidebar.getByRole('link', { name: /sealing.key/i });
    await expect(keysLink).toBeVisible();
    await keysLink.click();

    await expect(page).toHaveURL(/\/sealedsecrets\/keys$/);
    await expect(page.getByRole('heading', { name: /sealing.key/i })).toBeVisible();

    // Navigate back to All Sealed Secrets
    const allSecretsLink = sidebar.getByRole('link', { name: /all sealed secrets/i });
    await expect(allSecretsLink).toBeVisible();
    await allSecretsLink.click();

    await expect(page).toHaveURL(/\/sealedsecrets(?!\/keys)/);
    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible();
  });

  test('plugin settings page shows sealed-secrets plugin entry', async ({ page }) => {
    await page.goto('/settings/plugins');

    // Wait for plugin list to load — plugin scripts load asynchronously
    const pluginEntry = page.locator('text=sealed-secrets').first();
    await expect(pluginEntry).toBeVisible({ timeout: 30_000 });
  });
});
