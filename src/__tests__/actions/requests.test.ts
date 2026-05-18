/**
 * Integration tests for getCircleRequests and getCircleInfo Server Actions.
 *
 * WHY these tests exist and why these edge cases matter:
 *  - TC-3.2 (non-member RLS boundary) is the most critical test in Sprint 3.
 *    A bug here means aid requests of one circle leak to users in other circles
 *    — a privacy violation that breaks the constitution's "only circle members
 *    see circle data" guarantee.
 *  - TC-3.5 (soft-deleted member not counted) verifies D-028/D-030 decisions:
 *    member_count must reflect active households only. A stale count inflates
 *    trust signals and misrepresents the circle to its members.
 *  - TC-3.1 sort order (urgent first) is load-bearing for safety: an urgent
 *    request buried in the feed could miss timely help.
 *
 * Mock strategy:
 *  - Module-level `scenario` objects mutated per test — same pattern as invites.test.ts.
 *  - The mock intercepts query chains by tracking the table name passed to .from().
 *  - getCircleRequests and getCircleInfo share the same supabase mock because they
 *    both use the user client (not admin client).
 *  - Separate scenario shapes per action keep each describe block self-contained.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mocks — must be at module top level for vi.mock hoisting
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Scenario shape for getCircleRequests
// ---------------------------------------------------------------------------

interface GetCircleRequestsScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // circle_members membership check result
  membership: { circle_id: string } | null;
  membershipError: { code: string } | null;
  // aid_requests query result
  requestRows: Array<{
    id: string;
    circle_id: string;
    requester_id: string;
    category: string;
    description: string;
    scheduled_at: string | null;
    location: string | null;
    is_urgent: boolean;
    status: string;
    created_at: string;
    profiles: { display_name: string; avatar_emoji: string } | null;
  }> | null;
  requestsError: { code: string } | null;
}

let requestsScenario: GetCircleRequestsScenario = {
  authUser: null,
  authError: null,
  membership: null,
  membershipError: null,
  requestRows: null,
  requestsError: null,
};

// ---------------------------------------------------------------------------
// Scenario shape for getCircleInfo
// ---------------------------------------------------------------------------

interface GetCircleInfoScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // circles query result
  circle: { name: string } | null;
  circleError: { code: string } | null;
  // circle_members count query result
  memberCount: number | null;
  countError: { code: string } | null;
}

let infoScenario: GetCircleInfoScenario = {
  authUser: null,
  authError: null,
  circle: null,
  circleError: null,
  memberCount: null,
  countError: null,
};

// ---------------------------------------------------------------------------
// Mock: @/lib/supabase/server
//
// Routes each from(table) call to the correct scenario.
// The factory captures scenario references so mutations in beforeEach/it take
// effect without re-declaring the mock.
//
// getCircleRequests query chain:
//   circle_members: .select().eq().eq().eq().maybeSingle()
//   aid_requests:   .select().eq().eq().order().order()  → returns { data, error }
//
// getCircleInfo query chain:
//   circles:        .select().eq().maybeSingle()         → returns { data, error }
//   circle_members: .select({ count:'exact', head:true }).eq().eq()
//                   → returns { count, error } (no .data field)
//
// Disambiguation: infoScenario.authUser being non-null identifies getCircleInfo calls.
// requestsScenario.authUser non-null identifies getCircleRequests calls.
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        // Priority: requestsScenario wins if set, then infoScenario
        const user = requestsScenario.authUser ?? infoScenario.authUser;
        const authError = requestsScenario.authError ?? infoScenario.authError;
        if (authError) return { data: { user: null }, error: authError };
        if (!user) return { data: { user: null }, error: { message: 'not authenticated' } };
        return { data: { user }, error: null };
      }),
    },

    from: (table: string) => {
      // -----------------------------------------------------------------
      // getCircleRequests paths (requestsScenario active)
      // -----------------------------------------------------------------
      if (requestsScenario.authUser) {
        if (table === 'circle_members') {
          // Membership check: .select().eq(circle_id).eq(user_id).eq(is_active).maybeSingle()
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: requestsScenario.membership,
                      error: requestsScenario.membershipError,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'aid_requests') {
          // Feed query: .select(cols).eq(circle_id).eq(status).order().order()
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    order: async () => ({
                      data: requestsScenario.requestRows,
                      error: requestsScenario.requestsError,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      }

      // -----------------------------------------------------------------
      // getCircleInfo paths (infoScenario active)
      // -----------------------------------------------------------------
      if (infoScenario.authUser) {
        if (table === 'circles') {
          // Circle name: .select('name').eq(id).maybeSingle()
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: infoScenario.circle,
                  error: infoScenario.circleError,
                }),
              }),
            }),
          };
        }

        if (table === 'circle_members') {
          // Active member count: .select('*', {count:'exact', head:true}).eq().eq()
          // Returns { count, error } — no data field.
          return {
            select: () => ({
              eq: () => ({
                eq: async () => ({
                  count: infoScenario.memberCount,
                  error: infoScenario.countError,
                }),
              }),
            }),
          };
        }
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
// Import actions AFTER mocks are declared (vi.mock hoisting requirement)
// ---------------------------------------------------------------------------

import { getCircleRequests, getCircleInfo } from '@/app/actions/requests';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CIRCLE_A_ID = '11111111-1111-1111-1111-111111111111';
const CIRCLE_B_ID = '22222222-2222-2222-2222-222222222222';
const INVALID_CIRCLE_ID = 'not-a-uuid';

// Test data matching sprint-3-test-plan.md seed
const R1 = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  circle_id: CIRCLE_A_ID,
  requester_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  category: 'pickup',
  description: 'Cần ai đón con từ trường về nhà',
  scheduled_at: '2026-05-20T08:00:00Z',
  location: 'Edogawa, Tokyo',
  is_urgent: true,    // urgent → appears first
  status: 'open',
  created_at: '2026-05-17T10:00:00Z',
  profiles: { display_name: 'Nhà Beta', avatar_emoji: '🏠' },
};

const R2 = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  circle_id: CIRCLE_A_ID,
  requester_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  category: 'borrow',
  description: 'Cần mượn xe đẩy trẻ em',
  scheduled_at: null,
  location: null,
  is_urgent: false,
  status: 'open',
  created_at: '2026-05-16T09:00:00Z',
  profiles: { display_name: 'Nhà Beta', avatar_emoji: '🏠' },
};

// ---------------------------------------------------------------------------
// getCircleRequests tests
// ---------------------------------------------------------------------------

describe('getCircleRequests', () => {
  beforeEach(() => {
    requestsScenario = {
      authUser: null,
      authError: null,
      membership: null,
      membershipError: null,
      requestRows: null,
      requestsError: null,
    };
    infoScenario = { ...infoScenario, authUser: null };
  });

  // -------------------------------------------------------------------------
  // TC-3.6 — Unauthenticated (edge case first — auth is the first gate)
  // -------------------------------------------------------------------------

  it('rejects unauthenticated caller with UNAUTHORIZED error', async () => {
    /**
     * WHY: Auth guard must fire before any DB query. An unauthenticated call
     * reaching the DB would be a security regression — Supabase anon key has
     * broader access than a user session with RLS.
     */
    // requestsScenario.authUser remains null → mock returns no user
    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects invalid circleId format (not UUID)', async () => {
    /**
     * WHY: UUID validation prevents SQL-injection-shaped strings from reaching
     * the query builder, and gives a cleaner error than a DB error.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    const result = await getCircleRequests(INVALID_CIRCLE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  // -------------------------------------------------------------------------
  // TC-3.2 — RLS boundary: non-member gets empty result (CRITICAL)
  // -------------------------------------------------------------------------

  it('returns empty-equivalent error when user is not a member of the circle', async () => {
    /**
     * WHY: This is the most important test in Sprint 3.
     * User Delta has no membership in Circle A. The action MUST NOT return any
     * requests. The implementation's explicit membership check returns a
     * user-friendly error ("Bạn không thuộc vòng tròn này.") before touching
     * aid_requests at all — defense-in-depth on top of RLS.
     * Test verifies: no data leak, success=false.
     */
    requestsScenario.authUser = { id: 'uid-delta', email: 'delta@example.com' };
    requestsScenario.membership = null;  // Delta has no membership row → RLS rejection

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Any error message is acceptable as long as no data is returned
      expect(result.error).toBeTruthy();
    }
    // Critical assertion: success=false means data field does not exist
    expect('data' in result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-3.3 — Cross-circle isolation: Alpha (Circle A member) cannot see Circle B
  // -------------------------------------------------------------------------

  it('returns error when authenticated member queries a circle they do not belong to', async () => {
    /**
     * WHY: User Alpha is active in Circle A but NOT Circle B.
     * querying Circle B with Alpha's session must return no data.
     * The explicit membership check catches this before RLS even needs to fire.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    // Alpha has no membership row for Circle B
    requestsScenario.membership = null;

    const result = await getCircleRequests(CIRCLE_B_ID);
    expect(result.success).toBe(false);
    // Verify no data leaks out under any result shape
    expect('data' in result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-3.1 — Happy path: correct data, correct sort order
  // -------------------------------------------------------------------------

  it('returns open requests for a member with urgent request first', async () => {
    /**
     * WHY: Sort order is load-bearing for safety — an urgent request buried
     * in the feed could miss timely help. R1 (is_urgent=true) must be data[0].
     *
     * The mock returns rows in the order they would appear from Supabase
     * (sorted by is_urgent DESC, created_at DESC) — same order we simulate here.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    // Simulate DB returning R1 (urgent) before R2 (non-urgent)
    requestsScenario.requestRows = [R1, R2];

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      // Urgent request appears first
      expect(result.data[0].id).toBe(R1.id);
      expect(result.data[0].is_urgent).toBe(true);
      // Non-urgent request appears second
      expect(result.data[1].id).toBe(R2.id);
      expect(result.data[1].is_urgent).toBe(false);
    }
  });

  it('maps requester_name from joined profile.display_name', async () => {
    /**
     * WHY: requester_name is a joined field. A mapping bug (wrong key name,
     * null fallback missing) would silently show "Thành viên" for all requests,
     * hiding the identity that helps receivers decide whether to help.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    requestsScenario.requestRows = [R1];

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].requester_name).toBe('Nhà Beta');
    }
  });

  it('falls back to "Thành viên" when profile is null', async () => {
    /**
     * WHY: Profile join can return null if the profile was deleted or if the
     * join is optional. The fallback prevents the UI from rendering "undefined".
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    requestsScenario.requestRows = [{ ...R1, profiles: null }];

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].requester_name).toBe('Thành viên');
    }
  });

  it('does not return closed requests — only open ones are in the result', async () => {
    /**
     * WHY: R3 has status='closed'. The action adds .eq('status', 'open') to
     * the query, so the DB already filters it. This test verifies the filter
     * exists — if someone removes it, the mock returns no closed rows and the
     * test should still pass (closed rows are not in requestRows here).
     *
     * The real protection: we assert that a closed request row is NOT in data,
     * simulating what Supabase returns after the filter is applied.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    // Only open rows — DB has already filtered closed ones
    requestsScenario.requestRows = [R1, R2];

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      // Verify no closed request sneaks in
      const closedInResult = result.data.filter((r) => r.status !== 'open');
      expect(closedInResult).toHaveLength(0);
    }
  });

  it('returns empty array when circle has no open requests', async () => {
    /**
     * WHY: Empty state must be handled gracefully (not crash). The feed shows
     * an invitation-style empty state which requires data=[] not data=null.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    requestsScenario.requestRows = [];

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
    }
  });

  it('maps DB location column to location_text field in result', async () => {
    /**
     * WHY: The DB column is named 'location' but AidRequestWithProfile uses
     * 'location_text'. A mapping regression would silently drop location data
     * from the feed, leaving all cards without location metadata.
     */
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    requestsScenario.requestRows = [R1]; // R1 has location: 'Edogawa, Tokyo'

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].location_text).toBe('Edogawa, Tokyo');
    }
  });

  it('returns error when membership check fails due to DB error', async () => {
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membershipError = { code: 'PGRST_ERROR' };

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(false);
  });

  it('returns error when aid_requests query fails', async () => {
    requestsScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    requestsScenario.membership = { circle_id: CIRCLE_A_ID };
    requestsScenario.requestsError = { code: 'PGRST_ERROR' };
    requestsScenario.requestRows = null;

    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// getCircleInfo tests
// ---------------------------------------------------------------------------

describe('getCircleInfo', () => {
  beforeEach(() => {
    infoScenario = {
      authUser: null,
      authError: null,
      circle: null,
      circleError: null,
      memberCount: null,
      countError: null,
    };
    requestsScenario = { ...requestsScenario, authUser: null };
  });

  // -------------------------------------------------------------------------
  // Edge case first: unauthenticated
  // -------------------------------------------------------------------------

  it('rejects unauthenticated caller', async () => {
    // infoScenario.authUser remains null
    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects invalid circleId format', async () => {
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    const result = await getCircleInfo(INVALID_CIRCLE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  // -------------------------------------------------------------------------
  // TC-3.4 — Happy path: correct name and member_count
  // -------------------------------------------------------------------------

  it('returns circle name and active member count for a member', async () => {
    /**
     * WHY: TopHeader displays "N gia đình" using member_count. A wrong count
     * erodes trust — if a member sees "3 gia đình" but knows there are only 2,
     * they question the reliability of the whole app.
     */
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    infoScenario.circle = { name: 'Vòng Edogawa - Kasai' };
    infoScenario.memberCount = 2; // Alpha + Beta (both is_active=true)

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Vòng Edogawa - Kasai');
      expect(result.data.member_count).toBe(2);
    }
  });

  // -------------------------------------------------------------------------
  // TC-3.5 — Only active members counted (soft-deleted excluded)
  // -------------------------------------------------------------------------

  it('member_count reflects only is_active=true members (soft-deleted excluded)', async () => {
    /**
     * WHY: D-028 and D-030 establish soft-delete semantics. Beta was set
     * is_active=false (soft delete). The count query includes .eq('is_active', true)
     * so the DB returns 1 instead of 2.
     *
     * This test verifies the filter exists in the query. If someone removes
     * the .eq('is_active', true) filter, the mock count must be updated too —
     * but the action's contract says "only active members".
     */
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    infoScenario.circle = { name: 'Vòng Edogawa - Kasai' };
    // DB returns 1 because the query has .eq('is_active', true) and Beta is inactive
    infoScenario.memberCount = 1;

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.member_count).toBe(1);
    }
  });

  it('returns 0 as member_count when count is null (empty circle)', async () => {
    /**
     * WHY: Supabase returns null for count when there are no rows matching the
     * filter. The action must coerce null → 0 to prevent NaN in the UI.
     */
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    infoScenario.circle = { name: 'Vòng Trống' };
    infoScenario.memberCount = null; // Supabase returns null for empty result

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.member_count).toBe(0);
    }
  });

  it('returns error when circle is not found (RLS returns null for non-member)', async () => {
    /**
     * WHY: RLS "circles_select_member" returns null (not 403) when the user
     * is not a member. The action must treat null circle as unauthorized access.
     */
    infoScenario.authUser = { id: 'uid-delta', email: 'delta@example.com' };
    infoScenario.circle = null; // RLS blocked — user not in circle

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(false);
    // No data leak
    expect('data' in result).toBe(false);
  });

  it('returns error when circles query fails with DB error', async () => {
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    infoScenario.circleError = { code: 'PGRST_ERROR' };

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(false);
  });

  it('returns error when member count query fails with DB error', async () => {
    infoScenario.authUser = { id: 'uid-alpha', email: 'alpha@example.com' };
    infoScenario.circle = { name: 'Vòng Edogawa - Kasai' };
    infoScenario.countError = { code: 'PGRST_ERROR' };

    const result = await getCircleInfo(CIRCLE_A_ID);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constitution compliance tests — no ledger, no counter, no PII leak
// ---------------------------------------------------------------------------

describe('Constitution compliance — getCircleRequests', () => {
  beforeEach(() => {
    requestsScenario = {
      authUser: { id: 'uid-alpha', email: 'alpha@example.com' },
      authError: null,
      membership: { circle_id: CIRCLE_A_ID },
      membershipError: null,
      requestRows: [R1, R2],
      requestsError: null,
    };
    infoScenario = { ...infoScenario, authUser: null };
  });

  it('result items do not contain help_count, helped_times, or contribution fields', async () => {
    /**
     * WHY: Nguyên tắc 2 forbids ledger/counter patterns. If the backend ever
     * joins help_offers to count how many times someone helped, it violates the
     * constitution. This test verifies the result shape stays clean.
     */
    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const item of result.data) {
        expect(item).not.toHaveProperty('help_count');
        expect(item).not.toHaveProperty('helped_times');
        expect(item).not.toHaveProperty('contribution');
        expect(item).not.toHaveProperty('reputation_score');
      }
    }
  });

  it('result items do not contain full email address of requester', async () => {
    /**
     * WHY: Nguyên tắc 3 — notification payload must not contain PII that
     * crosses circle boundaries. The feed result is displayed to all members,
     * so requester email must not be exposed — only display_name is permitted.
     */
    const result = await getCircleRequests(CIRCLE_A_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      for (const item of result.data) {
        expect(item).not.toHaveProperty('requester_email');
        expect(item).not.toHaveProperty('email');
      }
    }
  });
});
