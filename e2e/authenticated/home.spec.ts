import { test, expect } from '@playwright/test';

// TC-9.7.1, TC-9.5.2

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 8_000 });
  });

  test('top header is visible (TC-9.7.1)', async ({ page }) => {
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 5_000 });
  });

  test('shows feed or empty state (TC-9.7.1)', async ({ page }) => {
    const feedOrEmpty = page.locator('.request-card, .empty-state');
    await expect(feedOrEmpty.first()).toBeVisible({ timeout: 8_000 });
  });

  test('FAB visible with correct aria-label (TC-9.5.2)', async ({ page }) => {
    const fab = page.locator('[aria-label="Đăng nhờ giúp"]');
    await expect(fab).toBeVisible();
  });

  test('FAB navigates to /new-request', async ({ page }) => {
    await page.locator('[aria-label="Đăng nhờ giúp"]').click();
    await expect(page).toHaveURL(/\/new-request/);
  });

  test('bell/notification icon has aria-label (TC-9.5.2)', async ({ page }) => {
    const bellLink = page.locator('[aria-label="Thông báo"]');
    await expect(bellLink).toBeVisible();
  });

  test('bottom nav is visible with all tabs', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Điều hướng chính"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Vòng của tôi')).toBeVisible();
    await expect(nav.getByText('Nhờ giúp')).toBeVisible();
    await expect(nav.getByText('Hồ sơ')).toBeVisible();
  });
});
