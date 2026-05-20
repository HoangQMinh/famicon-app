-- =============================================================================
-- Migration: 20260519000001_fix_notification_logs_type_check.sql
-- Description: Sprint 8 — Fix notification_logs type CHECK constraint.
--
--              Sprint 6 (D-038) added notification types 'join_request' and
--              'new_member' to the application, but the CHECK constraint on
--              notification_logs.type was not updated. Inserting a row with
--              type = 'join_request' currently raises a constraint violation.
--
--              Fix: drop the existing inline constraint (auto-named
--              notification_logs_type_check by PostgreSQL) and recreate it
--              with all six valid type values:
--                'new_request'       — new aid request posted in circle
--                'urgent_request'    — urgent aid request posted
--                'helper_confirmed'  — helper accepted an offer
--                'invite_reminder'   — reminder for pending invite
--                'join_request'      — user requested to join circle (D-038)
--                'new_member'        — new member joined circle (D-038)
--
--              Idempotent: DROP CONSTRAINT IF EXISTS before ADD CONSTRAINT.
--
-- Author: Schema Agent
-- Date: 2026-05-19
-- Refs: D-038, Sprint 6, Sprint 8 spec
--
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Verify notification_logs table exists before attempting ALTER
-- (fail fast if migrations applied out of order)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from   information_schema.tables
    where  table_schema = 'public'
      and  table_name   = 'notification_logs'
  ) then
    raise exception
      'MIGRATION GUARD: notification_logs table not found. '
      'Ensure 20260517000007_sprint5_notification_logs.sql has been applied first.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 2: Drop the existing CHECK constraint on notification_logs.type
--
-- PostgreSQL names inline CHECK constraints as <table>_<column>_check.
-- The constraint was created without an explicit name in Sprint 5 migration,
-- so the auto-generated name is notification_logs_type_check.
--
-- IF EXISTS makes this idempotent: if the constraint was already dropped
-- (or never existed under this name), the migration continues without error.
-- ---------------------------------------------------------------------------

alter table notification_logs
  drop constraint if exists notification_logs_type_check;

-- ---------------------------------------------------------------------------
-- STEP 3: Recreate CHECK constraint with all six valid type values.
--
-- Values:
--   new_request      — aid request posted (original)
--   urgent_request   — urgent aid request posted (original)
--   helper_confirmed — helper accepted (original)
--   invite_reminder  — pending invite reminder (original)
--   new_member       — new member joined circle (original, but not in app code path)
--   join_request     — user requested to join circle (D-038, Sprint 6 — ADDED)
-- ---------------------------------------------------------------------------

alter table notification_logs
  add constraint notification_logs_type_check
  check (type in (
    'new_request',
    'urgent_request',
    'helper_confirmed',
    'invite_reminder',
    'new_member',
    'join_request'
  ));

-- =============================================================================
-- ROLLBACK SQL
-- To undo this migration: restore the original 5-value constraint
-- (excluding 'join_request').
-- =============================================================================
-- alter table notification_logs
--   drop constraint if exists notification_logs_type_check;
-- alter table notification_logs
--   add constraint notification_logs_type_check
--   check (type in (
--     'new_request',
--     'urgent_request',
--     'helper_confirmed',
--     'invite_reminder',
--     'new_member'
--   ));
-- =============================================================================
