import { test, expect } from '@playwright/test';

test.describe('/auth và /register pages (unauthenticated)', () => {
  test('/auth renders email input and submit button', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Gửi mã xác nhận/i })).toBeVisible();
  });

  test('/auth has link to /register', async ({ page }) => {
    await page.goto('/auth');
    const registerLink = page.getByRole('link', { name: /Đăng ký ngay/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
  });

  test('/register renders email input', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Gửi mã xác nhận/i })).toBeVisible();
  });
});
