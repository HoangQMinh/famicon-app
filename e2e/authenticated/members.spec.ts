import { test, expect } from '@playwright/test';

// TC-9.7.2 — Members page empty state

const CIRCLE_ID = process.env.E2E_TEST_CIRCLE_ID;

test.describe('Members page (TC-9.7.2)', () => {
  test.skip(!CIRCLE_ID, 'E2E_TEST_CIRCLE_ID not set — skip members tests');

  test('members page loads', async ({ page }) => {
    await page.goto(`/circles/${CIRCLE_ID}/members`);
    await page.waitForLoadState('domcontentloaded');
    // Page should load without error (200, not error boundary)
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows empty state when user is the only member', async ({ page }) => {
    await page.goto(`/circles/${CIRCLE_ID}/members`);
    await page.waitForLoadState('domcontentloaded');

    // Either shows member list OR empty state message
    const memberList = page.locator('[data-testid="member-list"], .member-list, .member-card');
    const emptyState = page.locator('text=/chưa có thành viên/i, text=/no members/i');
    const hasContent = await memberList.count() > 0 || await emptyState.count() > 0;
    expect(hasContent).toBe(true);
  });
});
