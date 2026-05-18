-- =============================================================================
-- Migration: 20260517000007_sprint5_notification_logs.sql
-- Description: Sprint 5 — Notifications
--
--              1. Create notification_logs table (F5.7) with:
--                 - CHECK constraints on type, channel, status columns
--                 - request_id nullable (invite_reminder has no request)
--                 - Index on (user_id, created_at desc) for rate-limit queries
--                 - RLS enabled; SELECT-self policy for users
--                 - No user-level INSERT policy — Edge Function uses service role
--
--              2. Verify push_subscriptions table and RLS:
--                 - Table was created in 000001_init_tables
--                 - "push_self" FOR ALL policy was created in 000002_rls_policies
--                 - This migration does NOT re-create those objects to avoid
--                   duplicate-object errors; instead it asserts their existence
--                   via DO-blocks and raises an exception if missing (fail fast)
--
-- Author: Schema Agent
-- Date: 2026-05-17
-- Refs: F5.7, D-011, D-034, ADR-004, Sprint 5 spec
--
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Create notification_logs table
--
-- Columns:
--   id          — synthetic PK
--   user_id     — recipient; cascades on profile delete
--   type        — notification type enum (5 values)
--   channel     — delivery channel ('web_push' | 'line')
--   status      — outcome ('sent' | 'failed' | 'skipped_rate_limit' | 'skipped_quiet_hours')
--   request_id  — nullable FK to aid_requests; NULL for invite_reminder type
--   created_at  — immutable timestamp; used for rate-limit window queries
--
-- NOTE: No updated_at column — notification log rows are append-only.
--       No user-level counter columns (Constitution Principle 2 / D-004).
-- ---------------------------------------------------------------------------

create table notification_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  type        text        not null
              check (type in (
                'new_request',
                'urgent_request',
                'helper_confirmed',
                'invite_reminder',
                'new_member'
              )),
  channel     text        not null
              check (channel in ('web_push', 'line')),
  status      text        not null
              check (status in (
                'sent',
                'failed',
                'skipped_rate_limit',
                'skipped_quiet_hours'
              )),
  -- Nullable: invite_reminder notifications are not tied to a specific request
  request_id  uuid        references aid_requests(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Index optimised for rate-limit query pattern:
--   SELECT count(*) FROM notification_logs
--   WHERE user_id = $1 AND created_at >= now() - interval '1 day'
--   AND type != 'urgent_request' AND status = 'sent';
-- Also covers "fetch my logs" queries ordered by recency.
create index idx_notification_logs_user_date
  on notification_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- STEP 2: Enable RLS on notification_logs (default deny)
-- ---------------------------------------------------------------------------

alter table notification_logs enable row level security;

-- ---------------------------------------------------------------------------
-- STEP 3: RLS policy — notification_logs_select_self
--
-- Users may only SELECT their own log rows.
-- Rationale: notification history is personal data; no user should see
--   another user's notification history.
--
-- INSERT: NO user-level policy. Only the Edge Function (running as service role)
--   may insert rows. Service role bypasses RLS entirely.
-- UPDATE/DELETE: no user-level policies — logs are immutable audit records.
-- ---------------------------------------------------------------------------

create policy "notification_logs_select_self" on notification_logs
  for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- STEP 4: Verify push_subscriptions table exists
--
-- push_subscriptions was created in 000001_init_tables. We assert it is
-- present here so this migration fails loudly if the environment is not
-- in the expected state (e.g., migrations applied out of order).
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from   information_schema.tables
    where  table_schema = 'public'
      and  table_name   = 'push_subscriptions'
  ) then
    raise exception
      'MIGRATION GUARD: push_subscriptions table not found. '
      'Ensure 20260517000001_init_tables.sql has been applied first.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 5: Verify push_subscriptions columns are correct
--
-- Specifically verify auth_key column name (not 'auth' — reserved word).
-- ---------------------------------------------------------------------------

do $$
begin
  -- Check auth_key column exists
  if not exists (
    select 1
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'push_subscriptions'
      and  column_name  = 'auth_key'
  ) then
    raise exception
      'MIGRATION GUARD: push_subscriptions.auth_key column not found. '
      'The column must be named auth_key (not auth — reserved word). '
      'Check 20260517000001_init_tables.sql.';
  end if;

  -- Check p256dh column exists
  if not exists (
    select 1
    from   information_schema.columns
    where  table_schema = 'public'
      and  table_name   = 'push_subscriptions'
      and  column_name  = 'p256dh'
  ) then
    raise exception
      'MIGRATION GUARD: push_subscriptions.p256dh column not found. '
      'Check 20260517000001_init_tables.sql.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 6: Verify RLS is enabled on push_subscriptions
-- ---------------------------------------------------------------------------

do $$
declare
  v_rls_enabled boolean;
begin
  select relrowsecurity
  into   v_rls_enabled
  from   pg_class
  where  relname      = 'push_subscriptions'
    and  relnamespace = 'public'::regnamespace;

  if not found or not v_rls_enabled then
    raise exception
      'MIGRATION GUARD: RLS is not enabled on push_subscriptions. '
      'Ensure 20260517000002_rls_policies.sql has been applied.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 7: Verify "push_self" policy exists on push_subscriptions
--
-- The policy "push_self" (FOR ALL, using user_id = auth.uid()) must exist.
-- Created in 000002_rls_policies.sql. We do NOT re-create it here.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from   pg_policies
    where  schemaname = 'public'
      and  tablename  = 'push_subscriptions'
      and  policyname = 'push_self'
  ) then
    raise exception
      'MIGRATION GUARD: RLS policy "push_self" not found on push_subscriptions. '
      'Ensure 20260517000002_rls_policies.sql has been applied.';
  end if;
end;
$$;

-- =============================================================================
-- ROLLBACK SQL
-- Run these statements in order to fully undo this migration.
-- The push_subscriptions verification blocks (STEP 4-7) are read-only and
-- require no rollback actions.
-- =============================================================================
-- drop policy  if exists "notification_logs_select_self" on notification_logs;
-- drop index   if exists idx_notification_logs_user_date;
-- drop table   if exists notification_logs;
-- =============================================================================
