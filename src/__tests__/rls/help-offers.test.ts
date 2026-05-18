/**
 * RLS boundary tests for help_offers and aid_requests tables (Sprint 7).
 *
 * WHY these tests exist:
 *  - help_offers contains information about who intends to help whom. If RLS
 *    allows User C (non-member) to read offers, they can infer which circle
 *    members are active helpers — a privacy leak even if the names are hidden.
 *  - The "INSERT only when request is open" RLS policy is a critical guard
 *    against race conditions: if it's missing, helpers can offer on already-matched
 *    requests, creating ghost offers that can never be accepted.
 *  - aid_requests RLS must block outsiders from reading requests — a non-member
 *    learning about aid requests violates the closed-circle model.
 *
 * Test approach: mock two Supabase clients (requesterClient, helperClient, outsiderClient)
 * each representing a different auth.uid(). The mock enforces the RLS policies by
 * filtering/rejecting based on the requesting user's circle membership.
 *
 * This documents the EXPECTED behaviour that real RLS must enforce. The same tests
 * should be run against a real local Supabase instance for true RLS integration testing.
 *
 * Policies modeled:
 *   offers_select: helper sees their own offers; requester sees all offers for their requests
 *   offers_insert_member: INSERT only if (a) helper is active circle member AND (b) request is 'open'
 *   requests_select_circle_member: only active circle members read requests
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

// Valid UUIDv4: version nibble = 4, variant nibble = 8|9|a|b
const USER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // requester
const USER_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // helper (circle member)
const USER_C_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'; // outsider (NOT a circle member)
const CIRCLE_A_ID = '11111111-1111-4111-8111-111111111111';
const REQUEST_R1_ID = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1'; // status: 'open'
const REQUEST_R2_ID = 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2'; // status: 'matched'
const OFFER_B_ID = 'e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0'; // User B's offer on R1
const OFFER_X_ID = 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1'; // a hypothetical other offer

// ---------------------------------------------------------------------------
// Simulated DB state
// ---------------------------------------------------------------------------

type Request = {
  id: string;
  circle_id: string;
  requester_id: string;
  status: string;
};

type Offer = {
  id: string;
  request_id: string;
  helper_id: string;
  status: string;
};

type CircleMember = {
  circle_id: string;
  user_id: string;
  is_active: boolean;
};

const REQUESTS: Request[] = [
  { id: REQUEST_R1_ID, circle_id: CIRCLE_A_ID, requester_id: USER_A_ID, status: 'open' },
  { id: REQUEST_R2_ID, circle_id: CIRCLE_A_ID, requester_id: USER_A_ID, status: 'matched' },
];

// Note: OFFER_X_ID used below to suppress "unused" lint warning
void OFFER_X_ID;

const OFFERS: Offer[] = [
  { id: OFFER_B_ID, request_id: REQUEST_R1_ID, helper_id: USER_B_ID, status: 'pending' },
];

const MEMBERS: CircleMember[] = [
  { circle_id: CIRCLE_A_ID, user_id: USER_A_ID, is_active: true }, // requester
  { circle_id: CIRCLE_A_ID, user_id: USER_B_ID, is_active: true }, // helper
  // USER_C is NOT a member
];

// ---------------------------------------------------------------------------
// RLS-aware mock client factory
//
// Simulates the following RLS policies:
//
// help_offers:
//   SELECT: user can see their own offers (helper_id = uid) OR
//           user can see all offers for their own requests (requester via join)
//   INSERT: user must be active circle member AND request must have status='open'
//
// aid_requests:
//   SELECT: only active circle members can read requests in their circle
// ---------------------------------------------------------------------------

function isMember(userId: string, circleId: string): boolean {
  return MEMBERS.some(m => m.user_id === userId && m.circle_id === circleId && m.is_active);
}

function getRequest(requestId: string): Request | undefined {
  return REQUESTS.find(r => r.id === requestId);
}

function createMockClient(requestingUserId: string) {
  // Mutable copy so each test gets a fresh store
  const offersStore = [...OFFERS];

  return {
    userId: requestingUserId,

    from: (table: string) => {
      // -------------------------------------------------------------------
      // help_offers table
      // -------------------------------------------------------------------
      if (table === 'help_offers') {
        return {
          /**
           * SELECT: helper sees their own offers; requester sees all for their requests.
           * Filters:
           *   .eq('helper_id', X)     → RLS: only if X == requestingUserId
           *   .eq('request_id', Y)    → RLS: only if requestingUserId owns that request
           */
          select: () => ({
            eq: (col: string, val: string) => {
              let visibleOffers: Offer[];

              if (col === 'helper_id') {
                // "helper sees their own offers" — only returns rows where helper_id = uid
                if (val !== requestingUserId) {
                  // RLS: silently return empty for other helpers' offers
                  return Promise.resolve({ data: [], error: null });
                }
                visibleOffers = offersStore.filter(o => o.helper_id === requestingUserId);
              } else if (col === 'request_id') {
                // "requester sees all offers for their requests"
                const req = getRequest(val);
                if (!req) {
                  return Promise.resolve({ data: [], error: null });
                }
                if (req.requester_id !== requestingUserId) {
                  // RLS: not the requester → cannot see these offers
                  // Also check if it's the helper's own offer
                  visibleOffers = offersStore.filter(
                    o => o.request_id === val && o.helper_id === requestingUserId
                  );
                } else {
                  // Requester sees all offers for their request
                  visibleOffers = offersStore.filter(o => o.request_id === val);
                }
              } else {
                visibleOffers = [];
              }

              return Promise.resolve({ data: visibleOffers, error: null });
            },
          }),

          /**
           * INSERT: must be circle member AND request must be 'open'.
           * Returns RLS error if either condition fails.
           */
          insert: (payload: { request_id: string; helper_id: string; status: string }) => {
            const req = getRequest(payload.request_id);

            if (!req) {
              return Promise.resolve({
                data: null,
                error: { message: 'Request not found', code: 'PGRST116' },
              });
            }

            if (!isMember(requestingUserId, req.circle_id)) {
              return Promise.resolve({
                data: null,
                error: {
                  message: 'new row violates row-level security policy for table "help_offers"',
                  code: '42501',
                },
              });
            }

            if (req.status !== 'open') {
              // RLS policy: requests_select_circle_member + offers_insert_member checks status
              return Promise.resolve({
                data: null,
                error: {
                  message: 'new row violates row-level security policy for table "help_offers"',
                  code: '42501',
                },
              });
            }

            const newOffer = { ...payload, id: `new-offer-${Date.now()}` };
            offersStore.push(newOffer);
            return Promise.resolve({ data: newOffer, error: null });
          },
        };
      }

      // -------------------------------------------------------------------
      // aid_requests table
      // -------------------------------------------------------------------
      if (table === 'aid_requests') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              // Filter rows by given condition, then apply RLS
              const matchingRequests = REQUESTS.filter(r => (r as Record<string, unknown>)[col] === val);
              // RLS: only circle members can see requests
              const visibleRequests = matchingRequests.filter(r =>
                isMember(requestingUserId, r.circle_id)
              );
              return Promise.resolve({ data: visibleRequests, error: null });
            },
          }),
        };
      }

      // Fallback
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('help_offers RLS', () => {
  let requesterClient: ReturnType<typeof createMockClient>;
  let helperClient: ReturnType<typeof createMockClient>;
  let outsiderClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    requesterClient = createMockClient(USER_A_ID);
    helperClient    = createMockClient(USER_B_ID);
    outsiderClient  = createMockClient(USER_C_ID);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-01 — Helper reads their own offer
  // -------------------------------------------------------------------------

  it('S7-RLS-01: helper can read their own offer (SELECT helper_id = self)', async () => {
    /**
     * WHY: Helpers need to see their own pending offer to know they've successfully
     * submitted. "offers_select" policy must allow helper_id = auth.uid().
     */
    const { data, error } = await helperClient
      .from('help_offers')
      .select()
      .eq('helper_id', USER_B_ID);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].helper_id).toBe(USER_B_ID);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-02 — Helper cannot read another helper's offer
  // -------------------------------------------------------------------------

  it('S7-RLS-02: helper CANNOT read offers submitted by other helpers — returns empty', async () => {
    /**
     * WHY PRIVACY: If Helper B can query Helper C's offers, they learn that C also
     * offered help — revealing C's intentions without consent. RLS must prevent
     * cross-helper offer visibility.
     */
    const HELPER_C_ID = USER_C_ID;
    const { data } = await helperClient
      .from('help_offers')
      .select()
      .eq('helper_id', HELPER_C_ID);

    expect(data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-03 — Requester reads all offers for their request
  // -------------------------------------------------------------------------

  it('S7-RLS-03: requester can read all offers for their own request', async () => {
    /**
     * WHY: Requester A must see all offers on their request R1 to choose who to
     * accept. "offers_select" requester clause must allow SELECT WHERE request_id
     * IN (SELECT id FROM aid_requests WHERE requester_id = auth.uid()).
     */
    const { data, error } = await requesterClient
      .from('help_offers')
      .select()
      .eq('request_id', REQUEST_R1_ID);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    // All returned offers belong to R1
    for (const offer of data!) {
      expect(offer.request_id).toBe(REQUEST_R1_ID);
    }
  });

  // -------------------------------------------------------------------------
  // S7-RLS-04 — Outsider cannot read offers
  // -------------------------------------------------------------------------

  it('S7-RLS-04: user outside the circle CANNOT read offers — returns empty', async () => {
    /**
     * WHY SECURITY: User C is not a member of Circle A. They must not see any
     * offers for requests in Circle A, even if they know the request UUID.
     * A data breach here reveals which circle members are active helpers.
     */
    const { data } = await outsiderClient
      .from('help_offers')
      .select()
      .eq('request_id', REQUEST_R1_ID);

    expect(data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-05 — Circle member can insert offer on open request
  // -------------------------------------------------------------------------

  it('S7-RLS-05: circle member CAN insert offer on an open request', async () => {
    /**
     * WHY: This is the happy-path INSERT test. "offers_insert_member" policy
     * must allow an active circle member to insert a help_offer when request
     * status is 'open'.
     */
    const { data, error } = await helperClient
      .from('help_offers')
      .insert({
        request_id: REQUEST_R1_ID,
        helper_id: USER_B_ID,
        status: 'pending',
      });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // S7-RLS-06 — Non-member cannot insert offer
  // -------------------------------------------------------------------------

  it('S7-RLS-06: user outside the circle CANNOT insert an offer — RLS rejected', async () => {
    /**
     * WHY SECURITY: User C is not a member. If they can insert an offer, they
     * can (a) spam requests they shouldn't even know exist, and (b) create offers
     * that appear legitimate to the requester.
     */
    const { error } = await outsiderClient
      .from('help_offers')
      .insert({
        request_id: REQUEST_R1_ID,
        helper_id: USER_C_ID,
        status: 'pending',
      });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/row-level security|RLS/i);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-07 — INSERT blocked when request is not open
  // -------------------------------------------------------------------------

  it('S7-RLS-07: INSERT offer on a matched request is rejected — request.status != open', async () => {
    /**
     * WHY CRITICAL: This prevents the race condition where a helper submits an
     * offer on a request that was just matched by someone else. The DB-level
     * policy check (ar.status = 'open') must reject such inserts.
     *
     * Without this guard: ghost offers accumulate on matched requests; requester
     * sees stale "1 offer pending" UI after already accepting help.
     */
    const { error } = await helperClient
      .from('help_offers')
      .insert({
        request_id: REQUEST_R2_ID, // R2 has status='matched'
        helper_id: USER_B_ID,
        status: 'pending',
      });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/row-level security|RLS/i);
  });
});

// ---------------------------------------------------------------------------
// aid_requests RLS — outsider isolation
// ---------------------------------------------------------------------------

describe('aid_requests RLS — circle isolation', () => {
  let outsiderClient: ReturnType<typeof createMockClient>;
  let helperClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    outsiderClient = createMockClient(USER_C_ID);
    helperClient   = createMockClient(USER_B_ID);
  });

  // -------------------------------------------------------------------------
  // S7-RLS-08 — Outsider cannot read aid requests
  // -------------------------------------------------------------------------

  it('S7-RLS-08: user outside the circle CANNOT read aid_requests in that circle', async () => {
    /**
     * WHY SECURITY: This is the outer boundary test. If User C can read aid_requests
     * for Circle A, they learn what kinds of help Circle A members need — a privacy
     * breach violating the closed-circle model (Constitution Principle 9).
     */
    const { data } = await outsiderClient
      .from('aid_requests')
      .select()
      .eq('circle_id', CIRCLE_A_ID);

    expect(data).toHaveLength(0);
  });

  it('circle member CAN read aid_requests in their circle', async () => {
    /**
     * WHY: Verify the positive case — User B is an active circle member and
     * must be able to see Circle A's requests.
     */
    const { data, error } = await helperClient
      .from('aid_requests')
      .select()
      .eq('circle_id', CIRCLE_A_ID);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    // All returned requests belong to Circle A
    for (const req of data!) {
      expect(req.circle_id).toBe(CIRCLE_A_ID);
    }
  });
});
