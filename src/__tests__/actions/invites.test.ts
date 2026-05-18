/**
 * Tests for invite Server Actions: createInvite, acceptInvite, revokeInvite.
 *
 * WHY these edge cases matter:
 *  - createInvite: duplicate-invite and already-member guards stop invite spam
 *    before it reaches the DB and prevents social friction within a circle.
 *  - acceptInvite: returning-member detection (D-026) prevents duplicate
 *    circle_members rows which would break RLS queries scoped to one row.
 *  - revokeInvite: ownership check ensures members cannot revoke each other's
 *    invites, which would be a social attack vector in small circles.
 *
 * Mock strategy:
 *  - Module-level `scenario` object mutated per test — same pattern as
 *    auth-invite-gating.test.ts. Factory captures the reference so the mock
 *    reflects the current scenario on every call without per-test vi.doMock.
 *  - Separate `scenario` shapes per action group to keep each describe block
 *    self-contained and readable.
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
// Mutable scenario for createInvite
// ---------------------------------------------------------------------------

interface CreateInviteScenario {
  authUser: { id: string; email: string } | null;
  membership: { circle_id: string } | null;
  membershipError: { code: string } | null;
  existingPendingInvite: { id: string } | null;
  dupInviteError: { code: string } | null;
  acceptedInvite: { id: string } | null;
  acceptedInviteError: { code: string } | null;
  insertedInvite: { id: string } | null;
  insertError: { code: string } | null;
}

let createScenario: CreateInviteScenario = {
  authUser: null,
  membership: null,
  membershipError: null,
  existingPendingInvite: null,
  dupInviteError: null,
  acceptedInvite: null,
  acceptedInviteError: null,
  insertedInvite: null,
  insertError: null,
};

// ---------------------------------------------------------------------------
// Mutable scenario for acceptInvite
// ---------------------------------------------------------------------------

interface AcceptInviteScenario {
  authUser: { id: string; email: string } | null;
  invite: { id: string; circle_id: string; email: string } | null;
  inviteError: { code: string } | null;
  existingMember: { id: string; is_active: boolean } | null;
  memberCheckError: { code: string } | null;
  reactivateError: { code: string } | null;
  insertMemberError: { code: string } | null;
  inviteUpdateError: { code: string } | null;
  circle: { name: string } | null;
  circleError: { code: string } | null;
}

let acceptScenario: AcceptInviteScenario = {
  authUser: null,
  invite: null,
  inviteError: null,
  existingMember: null,
  memberCheckError: null,
  reactivateError: null,
  insertMemberError: null,
  inviteUpdateError: null,
  circle: null,
  circleError: null,
};

// ---------------------------------------------------------------------------
// Mutable scenario for revokeInvite
// ---------------------------------------------------------------------------

interface RevokeInviteScenario {
  authUser: { id: string } | null;
  fetchedInvite: { id: string; invited_by: string; status: string } | null;
  fetchError: { code: string } | null;
  updateError: { code: string } | null;
}

let revokeScenario: RevokeInviteScenario = {
  authUser: null,
  fetchedInvite: null,
  fetchError: null,
  updateError: null,
};

// ---------------------------------------------------------------------------
// Mock: @/lib/supabase/server — user client (auth.getUser only)
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        const user =
          createScenario.authUser ??
          acceptScenario.authUser ??
          revokeScenario.authUser;
        if (!user) return { data: { user: null }, error: { message: 'not authenticated' } };
        return { data: { user }, error: null };
      }),
    },
    // createInvite uses supabase.from('circle_members') via RLS for the membership
    // lookup. The admin client handles the invite table queries. This stub
    // delegates to the same scenario the admin mock uses.
    from: (table: string) => {
      if (table === 'circle_members' && createScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
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
      // updateProfile uses supabase.from('profiles') via RLS
      return {
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      };
    },
  })),
}));

// ---------------------------------------------------------------------------
// Mock: @/lib/supabase/server-admin — admin client (service role)
//
// Routes table queries to the correct scenario based on the active describe block.
// The `from` factory dispatches on table name so each chain target is explicit.
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      // ---- createInvite paths ----
      if (table === 'circle_members' && createScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: createScenario.membership,
                    error: createScenario.membershipError,
                  }),
                }),
              }),
            }),
          }),
          // For acceptInvite reactivate path (update)
          update: () => ({
            eq: () => ({ eq: () => Promise.resolve({ error: null }) }),
          }),
          // For circle_members insert
          insert: () => Promise.resolve({ error: null }),
        };
      }

      if (table === 'circle_invites' && createScenario.authUser) {
        let callCount = 0;
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  gt: () => ({
                    maybeSingle: async () => {
                      callCount++;
                      if (callCount === 1) {
                        // First chain: duplicate pending invite check
                        return {
                          data: createScenario.existingPendingInvite,
                          error: createScenario.dupInviteError,
                        };
                      }
                      // Second chain: accepted-invite (already member) check
                      return {
                        data: null,
                        error: null,
                      };
                    },
                  }),
                  // For accepted invite check (no gt() step)
                  maybeSingle: async () => ({
                    data: createScenario.acceptedInvite,
                    error: createScenario.acceptedInviteError,
                  }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: createScenario.insertedInvite,
                error: createScenario.insertError,
              }),
            }),
          }),
        };
      }

      // ---- acceptInvite paths ----
      if (table === 'circle_invites' && acceptScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gt: () => ({
                  maybeSingle: async () => ({
                    data: acceptScenario.invite,
                    error: acceptScenario.inviteError,
                  }),
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: acceptScenario.inviteUpdateError }),
          }),
        };
      }

      if (table === 'circle_members' && acceptScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: acceptScenario.existingMember,
                  error: acceptScenario.memberCheckError,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ error: acceptScenario.reactivateError }),
            }),
          }),
          insert: () =>
            Promise.resolve({ error: acceptScenario.insertMemberError }),
        };
      }

      if (table === 'circles' && acceptScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: acceptScenario.circle,
                error: acceptScenario.circleError,
              }),
            }),
          }),
        };
      }

      // ---- revokeInvite paths ----
      if (table === 'circle_invites' && revokeScenario.authUser) {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: revokeScenario.fetchedInvite,
                error: revokeScenario.fetchError,
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: revokeScenario.updateError }),
          }),
        };
      }

      // Fallback — should not be reached in normal test flows
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    },
  })),
}));

// ---------------------------------------------------------------------------
// Import actions AFTER mocks are declared
// ---------------------------------------------------------------------------

import { createInvite, acceptInvite, revokeInvite } from '@/app/actions/invites';

// ---------------------------------------------------------------------------
// createInvite tests
// ---------------------------------------------------------------------------

describe('createInvite', () => {
  const VALID_TOKEN = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'; // 32 hex chars

  beforeEach(() => {
    createScenario = {
      authUser: null,
      membership: null,
      membershipError: null,
      existingPendingInvite: null,
      dupInviteError: null,
      acceptedInvite: null,
      acceptedInviteError: null,
      insertedInvite: null,
      insertError: null,
    };
    acceptScenario = { ...acceptScenario, authUser: null };
    revokeScenario = { ...revokeScenario, authUser: null };
  });

  it('rejects unauthenticated caller', async () => {
    // createScenario.authUser remains null
    const result = await createInvite('new@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects invalid email format', async () => {
    createScenario.authUser = { id: 'uid-1', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };

    const result = await createInvite('not-an-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  it('rejects when caller has no active circle membership', async () => {
    createScenario.authUser = { id: 'uid-2', email: 'host@example.com' };
    createScenario.membership = null;

    const result = await createInvite('guest@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('chưa thuộc vòng tròn');
    }
  });

  it('returns error when duplicate pending invite exists', async () => {
    /**
     * WHY: Prevents the same email from accumulating multiple pending invites
     * for the same circle, which would confuse the invitee and clutter audit logs.
     */
    createScenario.authUser = { id: 'uid-3', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };
    createScenario.existingPendingInvite = { id: 'inv-existing' };

    const result = await createInvite('already-invited@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này đã được mời rồi.');
    }
  });

  it('returns error when email belongs to an already-accepted member', async () => {
    /**
     * WHY: Sending a new invite to an active member would be confusing and
     * could expose the member's circle participation to the invitee confirmation email.
     */
    createScenario.authUser = { id: 'uid-4', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };
    createScenario.existingPendingInvite = null;
    createScenario.acceptedInvite = { id: 'inv-accepted' };

    const result = await createInvite('member@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email này đã là thành viên.');
    }
  });

  it('creates invite and returns token of 32 chars (UUID stripped of dashes)', async () => {
    createScenario.authUser = { id: 'uid-5', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };
    createScenario.existingPendingInvite = null;
    createScenario.acceptedInvite = null;
    createScenario.insertedInvite = { id: 'inv-new' };

    const result = await createInvite('newmember@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toHaveLength(32);
      // Must be hex only — dashes removed from UUID
      expect(result.data.token).toMatch(/^[0-9a-f]{32}$/i);
    }
  });

  it('sets expires_at approximately 7 days from now', async () => {
    createScenario.authUser = { id: 'uid-6', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };
    createScenario.existingPendingInvite = null;
    createScenario.acceptedInvite = null;
    createScenario.insertedInvite = { id: 'inv-new2' };

    const before = Date.now();
    const result = await createInvite('fresh@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      const expiresMs = new Date(result.data.expires_at).getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      // Allow ±5 seconds for execution time
      expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
      expect(expiresMs).toBeLessThanOrEqual(before + sevenDaysMs + 5000);
    }
  });

  it('includes invite_url with the token in the return value', async () => {
    createScenario.authUser = { id: 'uid-7', email: 'host@example.com' };
    createScenario.membership = { circle_id: 'circle-1' };
    createScenario.existingPendingInvite = null;
    createScenario.acceptedInvite = null;
    createScenario.insertedInvite = { id: 'inv-url' };

    const result = await createInvite('urltest@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invite_url).toContain('/join/');
      expect(result.data.invite_url).toContain(result.data.token);
    }
  });
});

// ---------------------------------------------------------------------------
// acceptInvite tests
// ---------------------------------------------------------------------------

describe('acceptInvite', () => {
  const VALID_TOKEN = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

  beforeEach(() => {
    acceptScenario = {
      authUser: null,
      invite: null,
      inviteError: null,
      existingMember: null,
      memberCheckError: null,
      reactivateError: null,
      insertMemberError: null,
      inviteUpdateError: null,
      circle: null,
      circleError: null,
    };
    createScenario = { ...createScenario, authUser: null };
    revokeScenario = { ...revokeScenario, authUser: null };
  });

  it('rejects unauthenticated caller', async () => {
    // acceptScenario.authUser remains null
    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects malformed token (too short)', async () => {
    acceptScenario.authUser = { id: 'uid-1', email: 'user@example.com' };
    const result = await acceptInvite('short');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Link mời đã hết hạn hoặc không hợp lệ.');
    }
  });

  it('rejects token with dashes (UUID format — must be stripped)', async () => {
    /**
     * WHY: Tokens are generated by stripping dashes from UUIDs. If someone
     * pastes the raw UUID format (with dashes), we should reject it clearly
     * rather than silently matching nothing in the DB.
     */
    acceptScenario.authUser = { id: 'uid-1', email: 'user@example.com' };
    const result = await acceptInvite('a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Link mời đã hết hạn hoặc không hợp lệ.');
    }
  });

  it('returns error when invite does not exist in DB', async () => {
    acceptScenario.authUser = { id: 'uid-2', email: 'user@example.com' };
    acceptScenario.invite = null;

    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Link mời đã hết hạn hoặc không hợp lệ.');
    }
  });

  it('returns error when invite is expired (DB returns null after gt filter)', async () => {
    /**
     * WHY: The query uses .gt('expires_at', now) which returns null for expired
     * rows. The action must treat null-from-DB as expired, not as a server error.
     */
    acceptScenario.authUser = { id: 'uid-3', email: 'user@example.com' };
    acceptScenario.invite = null; // simulates expired row filtered out

    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Link mời đã hết hạn hoặc không hợp lệ.');
    }
  });

  it('accepts valid invite for a new member and sets is_returning_member false', async () => {
    acceptScenario.authUser = { id: 'uid-4', email: 'newbie@example.com' };
    acceptScenario.invite = {
      id: 'inv-1',
      circle_id: 'circle-A',
      email: 'newbie@example.com',
    };
    acceptScenario.existingMember = null; // first time joining
    acceptScenario.circle = { name: 'Vòng Nhật Bản Tokyo' };

    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.circle_id).toBe('circle-A');
      expect(result.data.circle_name).toBe('Vòng Nhật Bản Tokyo');
      expect(result.data.is_returning_member).toBe(false);
    }
  });

  it('detects returning member and sets is_returning_member true', async () => {
    /**
     * WHY: D-026 prevents duplicate circle_members rows. A returning member
     * must be reactivated (is_active = true) rather than re-inserted.
     * The flag informs the UI to show a "welcome back" message instead of
     * a first-time onboarding flow.
     */
    acceptScenario.authUser = { id: 'uid-5', email: 'returning@example.com' };
    acceptScenario.invite = {
      id: 'inv-2',
      circle_id: 'circle-B',
      email: 'returning@example.com',
    };
    acceptScenario.existingMember = { id: 'member-old', is_active: false };
    acceptScenario.circle = { name: 'Vòng Cũ' };

    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_returning_member).toBe(true);
    }
  });

  it('treats already-active member as returning (no duplicate insert)', async () => {
    /**
     * WHY: Edge case — user calls acceptInvite twice (double submit, network retry).
     * Second call finds is_active=true; action should be a no-op for membership
     * and still return success with is_returning_member=true.
     */
    acceptScenario.authUser = { id: 'uid-6', email: 'active@example.com' };
    acceptScenario.invite = {
      id: 'inv-3',
      circle_id: 'circle-C',
      email: 'active@example.com',
    };
    acceptScenario.existingMember = { id: 'member-current', is_active: true };
    acceptScenario.circle = { name: 'Vòng Hiện Tại' };

    const result = await acceptInvite(VALID_TOKEN);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_returning_member).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// revokeInvite tests
// ---------------------------------------------------------------------------

describe('revokeInvite', () => {
  const INVITE_ID = 'invite-uuid-0001';
  const OWNER_UID = 'user-owner-001';

  beforeEach(() => {
    revokeScenario = {
      authUser: null,
      fetchedInvite: null,
      fetchError: null,
      updateError: null,
    };
    createScenario = { ...createScenario, authUser: null };
    acceptScenario = { ...acceptScenario, authUser: null };
  });

  it('rejects unauthenticated caller', async () => {
    const result = await revokeInvite(INVITE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Bạn cần đăng nhập.');
    }
  });

  it('rejects empty invite ID', async () => {
    revokeScenario.authUser = { id: OWNER_UID };
    const result = await revokeInvite('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không hợp lệ');
    }
  });

  it('returns not-found error when invite does not exist', async () => {
    revokeScenario.authUser = { id: OWNER_UID };
    revokeScenario.fetchedInvite = null;

    const result = await revokeInvite(INVITE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Không tìm thấy');
    }
  });

  it('rejects revoke when caller is not the invite owner', async () => {
    /**
     * WHY: Ownership enforcement prevents member A from revoking an invite sent
     * by member B. Without this check, any member could silently invalidate
     * another member's invite link — a social attack in small trusted circles.
     */
    revokeScenario.authUser = { id: 'user-different-999' };
    revokeScenario.fetchedInvite = {
      id: INVITE_ID,
      invited_by: OWNER_UID, // different from caller
      status: 'pending',
    };

    const result = await revokeInvite(INVITE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('không có quyền');
    }
  });

  it('rejects revoke of already-processed invite (status != pending)', async () => {
    /**
     * WHY: An accepted invite represents a completed onboarding. Allowing revoke
     * on accepted invites could give a false impression of "kicking" the member.
     * The action should redirect to the leave-circle flow instead.
     */
    revokeScenario.authUser = { id: OWNER_UID };
    revokeScenario.fetchedInvite = {
      id: INVITE_ID,
      invited_by: OWNER_UID,
      status: 'accepted',
    };

    const result = await revokeInvite(INVITE_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('đã được xử lý');
    }
  });

  it('revokes a pending invite owned by the caller', async () => {
    revokeScenario.authUser = { id: OWNER_UID };
    revokeScenario.fetchedInvite = {
      id: INVITE_ID,
      invited_by: OWNER_UID,
      status: 'pending',
    };
    revokeScenario.updateError = null;

    const result = await revokeInvite(INVITE_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.revoked).toBe(true);
    }
  });
});
