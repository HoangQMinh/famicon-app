---
adr: ADR-005
title: Data Model — Core Schema Design
status: ACCEPTED
date: 2026-05-16
decision_ref: D-004 (no ledger), D-023 (discovery table Sprint 3), D-028 (active member definition), D-030 (soft delete)
---

# ADR-005 — Data Model

## Context

Cần schema đơn giản, không có ledger/counter (D-004), hỗ trợ soft delete (D-030), và có slot cho Discovery (D-023).

## Decision

### Core Tables

```sql
-- Circles (vòng)
circles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now()
)

-- Profiles (user info)
profiles (
  id            uuid primary key references auth.users(id),
  display_name  text not null,
  avatar_emoji  text default '👨‍👩‍👧',
  location      text,         -- khu vực (tự nhập, không có lat/lng trong MVP)
  kids_desc     text,         -- free text: "Bé 3 tuổi, bé 6 tuổi"
  help_tags     text[],       -- ["pickup", "childcare", "ride", "borrow"]
  line_user_id  text,         -- optional, cho LINE notification fallback
  is_active     boolean default true,    -- D-030: soft delete
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)

-- Circle members
circle_members (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid references circles(id) on delete cascade,
  user_id       uuid references profiles(id),
  joined_at     timestamptz default now(),
  is_active     boolean default true,    -- D-028, D-030
  unique (circle_id, user_id)
)

-- Invitations
circle_invites (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid references circles(id),
  invited_by    uuid references profiles(id),
  email         text not null,
  token         text unique not null,    -- URL token
  status        text default 'pending', -- pending | accepted | expired
  expires_at    timestamptz not null,   -- D-024: now() + interval '7 days'
  created_at    timestamptz default now()
)

-- Aid requests
aid_requests (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid references circles(id),
  requester_id  uuid references profiles(id),
  category      text not null,  -- 'pickup'|'borrow'|'childcare'|'ride'|'other'
  description   text not null,
  scheduled_at  text,           -- free text: "Hôm nay lúc 15:30"
  location      text,
  is_urgent     boolean default false,
  status        text default 'open',  -- open | matched | closed | cancelled
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)

-- Help offers (khi member bấm "Tôi giúp được")
help_offers (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid references aid_requests(id),
  helper_id     uuid references profiles(id),
  status        text default 'pending',  -- pending | accepted | declined
  created_at    timestamptz default now()
)

-- Push subscriptions (Web Push)
push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id),
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  created_at    timestamptz default now()
)

-- Discovery settings (D-023: tạo Sprint 3)
user_discovery_settings (
  user_id       uuid primary key references profiles(id),
  is_visible    boolean default false,
  radius_km     int default 5,  -- 3, 5, 10 (D-031)
  updated_at    timestamptz default now()
)
```

### Không có (Constitution)

❌ `help_count` — ledger forbidden (D-004)
❌ `karma_score` — leaderboard forbidden (D-004)
❌ `rating` trên help_offers — gamification forbidden
❌ Hard delete bất kỳ table nào (D-030)

## RLS Policies (tóm tắt)

Chi tiết đầy đủ trong `data-model.md`.

| Table | Read | Write |
|---|---|---|
| circles | Members của vòng | Creator only |
| profiles | Members cùng vòng | Chính mình |
| circle_members | Members cùng vòng | System (via Server Action) |
| aid_requests | Members cùng vòng | Requester (create/cancel) |
| help_offers | Requester + helper | Helper (create), requester (accept) |
| push_subscriptions | Chính mình | Chính mình |
| user_discovery_settings | Chính mình (read all visible khi Sprint 11) | Chính mình |

## Consequences

**Tốt:**
- Schema đơn giản, ít join
- Không có counter → không cần trigger phức tạp
- Soft delete đủ cho APPI compliance (D-030)
- Discovery table slot sẵn từ Sprint 3 (D-023)

**Rủi ro:**
- `scheduled_at` là free text — không query được theo thời gian. Chấp nhận cho MVP, upgrade Sprint 6+ nếu cần filter.
- `location` trong profiles và requests là free text — không geo query được. Chấp nhận cho MVP (discovery dùng lat/lng riêng Sprint 11).
