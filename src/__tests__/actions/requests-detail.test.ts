/**
 * Unit tests for getRequestDetail, cancelRequest, and closeRequest
 * Server Actions (Sprint 7 additions to requests.ts).
 *
 * WHY these tests exist:
 *  - getRequestDetail is the first DB read users trigger after tapping a request card.
 *    If line_user_id accidentally leaks into the response, it's a silent PII exposure
 *    (Constitution Principle 9). Test verifies the field is absent.
 *  - cancelRequest with D-033 re-notify is a critical flow: if cancel of a matched
 *    request does NOT fire re-notify, the circle never hears the request is available
 *    again. If cancel of an open request fires re-notify, we send a spurious notification.
 *  - closeRequest tests ensure that the status mutation gate works — a closed request
 *    cannot be re-closed or cancelled.
 *
 * Mock strategy: same module-level scenario pattern as requests.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Must-be-first mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Scenario shapes
// ---------------------------------------------------------------------------

interface GetRequestDetailScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // aid_requests + profiles join
  row: {
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
    profiles: { display_name: string } | null;
  } | null;
  rowError: { code: string } | null;
}

interface CancelRequestScenario {
  authUser: { id: string; email: string } | null;
  // The fetched request row (already filtered by requester_id = user.id)
  requestRow: {
    id: string;
    circle_id: string;
    requester_id: string;
    category: string;
    description: string;
    is_urgent: boolean;
    status: string;
  } | null;
  fetchError: { code: string } | null;
  updateError: { code: string } | null;
}

interface CloseRequestScenario {
  authUser: { id: string; email: string } | null;
  requestRow: {
    id: string;
    requester_id: string;
    status: string;
  } | null;
  fetchError: { code: string } | null;
  updateError: { code: string } | null;
}

let detailScenario: GetRequestDetailScenario = {
  authUser: null,
  authError: null,
  row: null,
  rowError: null,
};

let cancelScenario: CancelRequestScenario = {
  authUser: null,
  requestRow: null,
  fetchError: null,
  updateError: null,
};

let closeScenario: CloseRequestScenario = {
  authUser: null,
  requestRow: null,
  fetchError: null,
  updateError: null,
};

// ---------------------------------------------------------------------------
// Supabase mock — routes based on which scenario is active
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        // Priority order for active scenario
        const user =
          detailScenario.authUser ??
          cancelScenario.authUser ??
          closeScenario.authUser;
        const err = detailScenario.authError;
        if (err) return { data: { user: null }, error: err };
        if (!user) return { data: { user: null }, error: { message: 'not authenticated' } };
        return { data: { user }, error: null };
      }),
    },

    from: (table: string) => {
      // ---------------------------------------------------------
      // getRequestDetail paths (detailScenario active)
      // ---------------------------------------------------------
      if (detailScenario.authUser && table === 'aid_requests') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: detailScenario.row,
                error: detailScenario.rowError,
              }),
            }),
          }),
        };
      }

      // ---------------------------------------------------------
      // cancelRequest paths (cancelScenario active)
      // ---------------------------------------------------------
      if (cancelScenario.authUser && table === 'aid_requests') {
        // Two different chains: first .select(...).eq(id).eq(requester_id).maybeSingle()
        // then .update(...).eq(id).eq(requester_id)
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: cancelScenario.requestRow,
                  error: cancelScenario.fetchError,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: async () => ({
                error: cancelScenario.updateError,
              }),
            }),
          }),
        };
      }

      // ---------------------------------------------------------
      // closeRequest paths (closeScenario active)
      // ---------------------------------------------------------
      if (closeScenario.authUser && table === 'aid_requests') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: closeScenario.requestRow,
                  error: closeScenario.fetchError,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: async () => ({
                error: closeScenario.updateError,
              }),
            }),
          }),
        };
      }

      // Fallback
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
// Import actions AFTER mocks
// ---------------------------------------------------------------------------

import { getRequestDetail, cancelRequest, closeRequest } from '@/app/actions/requests';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Valid UUIDv4: version nibble = 4, variant nibble = 8|9|a|b
const USER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // requester
const USER_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // helper / other user
const CIRCLE_A_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_R1_ID = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1';
const INVALID_ID = 'not-a-uuid';

const BASE_REQUEST_ROW = {
  id: REQUEST_R1_ID,
  circle_id: CIRCLE_A_ID,
  requester_id: USER_A_ID,
  category: 'pickup',
  description: 'Cần ai đón con từ trường lúc 15h',
  scheduled_at: '2026-05-20T15:00:00Z',
  location: 'Edogawa, Tokyo',
  is_urgent: false,
  status: 'open',
  created_at: '2026-05-18T08:00:00Z',
  profiles: { display_name: 'Nhà Tanaka' },
};

// ---------------------------------------------------------------------------
// getRequestDetail tests
// ---------------------------------------------------------------------------

describe('getRequestDetail', () => {
  beforeEach(() => {
    detailScenario = { authUser: null, authError: null, row: null, rowError: null };
    cancelScenario = { ...cancelScenario, authUser: null };
    closeScenario = { ...closeScenario, authUser: null };
  });

  // -------------------------------------------------------------------------
  // Edge case: unauthenticated (auth gate must fire first)
  // -------------------------------------------------------------------------

  it('returns error when caller is not authenticated', async () => {
    /**
     * WHY: An unauthenticated user must not be able to fetch request details
     * even if they know the UUID. Auth guard must fire before any DB query.
     */
    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns error for non-UUID requestId', async () => {
    /**
     * WHY: UUID validation runs after auth — an invalid ID string must not
     * reach the DB query.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };

    const result = await getRequestDetail(INVALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-17 — Request not found
  // -------------------------------------------------------------------------

  it('returns error when request does not exist or RLS blocks access', async () => {
    /**
     * WHY: RLS returns null (not 403) when a user queries a row they cannot see.
     * The action must treat null as "not found or unauthorized" — intentionally
     * vague to avoid leaking information about circle membership.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = null; // not found

    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-15 — Happy path: full detail object returned
  // -------------------------------------------------------------------------

  it('returns full RequestDetail object with all required fields', async () => {
    /**
     * WHY: The component reads every field from RequestDetail. Missing fields
     * would cause silent rendering bugs (undefined values in InfoBlocks, wrong
     * button state from missing status field).
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = BASE_REQUEST_ROW;

    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(REQUEST_R1_ID);
      expect(result.data.category).toBe('pickup');
      expect(result.data.description).toBe('Cần ai đón con từ trường lúc 15h');
      expect(result.data.status).toBe('open');
      expect(result.data.requester_name).toBe('Nhà Tanaka');
      expect(result.data.is_urgent).toBe(false);
      // location_text maps from DB column 'location'
      expect(result.data.location_text).toBe('Edogawa, Tokyo');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-16 — CRITICAL: line_user_id must NOT be in response (Constitution P9)
  // -------------------------------------------------------------------------

  it('CONSTITUTION P9: response does not contain line_user_id — PII must stay server-side', async () => {
    /**
     * WHY CRITICAL: This is the most important privacy test in Sprint 7.
     * line_user_id is PII (personal LINE account identifier). If it appears
     * in the getRequestDetail response, it leaks from the server action to
     * the client component and potentially to browser DevTools/logs.
     *
     * The action's SELECT query intentionally excludes line_user_id from the
     * profiles join. This test is a regression guard — if someone adds it back,
     * the test catches it.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = BASE_REQUEST_ROW;

    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('line_user_id');
      expect(result.data).not.toHaveProperty('requester_line_id');
      // Verify no nested object contains the field either
      const serialized = JSON.stringify(result.data);
      expect(serialized).not.toContain('line_user_id');
    }
  });

  it('CONSTITUTION P3: response does not contain helper_name or helper info', async () => {
    /**
     * WHY: When a request is matched, the helper's identity must not be in
     * the getRequestDetail response. Constitution Principle 3 — no face loss.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = { ...BASE_REQUEST_ROW, status: 'matched' };

    const result = await getRequestDetail(REQUEST_R1_ID);
    if (result.success) {
      expect(result.data).not.toHaveProperty('helper_name');
      expect(result.data).not.toHaveProperty('helper_id');
      expect(result.data).not.toHaveProperty('helper_emoji');
    }
  });

  it('maps DB location column to location_text in response', async () => {
    /**
     * WHY: DB column is 'location', TypeScript type uses 'location_text'.
     * A mapping regression here would silently show null location on the detail page.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = { ...BASE_REQUEST_ROW, location: 'Koto Ward, Tokyo' };

    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location_text).toBe('Koto Ward, Tokyo');
    }
  });

  it('falls back to "Thành viên" when requester profile is null', async () => {
    /**
     * WHY: Profile join can return null if the profile row was deleted (or if
     * the join has no result). The UI must not render "undefined" as requester name.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = { ...BASE_REQUEST_ROW, profiles: null };

    const result = await getRequestDetail(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requester_name).toBe('Thành viên');
    }
  });

  it('CONSTITUTION P2: response does not contain offer_count or help statistics', async () => {
    /**
     * WHY: Nguyên tắc 2 — no ledger/counter patterns. The detail page must not
     * show "X people offered to help" which creates social pressure and comparison.
     */
    detailScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    detailScenario.row = BASE_REQUEST_ROW;

    const result = await getRequestDetail(REQUEST_R1_ID);
    if (result.success) {
      expect(result.data).not.toHaveProperty('offer_count');
      expect(result.data).not.toHaveProperty('offers_received');
      expect(result.data).not.toHaveProperty('help_count');
    }
  });
});

// ---------------------------------------------------------------------------
// cancelRequest tests
// ---------------------------------------------------------------------------

describe('cancelRequest', () => {
  beforeEach(() => {
    cancelScenario = { authUser: null, requestRow: null, fetchError: null, updateError: null };
    detailScenario = { ...detailScenario, authUser: null };
    closeScenario = { ...closeScenario, authUser: null };
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  // -------------------------------------------------------------------------
  // Edge case: unauthenticated
  // -------------------------------------------------------------------------

  it('returns error when caller is not authenticated', async () => {
    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns error for non-UUID requestId', async () => {
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    const result = await cancelRequest(INVALID_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-14 — Wrong user (authorization)
  // -------------------------------------------------------------------------

  it('returns error when non-requester tries to cancel', async () => {
    /**
     * WHY: Only the requester may cancel their own request. The action uses
     * .eq('requester_id', user.id) in both the fetch and update query, so
     * User B fetching a request owned by A returns null → error.
     */
    cancelScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    cancelScenario.requestRow = null; // B cannot find A's request (ownership check)

    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('huỷ');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-12 — Happy path: cancel open request
  // -------------------------------------------------------------------------

  it('returns { cancelled: true } when requester cancels their own open request', async () => {
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    cancelScenario.requestRow = {
      id: REQUEST_R1_ID,
      circle_id: CIRCLE_A_ID,
      requester_id: USER_A_ID,
      category: 'pickup',
      description: 'test',
      is_urgent: false,
      status: 'open',
    };

    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cancelled).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-13 — D-033: cancel matched request triggers re-notify
  // -------------------------------------------------------------------------

  it('D-033: fires re-notify to circle when cancelling a matched request', async () => {
    /**
     * WHY: D-033 decision — when a matched request is cancelled, the circle
     * must be notified so another helper can step in. If this fire-and-forget
     * call is missing, helpers never learn the request needs help again.
     *
     * This is the most important behavioral test for cancelRequest.
     */
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    cancelScenario.requestRow = {
      id: REQUEST_R1_ID,
      circle_id: CIRCLE_A_ID,
      requester_id: USER_A_ID,
      category: 'childcare',
      description: 'Cần trông trẻ',
      is_urgent: true,
      status: 'matched', // already matched — triggers re-notify
    };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(true);

    // Give fire-and-forget a tick to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify notify-circle was called (re-notify fire)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('notify-circle'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('does NOT fire re-notify when cancelling an open (not matched) request', async () => {
    /**
     * WHY: D-033 re-notify only applies when a matched request is cancelled.
     * Firing re-notify for open requests would send spurious notifications
     * — "Request cancelled before anyone committed to help" is not meaningful.
     */
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    cancelScenario.requestRow = {
      id: REQUEST_R1_ID,
      circle_id: CIRCLE_A_ID,
      requester_id: USER_A_ID,
      category: 'pickup',
      description: 'test',
      is_urgent: false,
      status: 'open', // not matched — must NOT trigger re-notify
    };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    await cancelRequest(REQUEST_R1_ID);
    await new Promise(resolve => setTimeout(resolve, 10));

    // fetch should NOT have been called for notify-circle
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when trying to cancel an already-cancelled request', async () => {
    /**
     * WHY: Idempotency guard — prevents double-cancel from showing a success
     * message twice (confusing for the user).
     */
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    cancelScenario.requestRow = {
      id: REQUEST_R1_ID,
      circle_id: CIRCLE_A_ID,
      requester_id: USER_A_ID,
      category: 'pickup',
      description: 'test',
      is_urgent: false,
      status: 'cancelled', // already cancelled
    };

    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when trying to cancel a closed request', async () => {
    /**
     * WHY: Closed requests are terminal — they should not be cancellable.
     * Status guard prevents invalid state transitions.
     */
    cancelScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    cancelScenario.requestRow = {
      id: REQUEST_R1_ID,
      circle_id: CIRCLE_A_ID,
      requester_id: USER_A_ID,
      category: 'pickup',
      description: 'test',
      is_urgent: false,
      status: 'closed',
    };

    const result = await cancelRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// closeRequest tests
// ---------------------------------------------------------------------------

describe('closeRequest', () => {
  beforeEach(() => {
    closeScenario = { authUser: null, requestRow: null, fetchError: null, updateError: null };
    detailScenario = { ...detailScenario, authUser: null };
    cancelScenario = { ...cancelScenario, authUser: null };
  });

  // -------------------------------------------------------------------------
  // Edge cases first
  // -------------------------------------------------------------------------

  it('returns error when caller is not authenticated', async () => {
    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  it('returns error for non-UUID requestId', async () => {
    closeScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    const result = await closeRequest(INVALID_ID);
    expect(result.success).toBe(false);
  });

  it('returns error when non-requester tries to close', async () => {
    /**
     * WHY: Only the requester may close their own request. User B cannot
     * close User A's request.
     */
    closeScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    closeScenario.requestRow = null; // B's ownership check returns null

    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when closing an already-closed request', async () => {
    /**
     * WHY: Idempotency guard — a closed request must not be closeable again.
     */
    closeScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    closeScenario.requestRow = {
      id: REQUEST_R1_ID,
      requester_id: USER_A_ID,
      status: 'closed', // already closed
    };

    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when trying to close a cancelled request', async () => {
    /**
     * WHY: Cancelled → closed is an invalid state transition.
     * A cancelled request should remain cancelled — not be "closed" which
     * implies successful fulfillment.
     */
    closeScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    closeScenario.requestRow = {
      id: REQUEST_R1_ID,
      requester_id: USER_A_ID,
      status: 'cancelled',
    };

    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns { closed: true } when requester closes their own open request', async () => {
    closeScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    closeScenario.requestRow = {
      id: REQUEST_R1_ID,
      requester_id: USER_A_ID,
      status: 'open',
    };

    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.closed).toBe(true);
    }
  });

  it('returns { closed: true } when requester closes a matched request', async () => {
    /**
     * WHY: Closing a matched request is a normal flow — the requester confirms
     * the help was received and the request is fulfilled.
     */
    closeScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    closeScenario.requestRow = {
      id: REQUEST_R1_ID,
      requester_id: USER_A_ID,
      status: 'matched',
    };

    const result = await closeRequest(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.closed).toBe(true);
    }
  });
});
