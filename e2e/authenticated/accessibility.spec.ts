import { test, expect } from '@playwright/test';

// TC-9.5.2 — aria-labels on icon-only buttons

test.describe('Accessibility — aria-labels', () => {
  test('FAB has aria-label on /home', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Đăng nhờ giúp"]')).toBeVisible();
  });

  test('bell icon link has aria-label on /home', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-label="Thông báo"]')).toBeVisible();
  });

  test('bottom nav has accessible label', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav[aria-label="Điều hướng chính"]')).toBeVisible();
  });

  test('edit profile modal close button has aria-label', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }).click();
    await expect(page.locator('[aria-label="Đóng"]')).toBeVisible({ timeout: 3_000 });
  });
});
