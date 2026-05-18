/**
 * Integration tests for savePushSubscription Server Action.
 *
 * WHY: savePushSubscription is the entry point that stores Web Push credentials
 * in the DB. Bugs here mean either:
 *   (a) Valid subscriptions silently dropped → user never receives notifications, or
 *   (b) Unauthorized subscriptions written → potential spoofing.
 *   (c) Duplicate rows on re-subscribe → wasted DB storage and double-send bugs.
 *
 * Mock strategy (follows create-request.test.ts pattern):
 *   - Module-level `scenario` object mutated per test in beforeEach.
 *   - Supabase mock dispatches on scenario state.
 *   - savePushSubscription query chain:
 *       auth.getUser()     → auth guard
 *       push_subscriptions: .upsert({...})  → upsert row
 *
 * Note: The actual upsert deduplication (no duplicate rows) is enforced by
 * Supabase unique constraint (user_id, endpoint). In this mock environment we
 * verify the action sends the correct upsert call rather than an insert.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Required mocks for Next.js server environment
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Scenario shape
// ---------------------------------------------------------------------------

interface Scenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  upsertError: { code: string; message?: string } | null;
  /** Tracks what was passed to upsert() for assertion */
  lastUpsertPayload: Record<string, unknown> | null;
  /** Tracks onConflict option passed to upsert() */
  lastUpsertOptions: Record<string, unknown> | null;
}

let scenario: Scenario = {
  authUser: null,
  authError: null,
  upsertError: null,
  lastUpsertPayload: null,
  lastUpsertOptions: null,
};

// ---------------------------------------------------------------------------
// Mock: @/lib/supabase/server
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        if (scenario.authError) {
          return { data: { user: null }, error: scenario.authError };
        }
        if (!scenario.authUser) {
          return { data: { user: null }, error: { message: 'not authenticated' } };
        }
        return { data: { user: scenario.authUser }, error: null };
      }),
    },

    from: (table: string) => {
      if (table === 'push_subscriptions') {
        return {
          upsert: vi.fn((payload: Record<string, unknown>, opts: Record<string, unknown>) => {
            scenario.lastUpsertPayload = payload;
            scenario.lastUpsertOptions = opts;
            return Promise.resolve({ error: scenario.upsertError });
          }),
        };
      }
      return {};
    },
  })),
}));

// ---------------------------------------------------------------------------
// Import action AFTER mocks
// ---------------------------------------------------------------------------

import { savePushSubscription } from '@/app/actions/notifications';

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const AUTHENTICATED_USER = { id: 'user-bob-uuid', email: 'bob@example.com' };

const VALID_SUBSCRIPTION = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
  keys: {
    p256dh: 'BNV7QEe_5Rp3oANf3xxxxxxxx',
    auth: 'tBnzqFRWxxx',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('savePushSubscription', () => {
  beforeEach(() => {
    scenario = {
      authUser: null,
      authError: null,
      upsertError: null,
      lastUpsertPayload: null,
      lastUpsertOptions: null,
    };
  });

  // -------------------------------------------------------------------------
  // Auth guard — edge cases first
  // -------------------------------------------------------------------------

  it('returns UNAUTHORIZED error when user is not authenticated', async () => {
    // WHY SECURITY: Unauthenticated calls must never reach the DB. An attacker
    // could otherwise write arbitrary push endpoints under any user_id.
    scenario.authUser = null;

    const result = await savePushSubscription(VALID_SUBSCRIPTION);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns error when auth.getUser() itself throws', async () => {
    scenario.authUser = null;
    scenario.authError = { message: 'auth service unavailable' };

    const result = await savePushSubscription(VALID_SUBSCRIPTION);

    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  it('rejects invalid subscription — missing endpoint', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await savePushSubscription({
      // endpoint intentionally missing
      keys: { p256dh: 'abc', auth: 'def' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid subscription — empty endpoint string', async () => {
    // WHY: Empty endpoint would cause web-push to throw a cryptic error later;
    // catch at the action boundary with a clear user-facing message.
    scenario.authUser = AUTHENTICATED_USER;

    const result = await savePushSubscription({
      endpoint: '',
      keys: { p256dh: 'abc', auth: 'def' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid subscription — endpoint not a URL', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await savePushSubscription({
      endpoint: 'not-a-valid-url',
      keys: { p256dh: 'abc', auth: 'def' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid subscription — missing keys.p256dh', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await savePushSubscription({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { auth: 'def' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects null input entirely', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await savePushSubscription(null);

    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Successful upsert — happy path
  // -------------------------------------------------------------------------

  it('succeeds and returns saved:true for authenticated user with valid input', async () => {
    scenario.authUser = AUTHENTICATED_USER;
    scenario.upsertError = null;

    const result = await savePushSubscription(VALID_SUBSCRIPTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saved).toBe(true);
    }
  });

  it('sends upsert with correct column mapping (keys.auth → auth_key)', async () => {
    // WHY: 'auth' is a reserved word in Postgres; the column is named auth_key.
    // If the action maps it incorrectly, the DB insert silently fails or
    // writes to the wrong column — push notifications will fail with 401.
    scenario.authUser = AUTHENTICATED_USER;
    scenario.upsertError = null;

    await savePushSubscription(VALID_SUBSCRIPTION);

    expect(scenario.lastUpsertPayload).not.toBeNull();
    expect(scenario.lastUpsertPayload).toMatchObject({
      user_id: AUTHENTICATED_USER.id,
      endpoint: VALID_SUBSCRIPTION.endpoint,
      p256dh: VALID_SUBSCRIPTION.keys.p256dh,
      auth_key: VALID_SUBSCRIPTION.keys.auth, // mapped from keys.auth → auth_key
    });
  });

  it('uses upsert with onConflict on (user_id, endpoint) — no duplicate rows', async () => {
    // WHY: If a user re-subscribes (e.g. browser refreshes keys), we must UPDATE
    // the existing row, not INSERT a new one. Duplicates would cause double-send.
    scenario.authUser = AUTHENTICATED_USER;
    scenario.upsertError = null;

    await savePushSubscription(VALID_SUBSCRIPTION);

    expect(scenario.lastUpsertOptions).not.toBeNull();
    expect(scenario.lastUpsertOptions?.onConflict).toBe('user_id,endpoint');
  });

  it('sets user_id to the authenticated user id (not from input)', async () => {
    // WHY SECURITY: user_id must come from the server-side auth session,
    // never from user-supplied input. Otherwise any user could claim another's user_id.
    scenario.authUser = AUTHENTICATED_USER;
    scenario.upsertError = null;

    await savePushSubscription(VALID_SUBSCRIPTION);

    expect(scenario.lastUpsertPayload?.user_id).toBe(AUTHENTICATED_USER.id);
  });

  // -------------------------------------------------------------------------
  // DB error handling
  // -------------------------------------------------------------------------

  it('returns error when DB upsert fails', async () => {
    scenario.authUser = AUTHENTICATED_USER;
    scenario.upsertError = { code: '23505', message: 'unique constraint violation' };

    const result = await savePushSubscription(VALID_SUBSCRIPTION);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('lưu subscription');
    }
  });
});
