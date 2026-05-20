import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { stringToBase64URL } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'playwright/.auth/user.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL!;
const TEST_CIRCLE_ID = process.env.E2E_TEST_CIRCLE_ID!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_CIRCLE_ID) {
  throw new Error(
    'Missing E2E env vars. Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
    'SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_EMAIL, E2E_TEST_CIRCLE_ID'
  );
}

// Derive cookie name from project ref (extracted from Supabase URL)
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) throw new Error('Cannot extract project ref from SUPABASE_URL');
const COOKIE_NAME = `sb-${projectRef}-auth-token`;

// Fixed test password — only used by E2E setup, never exposed in UI
const TEST_PASSWORD = 'E2ETestPassword_Sprint10!';

setup('authenticate test user', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create or find test user (email already confirmed)
  let userId: string;
  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
    password: TEST_PASSWORD,
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes('already') || msg.includes('user_already_exists')) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === TEST_EMAIL);
      if (!existing) throw new Error(`Cannot find existing test user: ${TEST_EMAIL}`);
      userId = existing.id;

      // Ensure password is set for existing user (may have been created without one)
      await admin.auth.admin.updateUserById(userId, {
        password: TEST_PASSWORD,
        email_confirm: true,
      });
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

  // 4. Sign in with password using anon key → get real session
  //    This uses Supabase Auth REST API directly (not service role).
  //    The resulting session has the correct user JWT that RLS policies accept.
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError || !signInData?.session) {
    throw new Error(`Sign-in failed: ${signInError?.message ?? 'no session returned'}`);
  }

  const session = signInData.session;

  // 5. Encode session in @supabase/ssr base64url format and inject as cookie.
  //    @supabase/ssr reads cookies as: "base64-" + stringToBase64URL(JSON.stringify(session))
  //    Single-cookie approach works when encoded length < MAX_CHUNK_SIZE (3180 chars).
  const encoded = 'base64-' + stringToBase64URL(JSON.stringify(session));

  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  const hostname = new URL(BASE_URL).hostname;

  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: encoded,
      domain: hostname,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // 6. Navigate to /home to verify the session cookie is accepted by the middleware
  await page.goto(`${BASE_URL}/home`);
  await page.waitForURL('**/home', { timeout: 30_000 });
  await expect(page).toHaveURL(/\/home/);

  // 7. Save storage state (cookies + localStorage) for reuse in authenticated tests
  await page.context().storageState({ path: AUTH_FILE });
});
