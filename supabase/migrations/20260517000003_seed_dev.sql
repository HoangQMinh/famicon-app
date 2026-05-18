-- =============================================================================
-- Migration: 20260517000003_seed_dev.sql
-- Description: Development seed data — Yokohama Circle
-- Author: Schema Agent
-- Date: 2026-05-17
--
-- DEV ONLY — KHÔNG CHẠY TRÊN PRODUCTION
-- This file inserts test data for local development and staging.
-- It must NEVER be applied to the production Supabase project.
--
-- Usage:
--   supabase db reset          (applies all migrations + seed)
--   psql ... -f this_file.sql  (manual apply on local)
--
-- Note: This seed does NOT insert rows into auth.users.
--   In local Supabase dev, create users via the Supabase dashboard or
--   supabase/seed.sql email+password approach, then reference their UUIDs here.
--   The UUIDs below are fixed constants safe for dev/test environments.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fixed UUIDs for reproducible dev data
-- These are deterministic so foreign keys stay consistent across resets.
-- ---------------------------------------------------------------------------

-- Profiles (auth.users entries must exist with matching IDs in local dev)
-- In local Supabase, create via: supabase auth admin create-user (CLI) or dashboard.

-- dev user IDs (safe placeholder UUIDs — do not use in production)
-- user_1: Nguyễn Lan Anh   — circle creator
-- user_2: Trần Minh Khoa   — member
-- user_3: Lê Thị Hoa       — member

-- circle_id
-- circle_1: Yokohama Circle

-- ---------------------------------------------------------------------------
-- Profiles
-- IMPORTANT: insert profiles AFTER the corresponding auth.users rows exist.
-- Run this seed only after creating the three test users in auth.
-- ---------------------------------------------------------------------------

insert into profiles (id, display_name, avatar_emoji, location, kids_desc, help_tags, is_active)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Lan Anh',
    '👩',
    'Yokohama',
    'Bé 4 tuổi',
    array['pickup', 'childcare'],
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Minh Khoa',
    '👨',
    'Yokohama',
    'Bé 2 tuổi, bé 6 tuổi',
    array['ride', 'borrow'],
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Hoa',
    '👩',
    'Kawasaki',
    'Bé 5 tuổi',
    array['childcare', 'pickup', 'borrow'],
    true
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Circle
-- ---------------------------------------------------------------------------

insert into circles (id, name, created_by, created_at)
values (
  '00000000-0000-0000-0000-000000000010',
  'Yokohama Circle',
  '00000000-0000-0000-0000-000000000001',
  now() - interval '30 days'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Circle members (all 3 users are active members)
-- Inserted by seed as if service role accepted invites.
-- ---------------------------------------------------------------------------

insert into circle_members (id, circle_id, user_id, joined_at, is_active)
values
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    now() - interval '30 days',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    now() - interval '25 days',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    now() - interval '20 days',
    true
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Aid requests — 5 mẫu, đủ 5 category, trạng thái khác nhau
-- ---------------------------------------------------------------------------

insert into aid_requests (
  id, circle_id, requester_id, category, description,
  scheduled_at, location, is_urgent, status, created_at
)
values
  -- 1. pickup — open, gấp
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'pickup',
    'Nhờ ai đón bé giúp mình ở trường Sakura Kindergarten lúc 15:30 hôm nay nhé',
    'Hôm nay 15:30',
    'Trường Sakura Kindergarten, Yokohama',
    true,
    'open',
    now() - interval '2 hours'
  ),
  -- 2. childcare — open, không gấp
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'childcare',
    'Mình cần trông bé khoảng 2-3 tiếng thứ 7 tuần tới, mình đi khám bệnh',
    'Thứ 7 tuần tới, buổi sáng',
    'Nhà mình ở Tsurumi',
    false,
    'open',
    now() - interval '1 day'
  ),
  -- 3. borrow — matched
  (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    'borrow',
    'Nhờ mượn nồi áp suất cỡ lớn, cuối tuần này nấu bún bò cho cả vòng',
    'Thứ 6 chiều đến Chủ nhật',
    null,
    false,
    'matched',
    now() - interval '3 days'
  ),
  -- 4. ride — closed
  (
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'ride',
    'Nhờ cho đi nhờ xe đến siêu thị Gyomu Super, mình không có xe',
    'Chủ nhật tuần trước',
    'Gyomu Super gần ga Tsurumi',
    false,
    'closed',
    now() - interval '10 days'
  ),
  -- 5. other — open
  (
    '00000000-0000-0000-0000-000000000034',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'other',
    'Nhờ ai biết tiếng Nhật review giúp hợp đồng thuê nhà mới, khoảng 5-6 trang',
    'Trong tuần này',
    null,
    false,
    'open',
    now() - interval '5 hours'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- user_discovery_settings — seed defaults (all opt-out by default per D-020)
-- ---------------------------------------------------------------------------

insert into user_discovery_settings (user_id, is_visible, radius_km)
values
  ('00000000-0000-0000-0000-000000000001', false, 5),
  ('00000000-0000-0000-0000-000000000002', false, 5),
  ('00000000-0000-0000-0000-000000000003', false, 5)
on conflict (user_id) do nothing;

-- =============================================================================
-- ROLLBACK SQL
-- =============================================================================
-- delete from user_discovery_settings where user_id like '00000000-0000-0000-0000-0000000000%';
-- delete from aid_requests            where id          like '00000000-0000-0000-0000-00000000003%';
-- delete from circle_members          where id          like '00000000-0000-0000-0000-00000000002%';
-- delete from circles                 where id = '00000000-0000-0000-0000-000000000010';
-- delete from profiles                where id          like '00000000-0000-0000-0000-00000000000%';
-- =============================================================================
