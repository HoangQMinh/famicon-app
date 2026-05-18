/**
 * Unit tests for createOffer and acceptOffer Server Actions.
 *
 * WHY these tests exist:
 *  - createOffer is the primary write path for Sprint 7. Its correctness determines
 *    whether help_offers records are created, duplicate guards work, and LINE
 *    deeplinks are constructed correctly. A bug here silently fails helpers.
 *  - acceptOffer orchestrates 3 DB mutations in sequence. If ownership check is
 *    bypassed, any circle member could accept any offer — a severe authorization bug.
 *  - The duplicate-offer race condition (two tabs clicking at once) is the most
 *    likely production failure mode for createOffer. DB unique constraint + 23505
 *    handler must be tested explicitly.
 *
 * Mock strategy:
 *  - Each test scenario is a typed object mutated in beforeEach.
 *  - The mock intercepts Supabase query chains by table name.
 *  - fetch is mocked globally to intercept notify-circle Edge Function calls.
 *  - vi.mock hoisting requirement: all vi.mock() calls must be at module top level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Global setup — must be before vi.mock declarations
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []), set: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Scenario shapes
// ---------------------------------------------------------------------------

interface CreateOfferScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // aid_requests fetch result (step 3)
  request: {
    id: string;
    circle_id: string;
    requester_id: string;
    category: string;
    status: string;
  } | null;
  requestError: { code: string } | null;
  // circle_members membership check (step 6)
  membership: { circle_id: string } | null;
  membershipError: { code: string } | null;
  // help_offers insert result (step 7)
  insertedOffer: { id: string } | null;
  insertError: { code: string; message?: string } | null;
  // profiles fetch for LINE user_id (step 8)
  requesterProfile: { line_user_id: string | null } | null;
}

interface AcceptOfferScenario {
  authUser: { id: string; email: string } | null;
  authError: { message: string } | null;
  // help_offers + join fetch (step 3)
  offer: {
    id: string;
    request_id: string;
    status: string;
    aid_requests: {
      id: string;
      requester_id: string;
      status: string;
    } | null;
  } | null;
  offerError: { code: string } | null;
  // UPDATE help_offers accepted (step 6)
  acceptError: { code: string } | null;
  // UPDATE aid_requests matched (step 7)
  requestUpdateError: { code: string } | null;
  // UPDATE help_offers declined (step 8)
  declineError: { code: string } | null;
}

let createScenario: CreateOfferScenario = {
  authUser: null,
  authError: null,
  request: null,
  requestError: null,
  membership: null,
  membershipError: null,
  insertedOffer: null,
  insertError: null,
  requesterProfile: null,
};

let acceptScenario: AcceptOfferScenario = {
  authUser: null,
  authError: null,
  offer: null,
  offerError: null,
  acceptError: null,
  requestUpdateError: null,
  declineError: null,
};

// ---------------------------------------------------------------------------
// fetch mock — intercepts notify-circle Edge Function calls
// ---------------------------------------------------------------------------

const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        const scenario = createScenario.authUser ? createScenario : acceptScenario;
        if (scenario.authError) return { data: { user: null }, error: scenario.authError };
        if (!scenario.authUser) return { data: { user: null }, error: { message: 'not authenticated' } };
        return { data: { user: scenario.authUser }, error: null };
      }),
    },

    from: (table: string) => {
      // -------------------------------------------------------
      // createOffer paths
      // -------------------------------------------------------
      if (createScenario.authUser) {
        if (table === 'aid_requests') {
          // Step 3: fetch request with status/circle_id/requester_id
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: createScenario.request,
                  error: createScenario.requestError,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: async () => ({ error: acceptScenario.requestUpdateError }),
              }),
            }),
          };
        }

        if (table === 'circle_members') {
          // Step 6: membership check
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: createScenario.membership,
                      error: createScenario.membershipError,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'help_offers') {
          // Step 7: insert offer
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: createScenario.insertedOffer,
                  error: createScenario.insertError,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () => ({
                  neq: async () => ({ error: null }),
                }),
              }),
            }),
          };
        }

        if (table === 'profiles') {
          // Step 8: fetch requester's line_user_id
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: createScenario.requesterProfile,
                  error: null,
                }),
              }),
            }),
          };
        }
      }

      // -------------------------------------------------------
      // acceptOffer paths
      // -------------------------------------------------------
      if (acceptScenario.authUser) {
        if (table === 'help_offers') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: acceptScenario.offer,
                  error: acceptScenario.offerError,
                }),
              }),
            }),
            update: (_updateData: Record<string, unknown>) => ({
              eq: (col: string, _val: string) => {
                // Distinguish: update accepted offer vs decline other offers
                if (col === 'id') {
                  // Step 6: accept this specific offer
                  return Promise.resolve({ error: acceptScenario.acceptError });
                }
                // Step 8: decline others — .eq(request_id).eq(status).neq(id)
                return {
                  eq: () => ({
                    neq: async () => ({ error: acceptScenario.declineError }),
                  }),
                };
              },
            }),
          };
        }

        if (table === 'aid_requests') {
          return {
            update: () => ({
              eq: () => ({
                eq: async () => ({ error: acceptScenario.requestUpdateError }),
              }),
            }),
          };
        }
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
// Import actions AFTER mocks (vi.mock hoisting)
// ---------------------------------------------------------------------------

import { createOffer, acceptOffer } from '@/app/actions/offers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Valid UUIDv4: version nibble = 4, variant nibble = 8|9|a|b
const USER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // requester
const USER_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // helper
const USER_C_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'; // outsider
const CIRCLE_A_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_R1_ID = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1';
const REQUEST_R2_ID = 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2';
const OFFER_O1_ID = 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1';

const REQUEST_R1_OPEN = {
  id: REQUEST_R1_ID,
  circle_id: CIRCLE_A_ID,
  requester_id: USER_A_ID,
  category: 'pickup',
  status: 'open',
};

const REQUEST_R2_MATCHED = {
  id: REQUEST_R2_ID,
  circle_id: CIRCLE_A_ID,
  requester_id: USER_A_ID,
  category: 'borrow',
  status: 'matched',
};

// ---------------------------------------------------------------------------
// createOffer tests
// ---------------------------------------------------------------------------

describe('createOffer', () => {
  beforeEach(() => {
    createScenario = {
      authUser: null,
      authError: null,
      request: null,
      requestError: null,
      membership: null,
      membershipError: null,
      insertedOffer: null,
      insertError: null,
      requesterProfile: null,
    };
    acceptScenario = { ...acceptScenario, authUser: null };
    mockFetch.mockClear();
  });

  // -------------------------------------------------------------------------
  // S7-ACT-06 — Unauthenticated (edge case first — auth is the outer gate)
  // -------------------------------------------------------------------------

  it('returns UNAUTHORIZED error when caller is not authenticated', async () => {
    /**
     * WHY SECURITY: Auth guard must fire before any DB query. An unauthenticated
     * caller reaching aid_requests would bypass our session-based RLS setup.
     */
    // createScenario.authUser remains null
    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-04 — Duplicate offer (race condition)
  // -------------------------------------------------------------------------

  it('returns friendly error when DB unique constraint fires (23505 duplicate offer)', async () => {
    /**
     * WHY: This is the most likely race condition in production — same helper
     * opens two tabs and clicks "Tôi giúp được" twice. DB unique constraint on
     * (request_id, helper_id) must be caught and returned as a friendly message.
     * A raw Postgres error code '23505' reaching the client is a UX failure.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "help_offers_request_id_helper_id_key"',
    };

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn đã đề nghị giúp request này rồi.');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-05 — Request not open (status = 'matched')
  // -------------------------------------------------------------------------

  it('returns error when trying to offer on an already-matched request', async () => {
    /**
     * WHY: After one helper is accepted, the request status becomes 'matched'.
     * Other helpers must not be able to submit more offers to a matched request —
     * it creates ghost offers that can never be accepted and confuses the requester.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R2_MATCHED;

    const result = await createOffer(REQUEST_R2_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đã được nhận');
    }
  });

  // -------------------------------------------------------------------------
  // Self-offer guard — edge case
  // -------------------------------------------------------------------------

  it('returns error when requester tries to offer help on their own request', async () => {
    /**
     * WHY: A user offering on their own request creates a circular dependency —
     * they cannot be both requester and helper. The self-offer guard prevents
     * trivially closing one's own request without any real help.
     */
    createScenario.authUser = { id: USER_A_ID, email: 'a@example.com' }; // same as requester
    createScenario.request = REQUEST_R1_OPEN; // requester_id = USER_A_ID

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('chính mình');
    }
  });

  // -------------------------------------------------------------------------
  // Non-member guard — authorization
  // -------------------------------------------------------------------------

  it('returns error when helper is not a member of the circle', async () => {
    /**
     * WHY: Authorization — User C is not a circle member. Even if they somehow
     * know the request UUID, they must not be allowed to offer help. The explicit
     * membership check (defense-in-depth over RLS) gives a clear error.
     */
    createScenario.authUser = { id: USER_C_ID, email: 'c@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = null; // not a member

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-01 + S7-ACT-02 — Happy path with line_user_id
  // -------------------------------------------------------------------------

  it('returns offer_id and LINE deeplink when requester has line_user_id', async () => {
    /**
     * WHY: The primary success path — helper submits offer, requester has LINE
     * connected. The deeplink must contain the requester's LINE ID so the helper
     * can open the correct LINE chat directly.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertedOffer = { id: OFFER_O1_ID };
    createScenario.requesterProfile = { line_user_id: 'U123456' };

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offer_id).toBe(OFFER_O1_ID);
      expect(result.data.line_handoff_url).toContain('U123456');
      expect(result.data.line_handoff_url).toContain('line.me');
    }
  });

  it('LINE deeplink uses https://line.me/ti/p/~ format when line_user_id is set', async () => {
    /**
     * WHY: The spec (sprint-7-spec.md Acceptance Criteria) requires exactly
     * this URL format for LINE deeplinks. A wrong format causes LINE app to
     * not open the correct chat.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertedOffer = { id: OFFER_O1_ID };
    createScenario.requesterProfile = { line_user_id: 'UabcDEF123' };

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.line_handoff_url).toMatch(/https:\/\/line\.me\/ti\/p\/~UabcDEF123/);
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-03 — Fallback URL when no line_user_id
  // -------------------------------------------------------------------------

  it('returns fallback LINE URL when requester has no line_user_id', async () => {
    /**
     * WHY: Requester may not have connected their LINE account (OQ-007 scope).
     * The app must not block the offer flow — it falls back to generic LINE URL
     * so the helper can still reach out manually.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertedOffer = { id: OFFER_O1_ID };
    createScenario.requesterProfile = { line_user_id: null };

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.line_handoff_url).toContain('line.me');
      // Must not contain a specific user ID when there is none
      expect(result.data.line_handoff_url).not.toMatch(/ti\/p\/~[A-Za-z0-9]+/);
    }
  });

  it('returns fallback URL even when profile fetch returns null', async () => {
    /**
     * WHY: If the profiles query returns null (deleted profile, RLS issue),
     * the action must degrade gracefully and not crash — LINE fallback must apply.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertedOffer = { id: OFFER_O1_ID };
    createScenario.requesterProfile = null; // profile fetch returned nothing

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.line_handoff_url).toContain('line.me');
    }
  });

  // -------------------------------------------------------------------------
  // CONSTITUTION: line_user_id must NOT appear in response
  // -------------------------------------------------------------------------

  it('CONSTITUTION: line_user_id of requester is not included in the returned data', async () => {
    /**
     * WHY CRITICAL: Constitution Principle 9 — line_user_id is PII. The createOffer
     * response returns a LINE URL (computed server-side) but must never include the
     * raw line_user_id field. This test is a regression guard — if someone adds
     * line_user_id to the ActionResult data, this test catches it.
     */
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };
    createScenario.request = REQUEST_R1_OPEN;
    createScenario.membership = { circle_id: CIRCLE_A_ID };
    createScenario.insertedOffer = { id: OFFER_O1_ID };
    createScenario.requesterProfile = { line_user_id: 'U_SENSITIVE_ID' };

    const result = await createOffer(REQUEST_R1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('line_user_id');
      expect(result.data).not.toHaveProperty('requester_line_id');
      // The raw LINE user ID must not appear as a standalone field
      expect(Object.values(result.data)).not.toContain('U_SENSITIVE_ID');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-07 — Input validation: invalid UUID
  // -------------------------------------------------------------------------

  it('returns error for non-UUID requestId input', async () => {
    createScenario.authUser = { id: USER_B_ID, email: 'b@example.com' };

    const result = await createOffer('not-a-uuid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// acceptOffer tests
// ---------------------------------------------------------------------------

describe('acceptOffer', () => {
  beforeEach(() => {
    acceptScenario = {
      authUser: null,
      authError: null,
      offer: null,
      offerError: null,
      acceptError: null,
      requestUpdateError: null,
      declineError: null,
    };
    createScenario = { ...createScenario, authUser: null };
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  // -------------------------------------------------------------------------
  // S7-ACT-11 — Unauthenticated (edge case first)
  // -------------------------------------------------------------------------

  it('returns error when caller is not authenticated', async () => {
    // acceptScenario.authUser remains null
    const result = await acceptOffer(OFFER_O1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đăng nhập');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-10 — Wrong user (authorization)
  // -------------------------------------------------------------------------

  it('returns error when non-requester tries to accept an offer', async () => {
    /**
     * WHY SECURITY: Only the requester (person who posted the request) may accept
     * an offer. If User B (helper) can accept their own offer, the requester has
     * no control — the "matching" happens without their consent, violating the
     * mutual agreement model.
     */
    acceptScenario.authUser = { id: USER_B_ID, email: 'b@example.com' }; // helper, not requester
    acceptScenario.offer = {
      id: OFFER_O1_ID,
      request_id: REQUEST_R1_ID,
      status: 'pending',
      aid_requests: {
        id: REQUEST_R1_ID,
        requester_id: USER_A_ID, // requester is A, not B
        status: 'open',
      },
    };

    const result = await acceptOffer(OFFER_O1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Chỉ người nhờ');
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-08 — Happy path: offer accepted, request matched
  // -------------------------------------------------------------------------

  it('returns { accepted: true } when requester accepts their own request offer', async () => {
    /**
     * WHY: The primary success path for acceptOffer. Requester A accepts helper B's offer.
     * Result must be { success: true, data: { accepted: true } }.
     */
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' }; // requester
    acceptScenario.offer = {
      id: OFFER_O1_ID,
      request_id: REQUEST_R1_ID,
      status: 'pending',
      aid_requests: {
        id: REQUEST_R1_ID,
        requester_id: USER_A_ID, // same as auth user
        status: 'open',
      },
    };

    const result = await acceptOffer(OFFER_O1_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accepted).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // S7-ACT-11 — Notify helper after accept
  // -------------------------------------------------------------------------

  it('triggers helper_confirmed notification after successful accept', async () => {
    /**
     * WHY: D-033 requires notifying the accepted helper. The fire-and-forget fetch
     * call to notify-circle must happen after accept. This test verifies the Edge
     * Function is called — notification failure must not block the response.
     */
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    acceptScenario.offer = {
      id: OFFER_O1_ID,
      request_id: REQUEST_R1_ID,
      status: 'pending',
      aid_requests: {
        id: REQUEST_R1_ID,
        requester_id: USER_A_ID,
        status: 'open',
      },
    };
    // Provide env vars for the notify trigger
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    await acceptOffer(OFFER_O1_ID);

    // Give fire-and-forget a tick to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('notify-circle'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('helper_confirmed'),
      })
    );
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  it('returns error for non-UUID offerId', async () => {
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };

    const result = await acceptOffer('not-a-uuid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when offer does not exist (RLS returns null)', async () => {
    /**
     * WHY: If the offer doesn't exist or RLS blocks it, the action must not
     * proceed with updating request status. Silently accepting a null offer
     * could mark a request as 'matched' with no actual helper committed.
     */
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    acceptScenario.offer = null; // not found

    const result = await acceptOffer(OFFER_O1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it('returns error when request is already matched (double-accept guard)', async () => {
    /**
     * WHY: Race condition — requester opens two tabs, accepts different offers.
     * The second accept must be blocked by the status guard. The request should
     * have at most one accepted offer.
     */
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    acceptScenario.offer = {
      id: OFFER_O1_ID,
      request_id: REQUEST_R1_ID,
      status: 'pending',
      aid_requests: {
        id: REQUEST_R1_ID,
        requester_id: USER_A_ID,
        status: 'matched', // already matched
      },
    };

    const result = await acceptOffer(OFFER_O1_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  // -------------------------------------------------------------------------
  // CONSTITUTION: declined offers — no notification to declined helpers
  // -------------------------------------------------------------------------

  it('CONSTITUTION: acceptOffer does not notify declined helpers — only accepted helper', async () => {
    /**
     * WHY: Constitution Principle 3 (respect face) — declined helpers must not
     * receive a notification telling them their offer was rejected. The notify
     * call must only target the accepted helper (type='helper_confirmed'),
     * never send 'offer_declined' notifications.
     */
    acceptScenario.authUser = { id: USER_A_ID, email: 'a@example.com' };
    acceptScenario.offer = {
      id: OFFER_O1_ID,
      request_id: REQUEST_R1_ID,
      status: 'pending',
      aid_requests: {
        id: REQUEST_R1_ID,
        requester_id: USER_A_ID,
        status: 'open',
      },
    };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    await acceptOffer(OFFER_O1_ID);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify no 'offer_declined' notification was fired
    const fetchCalls = mockFetch.mock.calls;
    for (const [, options] of fetchCalls) {
      const body = JSON.parse((options as RequestInit).body as string);
      expect(body.type).not.toBe('offer_declined');
      expect(body.type).not.toBe('declined');
    }
  });
});
