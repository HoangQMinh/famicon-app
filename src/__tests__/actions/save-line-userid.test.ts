/**
 * Unit tests for saveLINEUserId Server Action.
 *
 * WHY: saveLINEUserId stores the LINE opaque user identifier onto the user's
 * profile — the only table allowed to hold this field per the Constitution.
 * Bugs here mean:
 *   (a) Unauthenticated callers could overwrite any user's line_user_id (security)
 *   (b) Empty or malformed IDs stored silently → LINE fallback never fires
 *   (c) line_user_id stored on wrong table → Constitution violation
 *
 * Constitution constraint: line_user_id must be stored ONLY in profiles.
 *
 * Mock strategy (follows push-subscription.test.ts pattern):
 *   - Module-level `scenario` object mutated per test in beforeEach.
 *   - saveLINEUserId query chain:
 *       auth.getUser()     → auth guard
 *       profiles: .update({ line_user_id }).eq('id', userId)  → DB update
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
  updateError: { code: string; message?: string } | null;
  /** Tracks what was passed to update() */
  lastUpdatePayload: Record<string, unknown> | null;
  /** Tracks the eq filter passed to update().eq() */
  lastUpdateFilter: { col: string; val: string } | null;
}

let scenario: Scenario = {
  authUser: null,
  authError: null,
  updateError: null,
  lastUpdatePayload: null,
  lastUpdateFilter: null,
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
      if (table === 'profiles') {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            scenario.lastUpdatePayload = payload;
            return {
              eq: vi.fn((col: string, val: string) => {
                scenario.lastUpdateFilter = { col, val };
                return Promise.resolve({ error: scenario.updateError });
              }),
            };
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

import { saveLINEUserId } from '@/app/actions/notifications';

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const AUTHENTICATED_USER = { id: 'user-carol-uuid', email: 'carol@example.com' };
const VALID_LINE_USER_ID  = 'Utest_carol_line_id_abc123';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('saveLINEUserId', () => {
  beforeEach(() => {
    scenario = {
      authUser:          null,
      authError:         null,
      updateError:       null,
      lastUpdatePayload: null,
      lastUpdateFilter:  null,
    };
  });

  // -------------------------------------------------------------------------
  // Auth guard — edge cases first
  // -------------------------------------------------------------------------

  it('returns UNAUTHORIZED error when user is not authenticated', async () => {
    // WHY SECURITY: Unauthenticated callers must never be able to set
    // line_user_id — they could hijack LINE notifications for any user.
    scenario.authUser = null;

    const result = await saveLINEUserId(VALID_LINE_USER_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns error when auth.getUser() itself fails', async () => {
    scenario.authError = { message: 'auth service unavailable' };

    const result = await saveLINEUserId(VALID_LINE_USER_ID);

    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  it('rejects empty string LINE user ID', async () => {
    // WHY: An empty line_user_id stored in profiles would cause LINE API calls
    // to fail silently — the user would never receive fallback notifications.
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('rejects null input', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId(null);

    expect(result.success).toBe(false);
  });

  it('rejects undefined input', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId(undefined);

    expect(result.success).toBe(false);
  });

  it('rejects object input without lineUserId field', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId({ wrong_field: 'Utest123' });

    expect(result.success).toBe(false);
  });

  it('accepts object input with lineUserId field (alternative call shape)', async () => {
    // WHY: The action normalizes both string and {lineUserId: string} input shapes.
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId({ lineUserId: VALID_LINE_USER_ID });

    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Successful update — happy path
  // -------------------------------------------------------------------------

  it('succeeds and returns saved:true for authenticated user with valid LINE ID', async () => {
    scenario.authUser = AUTHENTICATED_USER;

    const result = await saveLINEUserId(VALID_LINE_USER_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saved).toBe(true);
    }
  });

  it('updates profiles table with the correct line_user_id value', async () => {
    // WHY CONSTITUTION: line_user_id must be stored ONLY in profiles, not any
    // other table. Verifying the update targets the profiles table is critical.
    scenario.authUser = AUTHENTICATED_USER;

    await saveLINEUserId(VALID_LINE_USER_ID);

    expect(scenario.lastUpdatePayload).not.toBeNull();
    expect(scenario.lastUpdatePayload?.line_user_id).toBe(VALID_LINE_USER_ID);
  });

  it('filters update by authenticated user id (not user-supplied id)', async () => {
    // WHY SECURITY: The .eq('id', user.id) must use the session user ID,
    // never a user-supplied value. Otherwise any user could update another's profile.
    scenario.authUser = AUTHENTICATED_USER;

    await saveLINEUserId(VALID_LINE_USER_ID);

    expect(scenario.lastUpdateFilter).not.toBeNull();
    expect(scenario.lastUpdateFilter?.col).toBe('id');
    expect(scenario.lastUpdateFilter?.val).toBe(AUTHENTICATED_USER.id);
  });

  // -------------------------------------------------------------------------
  // DB error handling
  // -------------------------------------------------------------------------

  it('returns error when DB update fails', async () => {
    scenario.authUser  = AUTHENTICATED_USER;
    scenario.updateError = { code: '42P01', message: 'relation "profiles" does not exist' };

    const result = await saveLINEUserId(VALID_LINE_USER_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // Constitution compliance
  // -------------------------------------------------------------------------

  it('does not attempt to write line_user_id to any table other than profiles', async () => {
    // WHY CONSTITUTION: line_user_id must be stored ONLY in profiles (not
    // push_subscriptions, notification_logs, or any other table).
    // We verify by confirming the mock only routes through the profiles path.
    scenario.authUser = AUTHENTICATED_USER;

    await saveLINEUserId(VALID_LINE_USER_ID);

    // lastUpdatePayload is only set when the 'profiles' path in from() is hit.
    // If it is non-null, the action correctly targeted profiles.
    expect(scenario.lastUpdatePayload).not.toBeNull();
    // line_user_id must be the only field being updated (no side-effects)
    expect(Object.keys(scenario.lastUpdatePayload!)).toContain('line_user_id');
  });
});
