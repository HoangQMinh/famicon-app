---
title: Data Model — Vòng Tròn Tương Trợ
phase: Phase 4
last_updated: 2026-05-17
decision_refs: ADR-005, D-004, D-011, D-023, D-028, D-029, D-030, D-034
---

# Data Model

> Schema đầy đủ với RLS policies. Tham chiếu ngắn gọn trong ADR-005.

---

## ERD (text format)

```
auth.users (Supabase managed)
    │
    └──< profiles (1:1)
            │
            ├──< circle_members >──< circles
            │         │
            │         └── joined_at, is_active
            │
            ├──< circle_invites (invited_by)
            │
            ├──< aid_requests (requester_id)
            │         │
            │         └──< help_offers (helper_id)
            │
            ├──< push_subscriptions
            │
            ├──< notification_logs (Sprint 5)
            │         └── request_id → aid_requests (nullable)
            │
            └── user_discovery_settings (1:1, Sprint 3)
```

---

## Tables

### `profiles`

```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) >= 2),
  avatar_emoji  text not null default '👨‍👩‍👧',
  avatar_url    text,                      -- Supabase Storage URL (optional)
  location      text,                      -- free text: "Yokohama"
  kids_desc     text,                      -- "Bé 3 tuổi, bé 6 tuổi"
  help_tags     text[] default '{}',       -- ['pickup', 'childcare', ...]
  line_user_id  text,                      -- LINE fallback notification
  is_active     boolean not null default true,  -- D-030: soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
```

### `circles`

```sql
create table circles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) >= 2),
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);
```

### `circle_members`

```sql
create table circle_members (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references circles(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  joined_at  timestamptz not null default now(),
  is_active  boolean not null default true,  -- D-028: active = not deleted
  unique (circle_id, user_id)
);

create index idx_circle_members_circle on circle_members(circle_id) where is_active = true;
create index idx_circle_members_user on circle_members(user_id) where is_active = true;
```

### `circle_invites`

```sql
create table circle_invites (
  id          uuid primary key default gen_random_uuid(),
  circle_id   uuid not null references circles(id),
  invited_by  uuid not null references profiles(id),
  email       text not null,
  token       text not null unique,          -- URL token (random 32 chars)
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'expired')),
  expires_at  timestamptz not null,          -- D-024: created_at + 7 days
  created_at  timestamptz not null default now()
);

create index idx_invites_token on circle_invites(token) where status = 'pending';
create index idx_invites_email on circle_invites(email) where status = 'pending';
```

### `aid_requests`

```sql
create table aid_requests (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references circles(id),
  requester_id  uuid not null references profiles(id),
  category      text not null
                check (category in ('pickup', 'borrow', 'childcare', 'ride', 'other')),
  description   text not null check (char_length(description) >= 5),
  scheduled_at  text,                    -- free text: "Hôm nay lúc 15:30"
  location      text,
  is_urgent     boolean not null default false,
  status        text not null default 'open'
                check (status in ('open', 'matched', 'closed', 'cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_requests_circle on aid_requests(circle_id, status, created_at desc);
create index idx_requests_requester on aid_requests(requester_id);

create trigger aid_requests_updated_at
  before update on aid_requests
  for each row execute function update_updated_at();
```

### `help_offers`

```sql
create table help_offers (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references aid_requests(id),
  helper_id   uuid not null references profiles(id),
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  unique (request_id, helper_id)
);
```

### `push_subscriptions`

```sql
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth_key    text not null,              -- 'auth' is reserved word
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);
```

### `notification_logs` (Sprint 5 — F5.7)

```sql
create table notification_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  type        text        not null
              check (type in ('new_request', 'urgent_request', 'helper_confirmed', 'invite_reminder', 'new_member')),
  channel     text        not null check (channel in ('web_push', 'line')),
  status      text        not null
              check (status in ('sent', 'failed', 'skipped_rate_limit', 'skipped_quiet_hours')),
  request_id  uuid        references aid_requests(id) on delete set null,  -- nullable: invite_reminder has no request
  created_at  timestamptz not null default now()
);

create index idx_notification_logs_user_date
  on notification_logs(user_id, created_at desc);
```

### `user_discovery_settings` (D-023 — tạo Sprint 3)

```sql
create table user_discovery_settings (
  user_id     uuid primary key references profiles(id) on delete cascade,
  is_visible  boolean not null default false,  -- opt-in, default OFF (D-020)
  radius_km   int not null default 5
              check (radius_km in (3, 5, 10)),  -- D-031
  updated_at  timestamptz not null default now()
);
```

---

## RLS Policies

### Enable RLS trên tất cả tables

```sql
alter table profiles enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table circle_invites enable row level security;
alter table aid_requests enable row level security;
alter table help_offers enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_logs enable row level security;
alter table user_discovery_settings enable row level security;
```

### Helper function

```sql
-- Kiểm tra user có trong vòng không
create or replace function is_circle_member(p_circle_id uuid, p_user_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from circle_members
    where circle_id = p_circle_id
      and user_id = p_user_id
      and is_active = true
  );
$$;
```

### `profiles` RLS

```sql
-- User đọc profile của mình
create policy "profiles_select_self" on profiles
  for select using (auth.uid() = id);

-- User đọc profile của members cùng vòng
create policy "profiles_select_circle_member" on profiles
  for select using (
    exists (
      select 1 from circle_members cm1
      join circle_members cm2 on cm1.circle_id = cm2.circle_id
      where cm1.user_id = auth.uid()
        and cm2.user_id = profiles.id
        and cm1.is_active = true
        and cm2.is_active = true
    )
  );

-- User chỉ update profile của mình
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
```

### `circles` RLS

```sql
create policy "circles_select_member" on circles
  for select using (is_circle_member(id, auth.uid()));

create policy "circles_insert_authenticated" on circles
  for insert with check (auth.uid() = created_by);
```

### `circle_members` RLS

```sql
create policy "members_select_same_circle" on circle_members
  for select using (
    is_circle_member(circle_id, auth.uid())
  );

-- Insert/update chỉ qua Server Action (service role)
-- Không có user-level insert policy
```

### `circle_invites` RLS

```sql
create policy "invites_select_inviter" on circle_invites
  for select using (invited_by = auth.uid());

create policy "invites_insert_member" on circle_invites
  for insert with check (
    is_circle_member(circle_id, auth.uid())
    and invited_by = auth.uid()
  );
```

### `aid_requests` RLS

```sql
create policy "requests_select_circle_member" on aid_requests
  for select using (is_circle_member(circle_id, auth.uid()));

create policy "requests_insert_member" on aid_requests
  for insert with check (
    is_circle_member(circle_id, auth.uid())
    and requester_id = auth.uid()
  );

create policy "requests_update_requester" on aid_requests
  for update using (requester_id = auth.uid())
  with check (requester_id = auth.uid());
```

### `help_offers` RLS

```sql
-- Requester xem offers cho request của mình
-- Helper xem offer của mình
create policy "offers_select" on help_offers
  for select using (
    helper_id = auth.uid()
    or exists (
      select 1 from aid_requests ar
      where ar.id = help_offers.request_id
        and ar.requester_id = auth.uid()
    )
  );

create policy "offers_insert_member" on help_offers
  for insert with check (
    helper_id = auth.uid()
    and exists (
      select 1 from aid_requests ar
      join circle_members cm on ar.circle_id = cm.circle_id
      where ar.id = help_offers.request_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
        and ar.status = 'open'
    )
  );
```

### `push_subscriptions` RLS

```sql
create policy "push_self" on push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### `notification_logs` RLS

```sql
-- User đọc logs của mình
create policy "notification_logs_select_self" on notification_logs
  for select using (user_id = auth.uid());

-- INSERT: không có user-level policy — chỉ Edge Function (service role) được insert
-- UPDATE/DELETE: không có user-level policy — logs là immutable audit records
```

### `user_discovery_settings` RLS

```sql
-- Phase 3: chỉ đọc/sửa của chính mình
create policy "discovery_settings_self" on user_discovery_settings
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sprint 11: thêm policy cho phép đọc visible users trong radius
-- (sẽ viết khi build Discovery feature)
```

---

## Không có (Constitution)

```sql
-- KHÔNG TẠO CÁC CỘT NÀY:
-- help_count INT  ← ledger forbidden (D-004)
-- karma_score INT ← leaderboard forbidden (D-004)
-- is_top_helper BOOL ← gamification forbidden
-- rating DECIMAL ← public rating forbidden
```

---

## Migration order

```
Sprint 0: profiles, circles, circle_members, circle_invites
Sprint 0: aid_requests, help_offers
Sprint 0: push_subscriptions
Sprint 3: user_discovery_settings  ← D-023
Sprint 5: notification_logs  ← F5.7
Sprint 11: ALTER profiles ADD location_lat, location_lng  ← Discovery
```

---

## Seed data (development)

Seed script tại `supabase/seed.sql` — 1 vòng "Yokohama Circle", 3 profiles, 5 aid requests mẫu.
