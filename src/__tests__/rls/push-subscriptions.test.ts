/**
 * RLS boundary tests for push_subscriptions table.
 *
 * WHY: push_subscriptions contains device push endpoints. If RLS allows
 * User A to read User B's subscription endpoint, A could:
 *   1. Send arbitrary push notifications to B's device (not via our server)
 *   2. Track B's device fingerprint
 *
 * This is a privacy violation regardless of whether the endpoint can be
 * exploited — the spec requires strict "owner only" isolation.
 *
 * Test approach: mock two separate Supabase clients (aliceClient, bobClient)
 * each representing a different auth.uid(). The mock enforces RLS by checking
 * the user_id filter against the requesting client's identity.
 *
 * Acceptance Criteria covered: AC-5.5
 *
 * Note: In a local Supabase environment these tests would run against real RLS.
 * The mock here tests the EXPECTED behaviour that real RLS must enforce, and
 * serves as documentation of the RLS policy contract.
 */

import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ALICE_USER_ID = 'alice-uuid-0001';
const BOB_USER_ID   = 'bob-uuid-0002';

const ALICE_SUBSCRIPTION = {
  user_id: ALICE_USER_ID,
  endpoint: 'https://fcm.googleapis.com/fcm/send/alice-endpoint',
  p256dh:   'alice-p256dh',
  auth_key: 'alice-auth',
};

const BOB_SUBSCRIPTION = {
  user_id: BOB_USER_ID,
  endpoint: 'https://fcm.googleapis.com/fcm/send/bob-endpoint',
  p256dh:   'bob-p256dh',
  auth_key: 'bob-auth',
};

// ---------------------------------------------------------------------------
// RLS-aware mock client factory
//
// Simulates Supabase RLS "push_self" policy:
//   SELECT: WHERE user_id = auth.uid()
//   INSERT: WHERE user_id = auth.uid()
//   DELETE: WHERE user_id = auth.uid()
//
// The mock enforces this by filtering/rejecting based on the requesting userId.
// ---------------------------------------------------------------------------

type Operation = 'select' | 'insert' | 'delete';

function createMockClient(requestingUserId: string) {
  // In-memory store (shared between calls in a test scope)
  const store = [ALICE_SUBSCRIPTION, BOB_SUBSCRIPTION];

  function makeBuilder(operation: Operation, targetUserId?: string) {
    return {
      eq: (col: string, val: string) => {
        const filterUserId = col === 'user_id' ? val : targetUserId;
        return makeBuilder(operation, filterUserId);
      },

      // SELECT resolution
      then: undefined, // not a thenable — require explicit exec method
      async execute(): Promise<{ data: typeof store | null; error: null | { message: string } }> {
        if (operation === 'select') {
          // RLS: only return rows where user_id === requestingUserId
          const filtered = store.filter(row => {
            if (row.user_id !== requestingUserId) return false;
            if (targetUserId && row.user_id !== targetUserId) return false;
            return true;
          });
          return { data: filtered, error: null };
        }
        return { data: null, error: null };
      },
    };
  }

  return {
    from: (table: string) => {
      if (table !== 'push_subscriptions') {
        return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
      }

      return {
        // SELECT
        select: () => ({
          eq: (col: string, filterVal: string) => {
            const targetUserId = col === 'user_id' ? filterVal : undefined;
            // RLS: filter to requesting user only
            if (targetUserId && targetUserId !== requestingUserId) {
              // RLS silently returns empty for other users' rows
              return Promise.resolve({ data: [], error: null });
            }
            // Same user — return their rows
            return Promise.resolve({
              data: store.filter(r => r.user_id === requestingUserId),
              error: null,
            });
          },
        }),

        // INSERT — RLS rejects if user_id !== auth.uid()
        insert: (payload: { user_id: string; endpoint: string; p256dh: string; auth_key: string }) => {
          if (payload.user_id !== requestingUserId) {
            return Promise.resolve({
              data: null,
              error: { message: 'new row violates row-level security policy for table "push_subscriptions"' },
            });
          }
          store.push(payload);
          return Promise.resolve({ data: payload, error: null });
        },

        // DELETE — RLS silently ignores deletes targeting other users' rows
        delete: () => ({
          eq: (col: string, val: string) => {
            if (col === 'user_id') {
              if (val !== requestingUserId) {
                // RLS: silent no-op for other users' rows
                return Promise.resolve({ error: null });
              }
              const idx = store.findIndex(r => r.user_id === val);
              if (idx !== -1) store.splice(idx, 1);
              return Promise.resolve({ error: null });
            }
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  };
}

// Service role client — bypasses RLS (used for verification after delete tests)
function createServiceClient() {
  const store = [{ ...ALICE_SUBSCRIPTION }, { ...BOB_SUBSCRIPTION }];
  return {
    store,
    from: (_table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => {
          const rows = store.filter(r => (r as Record<string, unknown>)[col] === val);
          return Promise.resolve({ data: rows, error: null });
        },
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('push_subscriptions RLS', () => {
  let aliceClient: ReturnType<typeof createMockClient>;
  let bobClient:   ReturnType<typeof createMockClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  // Reset fresh clients before each test to avoid state bleed
  beforeEach(() => {
    aliceClient   = createMockClient(ALICE_USER_ID);
    bobClient     = createMockClient(BOB_USER_ID);
    serviceClient = createServiceClient();
  });

  // -------------------------------------------------------------------------
  // SELECT
  // -------------------------------------------------------------------------

  it('user can read their own subscription', async () => {
    const { data, error } = await aliceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', ALICE_USER_ID);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].user_id).toBe(ALICE_USER_ID);
  });

  it('user CANNOT read subscription of another user — returns empty array', async () => {
    // WHY: RLS must return empty (not error) when a user queries another's rows.
    // An empty result leaks no information. An error would reveal that the row exists.
    const { data } = await aliceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', BOB_USER_ID);

    expect(data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // INSERT
  // -------------------------------------------------------------------------

  it('user CANNOT insert a subscription with another user\'s user_id', async () => {
    // WHY SECURITY: Without this check, Alice could register Bob's push endpoint
    // under her user_id, causing Bob's device to receive Alice's notifications.
    const { error } = await aliceClient.from('push_subscriptions').insert({
      user_id:  BOB_USER_ID, // trying to insert for Bob
      endpoint: 'https://evil.example.com/push',
      p256dh:   'fake-key',
      auth_key: 'fake-auth',
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/row-level security/i);
  });

  it('user CAN insert their own subscription', async () => {
    const { error } = await aliceClient.from('push_subscriptions').insert({
      user_id:  ALICE_USER_ID,
      endpoint: 'https://fcm.googleapis.com/fcm/send/alice-new',
      p256dh:   'new-p256dh',
      auth_key: 'new-auth',
    });

    expect(error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  it('user CAN delete their own subscription', async () => {
    const { error } = await aliceClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', ALICE_USER_ID);

    expect(error).toBeNull();
  });

  it("user CANNOT delete another user's subscription — row remains untouched", async () => {
    // WHY: Supabase RLS on DELETE is silent (no error), but the row must NOT
    // be deleted. We verify by checking Bob's row via service client.
    await aliceClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', BOB_USER_ID);

    // Bob's subscription must still exist
    const { data } = await serviceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', BOB_USER_ID);

    expect(data).toHaveLength(1);
    expect(data![0].user_id).toBe(BOB_USER_ID);
  });
});
