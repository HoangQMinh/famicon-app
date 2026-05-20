import { test, expect } from '@playwright/test';

// TC-9.9.2

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
  });

  test('profile page loads and shows display name', async ({ page }) => {
    await expect(page.getByText('E2E Test User')).toBeVisible();
  });

  test('"Chỉnh sửa hồ sơ" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i })).toBeVisible();
  });

  test('edit profile modal opens on button click', async ({ page }) => {
    await page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }).click();

    const modal = page.locator('[aria-label="Chỉnh sửa hồ sơ"][aria-modal="true"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /Lưu thay đổi/i })).toBeVisible();
  });

  test('edit modal closes when close button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }).click();

    const closeBtn = page.locator('[aria-label="Đóng"]').first();
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    await closeBtn.click();

    await expect(page.locator('[aria-modal="true"]')).not.toBeVisible();
  });
});
