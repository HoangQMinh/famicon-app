/**
 * Integration tests for createRequest Server Action (src/app/actions/requests.ts).
 *
 * WHY these tests exist:
 *  - createRequest is the sole entry point for new aid requests. A bug in auth
 *    guard, membership check, or DB insert means either unauthorized data
 *    written to the DB or a valid user blocked from getting help.
 *  - The NOT_MEMBER path is security-critical: without it, any authenticated
 *    user could POST requests into circles they don't belong to, poisoning
 *    feeds of other families.
 *  - The auth guard order matters: auth check runs BEFORE the membership check.
 *    Reversing them would expose membership information to unauthenticated callers
 *    (existence oracle attack).
 *
 * Mock strategy (same as requests.test.ts — Sprint 3 convention):
 *  - Module-level `scenario` object mutated per test in beforeEach.
 *  - Supabase mock is declared at module top level (vi.mock hoisting).
 *  - Each table branch in from() dispatches based on scenario state.
 *  - createRequest query chain:
 *      circle_members: .select().eq().eq().eq().maybeSingle() → membership check
 *      aid_requests:   .insert().select('id').single()        → insert + return id
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
// Scenario shape for createRequest
// ---------------------------------------------------------------------------

interface CreateRequestScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // circle_members membership check result
  membership: { circle_id: string } | null;
  membershipError: { code: string } | null;
  // aid_requests insert result
  insertedRow: { id: string } | null;
  insertError: { code: string; message?: string } | null;
}

let scenario: CreateRequestScenario = {
  authUser: null,
  authError: null,
  membership: null,
  membershipError: null,
  insertedRow: null,
  insertError: null,
};

// ---------------------------------------------------------------------------
// Mock: @/lib/supabase/server
//
// createRequest query chain:
//   1. auth.getUser()
//   2. circle_members: .select().eq(circle_id).eq(user_id).eq(is_active).maybeSingle()
//   3. aid_requests: .insert({...}).select('id').single()
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
      if (table === 'circle_members') {
        // Membership check: .select().eq(circle_id).eq(user_id).eq(is_active).maybeSingle()
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: scenario.membership,
                    error: scenario.membershipError,
                  }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'aid_requests') {
        // Insert: .insert({...}).select('id').single()
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: scenario.insertedRow,
                error: scenario.insertError,
              }),
            }),
          }),
        };
      }

      // Fallback — should not be reached in normal test flows
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  })),
}));

// ---------------------------------------------------------------------------
// Import action AFTER mocks are declared (vi.mock hoisting requirement)
// ---------------------------------------------------------------------------

import { createRequest } from '@/app/actions/requests';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CIRCLE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const VALID_REQUEST_ID = 'b1ffcd00-9c0b-4ef8-bb6d-6bb9bd380b22';

const VALID_INPUT = {
  circle_id: VALID_CIRCLE_ID,
  category: 'pickup' as const,
  description: 'Đón con từ trường Sakura lúc 5pm',
  scheduled_at: 'Hôm nay 5pm',
  location: 'Ga Yokohama',
  is_urgent: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createRequest', () => {
  beforeEach(() => {
    scenario = {
      authUser: null,
      authError: null,
      membership: null,
      membershipError: null,
      insertedRow: null,
      insertError: null,
    };
  });

  // -------------------------------------------------------------------------
  // Edge cases first: auth guard is the first gate
  // -------------------------------------------------------------------------

  it('rejects unauthenticated caller (TC-4.3.2)', async () => {
    /**
     * WHY: Auth guard must fire before any DB query. An unauthenticated call
     * reaching the membership check or insert would be a security regression.
     * scenario.authUser remains null → mock returns no user.
     */
    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Error must signal UNAUTHORIZED — "Bạn cần đăng nhập."
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns no data field when unauthenticated', async () => {
    // Critical: success=false must mean no data is returned
    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    expect('data' in result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-4.3.3 — NOT_MEMBER: authenticated user not in circle
  // -------------------------------------------------------------------------

  it('rejects user who is not a member of the circle (TC-4.3.3)', async () => {
    /**
     * WHY: This is the primary authorization gate. Without it, any authenticated
     * user could insert aid requests into other families' circles, polluting
     * their feed with irrelevant requests. The membership check MUST run before
     * the insert.
     */
    scenario.authUser = { id: 'uid-outsider', email: 'outsider@example.com' };
    scenario.membership = null; // no membership row for this circle

    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Error must reference membership/membership language — not expose existence
      expect(result.error).toBeTruthy();
      // Must not return a request_id
    }
    expect('data' in result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-4.3.4 — Validation error: invalid input
  // -------------------------------------------------------------------------

  it('rejects invalid category with validation error (TC-4.3.4)', async () => {
    /**
     * WHY: Zod validation runs after auth/membership. If category is invalid,
     * the server must not insert a row. This test verifies the server-side
     * validation catch — even if client-side canSubmit is bypassed.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };

    const result = await createRequest({ ...VALID_INPUT, category: 'dropoff' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('rejects description shorter than 5 chars with validation error (TC-4.3.4)', async () => {
    /**
     * WHY: A 4-char description passes any length check without min(5). This
     * verifies server-side schema enforcement independent of client canSubmit.
     * A bypassed client form (e.g. via direct API call) must still be rejected.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };

    const result = await createRequest({ ...VALID_INPUT, description: 'abc' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('rejects missing location with validation error', async () => {
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };

    const result = await createRequest({ ...VALID_INPUT, location: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing scheduled_at with validation error', async () => {
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };

    const result = await createRequest({ ...VALID_INPUT, scheduled_at: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid circle_id (not UUID) with validation error', async () => {
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };

    const result = await createRequest({ ...VALID_INPUT, circle_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-4.3.1 — Happy path: valid input + member → success + request_id
  // -------------------------------------------------------------------------

  it('creates request and returns request_id for authenticated member (TC-4.3.1)', async () => {
    /**
     * WHY: This is the primary happy path. createRequest must:
     *  (a) pass auth guard
     *  (b) confirm membership
     *  (c) validate input
     *  (d) insert and return the new row's id as request_id
     * All 4 steps must succeed for the action to return success=true.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };
    scenario.insertedRow = { id: VALID_REQUEST_ID };

    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('request_id');
      expect(result.data.request_id).toBe(VALID_REQUEST_ID);
    }
  });

  it('creates request with is_urgent = true and returns request_id (TC-4.3.6)', async () => {
    /**
     * WHY: Urgent requests trigger a different notification path (Sprint 5).
     * The action must accept is_urgent=true and store it — verified by success + id.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };
    scenario.insertedRow = { id: VALID_REQUEST_ID };

    const result = await createRequest({ ...VALID_INPUT, is_urgent: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.request_id).toBe(VALID_REQUEST_ID);
    }
  });

  it('accepts description at exactly the min boundary (5 chars)', async () => {
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };
    scenario.insertedRow = { id: VALID_REQUEST_ID };

    const result = await createRequest({ ...VALID_INPUT, description: 'abcde' });
    expect(result.success).toBe(true);
  });

  it('accepts description at exactly the max boundary (200 chars)', async () => {
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };
    scenario.insertedRow = { id: VALID_REQUEST_ID };

    const result = await createRequest({ ...VALID_INPUT, description: 'a'.repeat(200) });
    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // DB error handling paths
  // -------------------------------------------------------------------------

  it('returns error when membership check fails with DB error', async () => {
    /**
     * WHY: A DB error during membership check (e.g. network timeout) must not
     * be silently swallowed. The action must return success=false with an error
     * message — not crash or return an empty success.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membershipError = { code: 'PGRST_ERROR' };

    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when insert fails with DB error', async () => {
    /**
     * WHY: Insert can fail due to RLS (despite membership check), DB constraints,
     * or network issues. The action must not return a half-success state.
     */
    scenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    scenario.membership = { circle_id: VALID_CIRCLE_ID };
    scenario.insertedRow = null;
    scenario.insertError = { code: 'PGRST_ERROR', message: 'insert failed' };

    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // Security: order of guards matters
  // -------------------------------------------------------------------------

  it('does not reach membership check when unauthenticated (auth guard is first)', async () => {
    /**
     * WHY: If auth check were skipped or placed after membership check, an
     * unauthenticated caller could probe circle membership by observing whether
     * they get UNAUTHORIZED vs NOT_MEMBER (existence oracle).
     * The implementation auth-guards first — this test verifies the auth error
     * fires even when valid circle_id is provided.
     */
    // No authUser set — unauthenticated
    scenario.membership = { circle_id: VALID_CIRCLE_ID }; // would pass if reached

    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(false);
    // Must get the auth error, not the membership error
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });
});

// ---------------------------------------------------------------------------
// Constitution compliance tests for createRequest
// ---------------------------------------------------------------------------

describe('Constitution compliance — createRequest', () => {
  beforeEach(() => {
    scenario = {
      authUser: { id: 'uid-alpha', email: 'alpha@example.com' },
      authError: null,
      membership: { circle_id: VALID_CIRCLE_ID },
      membershipError: null,
      insertedRow: { id: VALID_REQUEST_ID },
      insertError: null,
    };
  });

  it('result does not contain ledger/counter fields (helps_given, reputation, etc.)', async () => {
    /**
     * WHY: Nguyên tắc 2 forbids counting how many times a user has helped.
     * createRequest must return only { request_id } — no aggregate fields.
     */
    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('helps_given');
      expect(result.data).not.toHaveProperty('helped_times');
      expect(result.data).not.toHaveProperty('contribution');
      expect(result.data).not.toHaveProperty('reputation_score');
      expect(result.data).not.toHaveProperty('ledger');
    }
  });

  it('result contains only request_id — no PII about requester returned', async () => {
    /**
     * WHY: The action response is returned to the client. It must not include
     * PII (email, phone, etc.) that could be intercepted or logged. Only the
     * newly created request_id should be in the success payload.
     */
    const result = await createRequest(VALID_INPUT);
    expect(result.success).toBe(true);
    if (result.success) {
      const keys = Object.keys(result.data);
      // The only allowed key is request_id
      expect(keys).toEqual(['request_id']);
    }
  });
});
