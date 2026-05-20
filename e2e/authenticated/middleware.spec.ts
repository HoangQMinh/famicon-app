import { test, expect } from '@playwright/test';

// NOTE: `browser.newContext()` within an authenticated project inherits the
// project's storageState. Pass `{ storageState: { cookies: [], origins: [] } }`
// to explicitly create a context with NO stored auth (truly unauthenticated).
const FRESH_CONTEXT = { storageState: { cookies: [], origins: [] } };

test.describe('Middleware redirects', () => {
  test('unauthenticated access to /home redirects to /auth', async ({ browser }) => {
    const freshCtx = await browser.newContext(FRESH_CONTEXT);
    const page = await freshCtx.newPage();
    await page.goto('/home');
    await expect(page).toHaveURL(/\/auth/);
    await freshCtx.close();
  });

  test('unauthenticated access to /profile redirects to /auth', async ({ browser }) => {
    const freshCtx = await browser.newContext(FRESH_CONTEXT);
    const page = await freshCtx.newPage();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth/);
    await freshCtx.close();
  });

  test('unauthenticated access to /new-request redirects to /auth', async ({ browser }) => {
    const freshCtx = await browser.newContext(FRESH_CONTEXT);
    const page = await freshCtx.newPage();
    await page.goto('/new-request');
    await expect(page).toHaveURL(/\/auth/);
    await freshCtx.close();
  });

  test('authenticated user visiting /auth is redirected to /home', async ({ page }) => {
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/home/);
  });

  test('authenticated user visiting /register is redirected to /home', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/home/);
  });
});
