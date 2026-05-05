import { test, expect } from '@playwright/test';

async function waitForSidebar(page: import('@playwright/test').Page) {
  const sidebar = page.getByRole('navigation', { name: 'Navigation' });
  await expect(sidebar).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  return sidebar;
}

test.describe('Sealed Secrets plugin smoke tests', () => {
  test('sidebar contains sealed-secrets entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = await waitForSidebar(page);
    await expect(sidebar.getByRole('button', { name: /sealed.secrets/i })).toBeVisible();
  });

  test('sidebar sealed-secrets entry is clickable and navigates to list view', async ({ page }) => {
    await page.goto('/');
    const sidebar = await waitForSidebar(page);

    const sealedSecretsEntry = sidebar.getByRole('button', { name: /sealed.secrets/i });
    await expect(sealedSecretsEntry).toBeVisible();
    await sealedSecretsEntry.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sealedsecrets/);
    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible();
  });

  test('sealed secrets list page renders table or empty state', async ({ page }) => {
    await page.goto('/c/main/sealedsecrets');
    await waitForSidebar(page);

    await expect(page.getByRole('heading', { name: /sealed.secrets/i })).toBeVisible({
      timeout: 15_000,
    });

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
    await waitForSidebar(page);

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
    const sidebar = await waitForSidebar(page);

    const sealedBtn = sidebar.getByRole('button', { name: /sealed.secrets/i }).first();
    await sealedBtn.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /sealed.secrets/i }).first()).toBeVisible({ timeout: 15_000 });

    const keysLink = sidebar.getByRole('link', { name: /sealing.key/i });
    await expect(keysLink).toBeVisible();
    await keysLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sealedsecrets\/keys$/);
    await expect(page.getByRole('heading', { name: /sealing.key/i }).first()).toBeVisible();

    const allSecretsLink = sidebar.getByRole('link', { name: /all sealed secrets/i });
    await expect(allSecretsLink).toBeVisible();
    await allSecretsLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/sealedsecrets(?!\/keys)/);
    await expect(page.getByRole('heading', { name: /sealed.secrets/i }).first()).toBeVisible();
  });

  test('plugin settings page shows sealed-secrets plugin entry', async ({ page }) => {
    await page.goto('/settings/plugins');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('table', { timeout: 10_000 }).catch(() => {});

    const pluginEntry = page.locator('text=/sealed.secrets/i').first();
    await expect(pluginEntry).toBeVisible({ timeout: 30_000 });
  });
});
