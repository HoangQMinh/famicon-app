import { test, expect } from '@playwright/test';

// TC-9.9.4

test.describe('New Request form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new-request');
    await page.waitForLoadState('networkidle');
  });

  test('form renders with required fields', async ({ page }) => {
    await expect(page.locator('textarea#nr-detail')).toBeVisible();
    await expect(page.locator('input#nr-when')).toBeVisible();
    await expect(page.locator('input#nr-place')).toBeVisible();
  });

  test('submit button disabled when form is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Gửi nhờ giúp/i })).toBeDisabled();
  });

  test('submit button enabled after filling required fields', async ({ page }) => {
    await page.locator('textarea#nr-detail').fill('Nhờ đón con từ trường Sakura lúc 15:30');
    await page.locator('input#nr-when').fill('Hôm nay lúc 15:30');
    await page.locator('input#nr-place').fill('Trường Minato Sho, Yokohama');

    await expect(page.getByRole('button', { name: /Gửi nhờ giúp/i })).toBeEnabled();
  });

  test('submitting form navigates back to /home', async ({ page }) => {
    await page.locator('textarea#nr-detail').fill('Nhờ đón con từ trường Sakura lúc 15:30 E2E');
    await page.locator('input#nr-when').fill('Hôm nay lúc 15:30');
    await page.locator('input#nr-place').fill('Trường Minato Sho, Yokohama');

    await page.getByRole('button', { name: /Gửi nhờ giúp/i }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 5_000 });
  });
});
