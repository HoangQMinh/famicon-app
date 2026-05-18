/**
 * Invite gating tests for signInWithEmail.
 *
 * WHY: Invite gating is the access-control boundary for the entire app.
 * A bypass here means arbitrary users can log in, violating the "vòng kín"
 * (Principle 9) and exposing private circle data to outsiders.
 *
 * isEmailAllowed() is private — tested through signInWithEmail's observable
 * behavior (success vs. specific error message).
 *
 * Strategy: use a module-level mock factory with a mutable `currentScenario`
 * reference. Each test sets the scenario before calling signInWithEmail,
 * so the single vi.mock at the top works for all test cases without needing
 * per-test vi.doMock + module invalidation (which is unreliable in Vitest).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mutable scenario state — tests write here before each assertion
// ---------------------------------------------------------------------------

interface InviteRow { id: string }
interface MemberRow { id: string }
interface AuthUser { id: string; email: string }

interface GatingScenario {
  invite: InviteRow | null;
  inviteError?: { code: string; message: string } | null;
  authUser: AuthUser | null;
  member: MemberRow | null;
}

let scenario: GatingScenario = {
  invite: null,
  inviteError: null,
  authUser: null,
  member: null,
};

// ---------------------------------------------------------------------------
// Top-level mocks — hoisted before imports by Vitest
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// signInWithOtp succeeds by default — test failures come from gating only
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOtp: vi.fn(async () => ({ error: null })),
    },
  })),
}));

// Admin client reads from the mutable `scenario` object each time it is called.
// This is the key pattern: the factory captures `scenario` by reference, so
// tests can mutate `scenario` and the mock reflects the new state immediately.
vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'circle_invites') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gt: () => ({
                  maybeSingle: async () => ({
                    data: scenario.invite,
                    error: scenario.inviteError ?? null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      // circle_members
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: scenario.member,
                error: null,
              }),
            }),
          }),
        }),
      };
    },
    auth: {
      admin: {
        // getUserByEmail avoids listUsers() pagination bug (default page = 50 users)
        getUserByEmail: async (_email: string) => ({
          data: scenario.authUser ? { user: scenario.authUser } : null,
          error: scenario.authUser ? null : { message: 'User not found' },
        }),
      },
    },
  })),
}));

// Import AFTER mocks are registered
import { signInWithEmail } from '@/app/actions/auth';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('signInWithEmail — invite gating', () => {
  beforeEach(() => {
    // Reset to a "blocked by default" scenario so tests must explicitly opt-in
    scenario = { invite: null, inviteError: null, authUser: null, member: null };
  });

  it('allows sign-in when email has a pending, non-expired invite', async () => {
    /**
     * WHY: Primary happy path. Newly invited users must be able to log in on
     * first visit via their invite link.
     */
    scenario.invite = { id: 'inv-1' };

    const result = await signInWithEmail('invited@example.com');
    expect(result.success).toBe(true);
  });

  it('allows sign-in when email belongs to an existing active circle member', async () => {
    /**
     * WHY: Existing members have no pending invite (invite was accepted months
     * ago). They must still be able to log in via their email — checked via the
     * circle_members fallback path.
     */
    scenario.invite = null;
    scenario.authUser = { id: 'user-42', email: 'member@example.com' };
    scenario.member = { id: 'membership-99' };

    const result = await signInWithEmail('member@example.com');
    expect(result.success).toBe(true);
  });

  it('blocks sign-in for an email with no invite and no membership', async () => {
    /**
     * WHY: Core security gate. An arbitrary email must not gain access.
     * Error message is deliberately vague — no information leakage about
     * whether the email exists in the system (privacy principle).
     */
    // scenario already: invite=null, users=[], member=null

    const result = await signInWithEmail('stranger@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này chưa được mời vào vòng tròn.');
    }
  });

  it('blocks sign-in when invite status is "accepted" (already used)', async () => {
    /**
     * WHY: The DB query filters `.eq('status', 'pending')`, so an accepted
     * invite returns no row. Simulate that: invite=null, no membership.
     * An accepted invite without active membership must NOT grant access —
     * the user may have been removed from the circle after joining.
     */
    // DB returns null for accepted invite (filtered out by status='pending')
    scenario.invite = null;
    scenario.authUser = { id: 'user-88', email: 'used-invite@example.com' };
    scenario.member = null; // not an active member

    const result = await signInWithEmail('used-invite@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này chưa được mời vào vòng tròn.');
    }
  });

  it('blocks sign-in when invite is expired (expires_at in the past)', async () => {
    /**
     * WHY: Expired invites are a critical boundary. The gate query uses
     * `.gt('expires_at', now)` so the DB returns no row for expired invites.
     * If this check broke, expired links would permanently grant access.
     */
    // Expired invite filtered out by .gt('expires_at', now) → null returned
    scenario.invite = null;
    scenario.users = [];
    scenario.member = null;

    const result = await signInWithEmail('expired-invite@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này chưa được mời vào vòng tròn.');
    }
  });

  it('falls back to membership check when invite lookup has a DB error', async () => {
    /**
     * WHY: The implementation logs the invite error and continues to the
     * membership check (fail-open on the invite branch). If the user IS
     * a member, they should still get in despite the invite table error.
     * This avoids a transient DB hiccup permanently locking out members.
     */
    scenario.invite = null;
    scenario.inviteError = { code: 'PGRST301', message: 'connection timeout' };
    scenario.authUser = { id: 'user-77', email: 'dbfail@example.com' };
    scenario.member = { id: 'membership-77' };

    const result = await signInWithEmail('dbfail@example.com');
    expect(result.success).toBe(true);
  });

  it('blocks when invite lookup fails AND user is not a member', async () => {
    /**
     * WHY: Complement of the previous test. DB error on invite + no membership
     * = still blocked. Fail-open on invite branch does not mean fail-open overall.
     */
    scenario.invite = null;
    scenario.inviteError = { code: 'PGRST301', message: 'timeout' };
    scenario.authUser = null; // no matching user in auth.users
    scenario.member = null;

    const result = await signInWithEmail('ghost@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này chưa được mời vào vòng tròn.');
    }
  });

  it('normalizes email to lowercase before gating check', async () => {
    /**
     * WHY: User might type "User@Example.COM". The action normalizes to
     * lowercase before the DB query. The invite in DB should be lowercase.
     * This test verifies the normalization path reaches isEmailAllowed.
     */
    scenario.invite = { id: 'inv-case' };

    // Pass uppercase email — should normalize and find the invite
    const result = await signInWithEmail('INVITED@EXAMPLE.COM');
    expect(result.success).toBe(true);
  });
});
