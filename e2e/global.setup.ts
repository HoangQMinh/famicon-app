import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'playwright/.auth/user.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_CIRCLE_ID = process.env.E2E_TEST_CIRCLE_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TEST_EMAIL || !TEST_CIRCLE_ID) {
  throw new Error(
    'Missing E2E env vars. Required: NEXT_PUBLIC_SUPABASE_URL, ' +
    'SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_EMAIL, E2E_TEST_CIRCLE_ID'
  );
}

setup('authenticate test user', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Tạo user với email đã confirmed (bypass OTP hoàn toàn)
  let userId: string;
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes('already been registered')) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === TEST_EMAIL);
      if (!existing) throw new Error(`Cannot find existing test user: ${TEST_EMAIL}`);
      userId = existing.id;
    } else {
      throw createError;
    }
  } else {
    userId = userData.user.id;
  }

  // 2. Upsert profile
  await admin.from('profiles').upsert(
    {
      id: userId,
      display_name: 'E2E Test User',
      avatar_emoji: '👨‍👩‍👧',
      location: 'Tokyo',
      kids_desc: 'Hai bé 3 và 5 tuổi',
      help_tags: ['pickup', 'childcare'],
    },
    { onConflict: 'id' }
  );

  // 3. Upsert circle membership
  await admin.from('circle_members').upsert(
    {
      user_id: userId,
      circle_id: TEST_CIRCLE_ID,
      is_active: true,
    },
    { onConflict: 'user_id,circle_id' }
  );

  // 4. Tạo magic link → navigate → session được set vào cookies tự động
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  });

  if (linkError || !linkData?.properties?.action_link) {
    throw new Error(`Failed to generate magic link: ${linkError?.message}`);
  }

  await page.goto(linkData.properties.action_link);
  await page.waitForURL('**/home', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/home/);

  // 5. Lưu session (cookies + localStorage) để dùng lại ở các test authenticated
  await page.context().storageState({ path: AUTH_FILE });
});
