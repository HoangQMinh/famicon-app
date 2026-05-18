-- =============================================================================
-- Migration: 20260517000006_sprint3_discovery_settings.sql
-- Description: Sprint 3 — user_discovery_settings schema verification + trigger.
--
--              The table user_discovery_settings was created in 000001 and its
--              RLS policies were set in 000002. This migration:
--
--              1. Asserts the table exists with the correct structure.
--              2. Asserts RLS is enabled on the table.
--              3. Asserts the self-read/write policy exists.
--              4. Adds the missing updated_at auto-update trigger (structural gap
--                 from 000001 — update_updated_at() exists but was not wired to
--                 this table, unlike profiles and aid_requests).
--
--              No table or policy is created here to avoid duplicate-object errors.
--              The discovery visibility policy (Sprint 11) is deliberately NOT added.
--
-- Author: Schema Agent
-- Date: 2026-05-17
-- Refs: D-023, D-020, D-031, ADR-005
-- =============================================================================
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ASSERTION 1: user_discovery_settings table must exist.
-- Fails loudly if the prerequisite migration (000001) was not applied.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   information_schema.tables
    where  table_schema = 'public'
      and  table_name   = 'user_discovery_settings'
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: table user_discovery_settings does not exist. '
      'Migration 000001 (init_tables) must be applied before this migration.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ASSERTION 2: RLS must be enabled on user_discovery_settings.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   pg_class c
    join   pg_namespace n on n.oid = c.relnamespace
    where  n.nspname  = 'public'
      and  c.relname  = 'user_discovery_settings'
      and  c.relrowsecurity = true
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: RLS is not enabled on user_discovery_settings. '
      'Migration 000002 (rls_policies) must be applied before this migration.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ASSERTION 3: self-read/write policy "discovery_settings_self" must exist.
-- Sprint 3 requirement: user can only read and update their own settings row.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   pg_policies
    where  schemaname = 'public'
      and  tablename  = 'user_discovery_settings'
      and  policyname = 'discovery_settings_self'
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: policy "discovery_settings_self" is missing on '
      'user_discovery_settings. Migration 000002 (rls_policies) must be applied '
      'before this migration.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ASSERTION 4: update_updated_at() function must exist (created in 000001).
-- Required before we can attach a trigger that calls it.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from   pg_proc p
    join   pg_namespace n on n.oid = p.pronamespace
    where  n.nspname  = 'public'
      and  p.proname  = 'update_updated_at'
  ) then
    raise exception
      'SCHEMA ASSERTION FAILED: function update_updated_at() does not exist. '
      'Migration 000001 (init_tables) must be applied before this migration.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 1: Add the missing updated_at trigger on user_discovery_settings.
--
-- The function update_updated_at() was created in 000001 and is already used
-- by profiles_updated_at and aid_requests_updated_at triggers. The trigger was
-- not attached to user_discovery_settings in 000001 — this is the only
-- structural gap this migration closes.
--
-- Using CREATE TRIGGER (not CREATE OR REPLACE) intentionally: if the trigger
-- somehow already exists, this will raise an error rather than silently
-- overwriting it, ensuring we detect any drift.
-- ---------------------------------------------------------------------------
create trigger user_discovery_settings_updated_at
  before update on user_discovery_settings
  for each row execute function update_updated_at();

-- =============================================================================
-- ROLLBACK SQL (reverses this migration only — does not undo 000001/000002)
-- =============================================================================
-- drop trigger if exists user_discovery_settings_updated_at on user_discovery_settings;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SPRINT 11 NOTE (do not implement here):
-- When Discovery feature is built, a separate migration will add:
--
--   create policy "discovery_settings_visible_reader" on user_discovery_settings
--     for select using (
--       is_visible = true
--       -- plus radius/location check when location columns are added to profiles
--     );
--
-- That policy MUST NOT be added before Sprint 11 to prevent premature data exposure.
-- See data-model.md for the full Sprint 11 plan.
-- ---------------------------------------------------------------------------
