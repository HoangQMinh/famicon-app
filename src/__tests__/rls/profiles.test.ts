/**
 * RLS boundary tests for the `profiles` and `circle_members` tables (Sprint 8).
 *
 * WHY these tests exist:
 *  - The Members screen exposes profile data of all circle members to each other.
 *    If RLS allows User C (non-member) to read profiles of Circle A members, this
 *    violates the closed-circle privacy model (Constitution Principle 9).
 *  - `profiles_update_self` must prevent a user from overwriting another user's profile.
 *  - `circle_members` RLS must prevent non-members from seeing who is in a circle.
 *
 * Test approach: mock three Supabase clients (userA, userB, userC).
 * The mock enforces RLS policies through in-memory filtering based on circle membership.
 * This documents the EXPECTED behaviour; run against local Supabase for true integration.
 *
 * Policies modeled:
 *   profiles_select_self:              auth.uid() = id
 *   profiles_select_circle_member:     user shares an active circle with the profile owner
 *   profiles_update_self:              auth.uid() = id (USING + WITH CHECK)
 *   circle_members_select_same_circle: user is an active member of that circle
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const USER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // circle member
const USER_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // circle member (same circle as A)
const USER_C_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'; // NOT in any circle
const CIRCLE_X_ID = '11111111-1111-4111-8111-111111111111';

// ---------------------------------------------------------------------------
// Simulated DB state
// ---------------------------------------------------------------------------

type Profile = {
  id: string;
  display_name: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  location: string | null;
  kids_desc: string | null;
  help_tags: string[] | null;
  line_user_id: string | null; // exists in DB but must never be returned via actions
};

type CircleMember = {
  circle_id: string;
  user_id: string;
  is_active: boolean;
};

const PROFILES: Profile[] = [
  {
    id: USER_A_ID,
    display_name: 'Lan Anh',
    avatar_emoji: '👩',
    avatar_url: null,
    location: 'Edogawa',
    kids_desc: 'Bé 3 tuổi',
    help_tags: ['pickup', 'childcare'],
    line_user_id: 'U_LINE_A_SENSITIVE', // PII — must never appear in test assertions
  },
  {
    id: USER_B_ID,
    display_name: 'Minh Duc',
    avatar_emoji: '👨',
    avatar_url: 'https://storage.example.com/avatars/b/avatar.webp',
    location: 'Sumida',
    kids_desc: null,
    help_tags: ['meal'],
    line_user_id: 'U_LINE_B_SENSITIVE',
  },
  {
    id: USER_C_ID,
    display_name: 'Stranger',
    avatar_emoji: '🙂',
    avatar_url: null,
    location: null,
    kids_desc: null,
    help_tags: null,
    line_user_id: null,
  },
];

const MEMBERS: CircleMember[] = [
  { circle_id: CIRCLE_X_ID, user_id: USER_A_ID, is_active: true },
  { circle_id: CIRCLE_X_ID, user_id: USER_B_ID, is_active: true },
  // USER_C is NOT a member of any circle
];

// ---------------------------------------------------------------------------
// RLS helpers
// ---------------------------------------------------------------------------

function isMember(userId: string, circleId: string): boolean {
  return MEMBERS.some(m => m.user_id === userId && m.circle_id === circleId && m.is_active);
}

function sharesCircle(userA: string, userB: string): boolean {
  const circlesOfA = MEMBERS
    .filter(m => m.user_id === userA && m.is_active)
    .map(m => m.circle_id);
  return MEMBERS.some(m => m.user_id === userB && m.is_active && circlesOfA.includes(m.circle_id));
}

// ---------------------------------------------------------------------------
// Mock client factory
//
// Simulates:
//   profiles SELECT: visible if (id = uid) OR shares active circle with uid
//   profiles UPDATE: only if id = uid
//   circle_members SELECT: only active co-members of circles the uid belongs to
// ---------------------------------------------------------------------------

function createMockClient(requestingUserId: string) {
  // Mutable copy for UPDATE tests
  const profilesStore: Profile[] = PROFILES.map(p => ({ ...p }));

  return {
    userId: requestingUserId,

    from: (table: string) => {
      // -----------------------------------------------------------------
      // profiles table
      // -----------------------------------------------------------------
      if (table === 'profiles') {
        return {
          select: (_cols?: string) => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                if (col !== 'id') return { data: null, error: null };
                const profile = profilesStore.find(p => p.id === val);
                if (!profile) return { data: null, error: null };

                // RLS: profiles_select_self OR profiles_select_circle_member
                const canRead =
                  profile.id === requestingUserId ||
                  sharesCircle(requestingUserId, profile.id);

                if (!canRead) return { data: null, error: null };
                return { data: profile, error: null };
              },
            }),
            // For queries that don't filter by id (SELECT all visible)
            async then(resolve: (v: { data: Profile[]; error: null }) => void) {
              const visible = profilesStore.filter(
                p => p.id === requestingUserId || sharesCircle(requestingUserId, p.id)
              );
              resolve({ data: visible, error: null });
            },
          }),

          update: (payload: Partial<Profile>) => ({
            eq: async (col: string, val: string) => {
              if (col !== 'id') return { error: null };

              // RLS: profiles_update_self — only update own row
              if (val !== requestingUserId) {
                // RLS silently blocks — rowCount = 0
                return { error: null, count: 0 };
              }

              const idx = profilesStore.findIndex(p => p.id === val);
              if (idx === -1) return { error: null, count: 0 };
              profilesStore[idx] = { ...profilesStore[idx], ...payload };
              return { error: null, count: 1 };
            },
          }),
        };
      }

      // -----------------------------------------------------------------
      // circle_members table
      // -----------------------------------------------------------------
      if (table === 'circle_members') {
        return {
          select: () => ({
            eq: (col: string, val: string) => {
              const matching = MEMBERS.filter(m => (m as Record<string, unknown>)[col] === val);
              // RLS: only visible if requesting user is a member of that circle
              const visible = matching.filter(m => isMember(requestingUserId, m.circle_id));
              return Promise.resolve({ data: visible, error: null });
            },
          }),
        };
      }

      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null, count: 0 }) }),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Tests — profiles SELECT
// ---------------------------------------------------------------------------

describe('profiles RLS — SELECT', () => {
  let clientA: ReturnType<typeof createMockClient>;
  let clientB: ReturnType<typeof createMockClient>;
  let clientC: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    clientA = createMockClient(USER_A_ID);
    clientB = createMockClient(USER_B_ID);
    clientC = createMockClient(USER_C_ID);
  });

  // TC-RLS8.1.1
  it('user can SELECT their own profile', async () => {
    const { data } = await clientA
      .from('profiles')
      .select()
      .eq('id', USER_A_ID)
      .maybeSingle();

    expect(data).not.toBeNull();
    expect(data!.id).toBe(USER_A_ID);
  });

  // TC-RLS8.1.2
  it('user can SELECT profile of a co-member in the same circle', async () => {
    const { data } = await clientA
      .from('profiles')
      .select()
      .eq('id', USER_B_ID)
      .maybeSingle();

    expect(data).not.toBeNull();
    expect(data!.id).toBe(USER_B_ID);
  });

  // TC-RLS8.1.3 — CRITICAL
  it('user CANNOT SELECT profile of someone not in their circle — returns null', async () => {
    /**
     * WHY CRITICAL: This is the core privacy boundary of the members screen.
     * If User A can read User C's profile (who is in no circle), the closed-circle
     * model is broken. Similarly, User C cannot read profiles of Circle X members.
     */
    const { data: cSeesA } = await clientC
      .from('profiles')
      .select()
      .eq('id', USER_A_ID)
      .maybeSingle();

    expect(cSeesA).toBeNull();

    const { data: aSeesC } = await clientA
      .from('profiles')
      .select()
      .eq('id', USER_C_ID)
      .maybeSingle();

    expect(aSeesC).toBeNull();
  });

  // TC-RLS8.1.4
  it('unauthenticated client (no userId) cannot SELECT any profiles', async () => {
    const unauthClient = createMockClient('');
    const { data } = await unauthClient
      .from('profiles')
      .select()
      .eq('id', USER_A_ID)
      .maybeSingle();

    expect(data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — profiles UPDATE
// ---------------------------------------------------------------------------

describe('profiles RLS — UPDATE', () => {
  let clientA: ReturnType<typeof createMockClient>;
  let clientB: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    clientA = createMockClient(USER_A_ID);
    clientB = createMockClient(USER_B_ID);
  });

  // TC-RLS8.2.1
  it('user can UPDATE their own profile', async () => {
    const { error, count } = await clientA
      .from('profiles')
      .update({ display_name: 'Updated Name' })
      .eq('id', USER_A_ID);

    expect(error).toBeNull();
    expect(count).toBe(1);
  });

  // TC-RLS8.2.2 — CRITICAL
  it('user CANNOT UPDATE another member\'s profile — RLS silently blocks (count = 0)', async () => {
    /**
     * WHY CRITICAL: Without this policy, a circle member could overwrite
     * another member's display_name or help_tags — corrupting data they don't own.
     */
    const { error, count } = await clientA
      .from('profiles')
      .update({ display_name: 'Hacked Name' })
      .eq('id', USER_B_ID);

    expect(error).toBeNull(); // RLS returns no error, just 0 rows affected
    expect(count).toBe(0);
  });

  // TC-RLS8.2.3
  it('user can UPDATE help_tags of their own profile', async () => {
    const { error, count } = await clientA
      .from('profiles')
      .update({ help_tags: ['meal', 'other'] })
      .eq('id', USER_A_ID);

    expect(error).toBeNull();
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests — circle_members SELECT
// ---------------------------------------------------------------------------

describe('circle_members RLS — SELECT', () => {
  let clientA: ReturnType<typeof createMockClient>;
  let clientC: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    clientA = createMockClient(USER_A_ID);
    clientC = createMockClient(USER_C_ID);
  });

  // TC-RLS8.3.1
  it('circle member can SELECT members list for their own circle', async () => {
    const { data, error } = await clientA
      .from('circle_members')
      .select()
      .eq('circle_id', CIRCLE_X_ID);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(2); // A and B
    expect(data!.every(m => m.circle_id === CIRCLE_X_ID)).toBe(true);
  });

  // TC-RLS8.3.2
  it('non-member CANNOT SELECT circle_members for a circle they don\'t belong to', async () => {
    const { data } = await clientC
      .from('circle_members')
      .select()
      .eq('circle_id', CIRCLE_X_ID);

    expect(data).toHaveLength(0);
  });
});
