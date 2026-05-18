-- =============================================================================
-- Migration: 20260517000001_init_tables.sql
-- Description: Create all base tables for Sprint 0 — Vòng Tròn Tương Trợ
-- Author: Schema Agent
-- Date: 2026-05-17
-- Refs: ADR-005, D-004, D-023, D-024, D-027, D-028, D-029, D-030, D-031
-- =============================================================================
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: update_updated_at
-- Used by: profiles, aid_requests
-- ---------------------------------------------------------------------------

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- 1:1 with auth.users. Soft-delete via is_active (D-030).
-- No help counters or reputation fields (Constitution Principle 2 / D-004).
-- ---------------------------------------------------------------------------

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) >= 2),
  avatar_emoji  text not null default '👨‍👩‍👧',
  avatar_url    text,                         -- Supabase Storage URL (D-029)
  location      text,                         -- free text: "Yokohama"
  kids_desc     text,                         -- "Bé 3 tuổi, bé 6 tuổi"
  help_tags     text[] default '{}',          -- ['pickup', 'childcare', ...]
  line_user_id  text,                         -- LINE fallback notification (D-011)
  is_active     boolean not null default true, -- soft delete flag (D-030)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: circles
-- A circle is a small trusted group (5-20 families).
-- created_by is the founder; no permanent admin privileges (D-003).
-- ---------------------------------------------------------------------------

create table circles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) >= 2),
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: circle_members
-- Junction table: user <-> circle membership.
-- is_active = false means "left the circle" (D-028).
-- Partial indexes on is_active = true for query performance.
-- ---------------------------------------------------------------------------

create table circle_members (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references circles(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  joined_at  timestamptz not null default now(),
  is_active  boolean not null default true,   -- D-028: active = not deleted
  unique (circle_id, user_id)
);

create index idx_circle_members_circle on circle_members(circle_id) where is_active = true;
create index idx_circle_members_user   on circle_members(user_id)   where is_active = true;

-- ---------------------------------------------------------------------------
-- TABLE: circle_invites
-- Token-based email invitations. Expire after 7 days (D-024).
-- Partial indexes only on pending rows for fast token lookup.
-- ---------------------------------------------------------------------------

create table circle_invites (
  id          uuid primary key default gen_random_uuid(),
  circle_id   uuid not null references circles(id),
  invited_by  uuid not null references profiles(id),
  email       text not null,
  token       text not null unique,           -- random 32-char URL token
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'expired')),
  expires_at  timestamptz not null,           -- D-024: created_at + 7 days
  created_at  timestamptz not null default now()
);

create index idx_invites_token on circle_invites(token) where status = 'pending';
create index idx_invites_email on circle_invites(email) where status = 'pending';

-- ---------------------------------------------------------------------------
-- TABLE: aid_requests
-- Core coordination entity. 5 fixed categories (no free-form to reduce noise).
-- scheduled_at is free text to avoid timezone friction (e.g. "Hôm nay 15:30").
-- No status counter columns (Constitution Principle 2).
-- ---------------------------------------------------------------------------

create table aid_requests (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references circles(id),
  requester_id  uuid not null references profiles(id),
  category      text not null
                check (category in ('pickup', 'borrow', 'childcare', 'ride', 'other')),
  description   text not null check (char_length(description) >= 5),
  scheduled_at  text,                         -- free text (D-006)
  location      text,
  is_urgent     boolean not null default false,
  status        text not null default 'open'
                check (status in ('open', 'matched', 'closed', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_requests_circle    on aid_requests(circle_id, status, created_at desc);
create index idx_requests_requester on aid_requests(requester_id);

create trigger aid_requests_updated_at
  before update on aid_requests
  for each row execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: help_offers
-- Junction: helper responds to an aid_request.
-- Unique constraint prevents duplicate offers from same helper.
-- Declined status is stored but NOT exposed to requester (Constitution Principle 3).
-- ---------------------------------------------------------------------------

create table help_offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references aid_requests(id),
  helper_id   uuid not null references profiles(id),
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  unique (request_id, helper_id)
);

-- ---------------------------------------------------------------------------
-- TABLE: push_subscriptions
-- Web Push API subscription data (D-011).
-- Column named auth_key (not auth) to avoid reserved word conflict.
-- Multiple devices per user are allowed; unique on (user_id, endpoint).
-- ---------------------------------------------------------------------------

create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth_key    text not null,                  -- 'auth' is a reserved word
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- ---------------------------------------------------------------------------
-- TABLE: user_discovery_settings
-- D-023: created in Sprint 0 (alongside profiles) to avoid costly migration later.
-- is_visible defaults to FALSE — explicit opt-in required (D-020).
-- radius_km constrained to allowed values only (D-031).
-- NO connection_count or any counter column (Constitution Principle 2).
-- ---------------------------------------------------------------------------

create table user_discovery_settings (
  user_id     uuid primary key references profiles(id) on delete cascade,
  is_visible  boolean not null default false, -- opt-in, default OFF (D-020)
  radius_km   int not null default 5
              check (radius_km in (3, 5, 10)), -- D-031
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- ROLLBACK SQL (run in reverse order to undo this migration)
-- =============================================================================
-- drop trigger if exists aid_requests_updated_at on aid_requests;
-- drop trigger if exists profiles_updated_at on profiles;
-- drop table if exists user_discovery_settings;
-- drop table if exists push_subscriptions;
-- drop table if exists help_offers;
-- drop table if exists aid_requests;
-- drop table if exists circle_invites;
-- drop table if exists circle_members;
-- drop table if exists circles;
-- drop table if exists profiles;
-- drop function if exists update_updated_at();
-- =============================================================================
