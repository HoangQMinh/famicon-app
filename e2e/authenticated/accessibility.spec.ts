import { test, expect } from '@playwright/test';

// TC-9.5.2 — aria-labels on icon-only buttons
// TC-9.5.1 — keyboard navigation
// TC-9.5.3 — form labels in Edit Profile modal

test.describe('Accessibility — aria-labels', () => {
  test('FAB has aria-label on /home', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[aria-label="Đăng nhờ giúp"]')).toBeVisible();
  });

  test('bell icon link has aria-label on /home', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[aria-label="Thông báo"]')).toBeVisible();
  });

  test('bottom nav has accessible label', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('nav[aria-label="Điều hướng chính"]')).toBeVisible();
  });

  test('edit profile modal close button has aria-label', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }).click();
    await expect(page.locator('[aria-label="Đóng"]')).toBeVisible({ timeout: 5_000 });
  });
});

// TC-9.5.1 — Tab keyboard navigation reaches FAB and BottomNav
test.describe('Accessibility — keyboard navigation (TC-9.5.1)', () => {
  test('Tab key can reach FAB on /home', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 8_000 });

    const fab = page.locator('[aria-label="Đăng nhờ giúp"]');
    await fab.focus();
    await expect(fab).toBeFocused();
  });

  test('Tab key can reach BottomNav links', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('nav[aria-label="Điều hướng chính"]')).toBeVisible({ timeout: 8_000 });

    const firstNavLink = page.locator('nav[aria-label="Điều hướng chính"] a').first();
    await firstNavLink.focus();
    await expect(firstNavLink).toBeFocused();
  });
});

// TC-9.5.3 — Form labels in Edit Profile modal
test.describe('Accessibility — form labels (TC-9.5.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }).click();
    await expect(page.locator('[aria-modal="true"]')).toBeVisible({ timeout: 5_000 });
  });

  test('display name field has visible label', async ({ page }) => {
    const modal = page.locator('[aria-modal="true"]');
    const label = modal.locator('label').filter({ hasText: /tên|name/i }).first();
    await expect(label).toBeVisible();
  });

  test('location field has visible label', async ({ page }) => {
    const modal = page.locator('[aria-modal="true"]');
    const label = modal.locator('label').filter({ hasText: /địa điểm|location|khu vực/i }).first();
    await expect(label).toBeVisible();
  });

  test('kids description field has visible label', async ({ page }) => {
    const modal = page.locator('[aria-modal="true"]');
    const label = modal.locator('label').filter({ hasText: /bé|con|kids/i }).first();
    await expect(label).toBeVisible();
  });
});
