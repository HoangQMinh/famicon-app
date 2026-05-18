-- =============================================================================
-- Migration: 20260517000002_rls_policies.sql
-- Description: Enable RLS and create all Row Level Security policies
-- Author: Schema Agent
-- Date: 2026-05-17
-- Refs: ADR-005, D-003, D-004, D-020, D-028
--
-- SECURITY PRINCIPLES:
--   - Default DENY: no policy = no access. RLS is enabled on all tables.
--   - Membership checks always go through circle_members (never hardcode user_id
--     checks as the sole guard on circle-scoped data).
--   - Helper function is_circle_member() is SECURITY DEFINER to prevent
--     bypassing RLS on circle_members during the membership check itself.
-- =============================================================================
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Enable RLS on all tables (default deny)
-- ---------------------------------------------------------------------------

alter table profiles                  enable row level security;
alter table circles                   enable row level security;
alter table circle_members            enable row level security;
alter table circle_invites            enable row level security;
alter table aid_requests              enable row level security;
alter table help_offers               enable row level security;
alter table push_subscriptions        enable row level security;
alter table user_discovery_settings   enable row level security;

-- ---------------------------------------------------------------------------
-- STEP 2: Helper function
-- SECURITY DEFINER so it runs with the function owner's privileges,
-- allowing it to read circle_members without triggering its own RLS policies.
-- ---------------------------------------------------------------------------

create or replace function is_circle_member(p_circle_id uuid, p_user_id uuid)
returns boolean language sql security definer
stable  -- result is stable within a transaction for the same inputs
as $$
  select exists (
    select 1 from circle_members
    where circle_id = p_circle_id
      and user_id   = p_user_id
      and is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- STEP 3: profiles RLS policies
--
-- SELECT:
--   - User reads own profile
--   - User reads profiles of members who share at least one active circle
-- UPDATE:
--   - User updates only own profile
-- INSERT: handled by auth trigger (service role) — no user-level INSERT policy
-- DELETE: forbidden for users (D-030: soft delete via is_active only)
-- ---------------------------------------------------------------------------

create policy "profiles_select_self" on profiles
  for select using (auth.uid() = id);

-- Cross-join via circle_members to find co-members.
-- Both cm1 (viewer) and cm2 (target profile) must be is_active = true.
create policy "profiles_select_circle_member" on profiles
  for select using (
    exists (
      select 1 from circle_members cm1
      join circle_members cm2
        on cm1.circle_id = cm2.circle_id
      where cm1.user_id  = auth.uid()
        and cm2.user_id  = profiles.id
        and cm1.is_active = true
        and cm2.is_active = true
    )
  );

create policy "profiles_update_self" on profiles
  for update
  using     (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- STEP 4: circles RLS policies
--
-- SELECT: only members of a circle see that circle
-- INSERT: authenticated user can create a circle (they become created_by)
-- UPDATE/DELETE: not exposed to users; handled by service role
-- ---------------------------------------------------------------------------

create policy "circles_select_member" on circles
  for select using (is_circle_member(id, auth.uid()));

create policy "circles_insert_authenticated" on circles
  for insert with check (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- STEP 5: circle_members RLS policies
--
-- SELECT: active members of a circle can see the full member list of that circle
-- INSERT/UPDATE/DELETE: only via service role (Server Actions).
--   Adding/removing members goes through invitation flow, not direct user writes.
-- ---------------------------------------------------------------------------

create policy "members_select_same_circle" on circle_members
  for select using (
    is_circle_member(circle_id, auth.uid())
  );

-- No user-level INSERT policy — circle_members rows are inserted by service role
-- after invite acceptance (Server Action).

-- ---------------------------------------------------------------------------
-- STEP 6: circle_invites RLS policies
--
-- SELECT: only the person who sent the invite can see it
-- INSERT: only active members of the target circle can invite
-- UPDATE/DELETE: service role only (expiry handled server-side)
-- ---------------------------------------------------------------------------

create policy "invites_select_inviter" on circle_invites
  for select using (invited_by = auth.uid());

create policy "invites_insert_member" on circle_invites
  for insert with check (
    is_circle_member(circle_id, auth.uid())
    and invited_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- STEP 7: aid_requests RLS policies
--
-- SELECT: any active member of the circle sees all requests in that circle
-- INSERT: member can post a request, must set themselves as requester
-- UPDATE: only the requester can update their own request
--   (e.g., change status to 'cancelled', update description)
-- DELETE: no user-level delete — status changes are used instead
-- ---------------------------------------------------------------------------

create policy "requests_select_circle_member" on aid_requests
  for select using (is_circle_member(circle_id, auth.uid()));

create policy "requests_insert_member" on aid_requests
  for insert with check (
    is_circle_member(circle_id, auth.uid())
    and requester_id = auth.uid()
  );

create policy "requests_update_requester" on aid_requests
  for update
  using     (requester_id = auth.uid())
  with check (requester_id = auth.uid());

-- ---------------------------------------------------------------------------
-- STEP 8: help_offers RLS policies
--
-- SELECT:
--   - Helper sees their own offer(s)
--   - Requester sees offers made against their request
--   NOTE: "who declined" is NOT surfaced via policy design (Principle 3).
--         The policy allows requester to see all offers including declined,
--         but the application layer must NOT show declined offers to requester.
--         The DB-layer enforcement of Principle 3 is handled by the app.
--
-- INSERT:
--   - Helper must be an active member of the circle the request belongs to
--   - Request must be 'open' (cannot offer on closed/matched requests)
--   - helper_id must equal auth.uid() (no ghost offers)
-- UPDATE/DELETE: service role only (acceptance handled server-side)
-- ---------------------------------------------------------------------------

create policy "offers_select" on help_offers
  for select using (
    helper_id = auth.uid()
    or exists (
      select 1 from aid_requests ar
      where ar.id            = help_offers.request_id
        and ar.requester_id  = auth.uid()
    )
  );

create policy "offers_insert_member" on help_offers
  for insert with check (
    helper_id = auth.uid()
    and exists (
      select 1 from aid_requests ar
      join circle_members cm
        on ar.circle_id  = cm.circle_id
      where ar.id        = help_offers.request_id
        and cm.user_id   = auth.uid()
        and cm.is_active = true
        and ar.status    = 'open'
    )
  );

-- ---------------------------------------------------------------------------
-- STEP 9: push_subscriptions RLS policies
--
-- ALL operations: user can only access their own subscription rows.
-- This covers SELECT, INSERT, UPDATE, DELETE.
-- ---------------------------------------------------------------------------

create policy "push_self" on push_subscriptions
  for all
  using     (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- STEP 10: user_discovery_settings RLS policies
--
-- Phase 3 (Sprint 0): user reads and writes only their own settings.
-- Sprint 11 will add a separate SELECT policy for the discovery list
-- that filters is_visible = true and checks radius/location — NOT added here.
--
-- NO column for connection_count, visibility_count, or any counter
-- (Constitution Principle 2 / D-004).
-- ---------------------------------------------------------------------------

create policy "discovery_settings_self" on user_discovery_settings
  for all
  using     (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================================
-- ROLLBACK SQL (run in reverse order to undo this migration)
-- =============================================================================
-- drop policy if exists "discovery_settings_self"      on user_discovery_settings;
-- drop policy if exists "push_self"                    on push_subscriptions;
-- drop policy if exists "offers_insert_member"         on help_offers;
-- drop policy if exists "offers_select"                on help_offers;
-- drop policy if exists "requests_update_requester"    on aid_requests;
-- drop policy if exists "requests_insert_member"       on aid_requests;
-- drop policy if exists "requests_select_circle_member" on aid_requests;
-- drop policy if exists "invites_insert_member"        on circle_invites;
-- drop policy if exists "invites_select_inviter"       on circle_invites;
-- drop policy if exists "members_select_same_circle"   on circle_members;
-- drop policy if exists "circles_insert_authenticated" on circles;
-- drop policy if exists "circles_select_member"        on circles;
-- drop policy if exists "profiles_update_self"         on profiles;
-- drop policy if exists "profiles_select_circle_member" on profiles;
-- drop policy if exists "profiles_select_self"         on profiles;
-- drop function if exists is_circle_member(uuid, uuid);
-- alter table user_discovery_settings disable row level security;
-- alter table push_subscriptions      disable row level security;
-- alter table help_offers             disable row level security;
-- alter table aid_requests            disable row level security;
-- alter table circle_invites          disable row level security;
-- alter table circle_members          disable row level security;
-- alter table circles                 disable row level security;
-- alter table profiles                disable row level security;
-- =============================================================================
