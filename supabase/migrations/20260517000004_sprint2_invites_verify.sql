-- =============================================================================
-- Migration: 20260517000004_sprint2_invites_verify.sql
-- Description: Sprint 2 schema verification — circle_invites integrity checks.
--              No structural changes required; Sprint 0 DDL already satisfies
--              all Sprint 2 Server Action requirements.
--
--              This migration:
--              1. Asserts circle_invites.token UNIQUE constraint is present.
--              2. Asserts the partial index idx_invites_token exists.
--              3. Documents RLS coverage audit for invites (no changes needed).
--
-- Author: Schema Agent
-- Date: 2026-05-17
-- Refs: D-024, D-027
-- =============================================================================
-- ROLLBACK: this migration makes no structural changes. Rollback = no-op.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ASSERTION 1: circle_invites.token must have a UNIQUE constraint.
-- Fails loudly during migration run if the constraint is missing.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   information_schema.table_constraints tc
    join   information_schema.constraint_column_usage ccu
           on tc.constraint_name = ccu.constraint_name
           and tc.table_schema   = ccu.table_schema
    where  tc.table_name        = 'circle_invites'
      and  ccu.column_name      = 'token'
      and  tc.constraint_type   = 'UNIQUE'
      and  tc.table_schema      = 'public'
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: circle_invites.token is missing UNIQUE constraint. '
      'Sprint 2 invite-accept flow requires token to be globally unique.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ASSERTION 2: Partial index idx_invites_token must exist.
-- This index is critical for O(1) token lookups on the accept-invite path.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   pg_indexes
    where  tablename  = 'circle_invites'
      and  indexname  = 'idx_invites_token'
      and  schemaname = 'public'
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: partial index idx_invites_token is missing on '
      'circle_invites. Create it with: '
      'CREATE INDEX idx_invites_token ON circle_invites(token) WHERE status = ''pending'';';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS AUDIT NOTE (Sprint 2 — no SQL changes, documentation only):
--
-- circle_invites policies in place (from 20260517000002_rls_policies.sql):
--
--   "invites_select_inviter"  FOR SELECT  USING (invited_by = auth.uid())
--     → The person who sent the invite can see its status.
--
--   "invites_insert_member"   FOR INSERT  WITH CHECK (
--       is_circle_member(circle_id, auth.uid()) AND invited_by = auth.uid()
--     )
--     → Only active circle members can create invites for their own circle.
--
-- Sprint 2 Server Actions and their RLS interaction:
--
--   inviteToCircle()    — uses anon/authenticated client. INSERT policy applies.
--   acceptInvite(token) — uses service_role client. RLS bypassed by design.
--                         Lookup by token requires no SELECT policy for invitee
--                         (invitee may not have an account yet).
--   expireInvites()     — Edge Function uses service_role. RLS bypassed by design.
--
-- VERDICT: existing RLS is sufficient for all Sprint 2 flows.
-- No new policies needed. Service role usage is intentional and correct.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- ROLLBACK SQL
-- This migration is assertion-only (no DDL). Rollback = no-op.
-- =============================================================================
