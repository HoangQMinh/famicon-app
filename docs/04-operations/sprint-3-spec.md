---
sprint: 3
theme: Circle Home + Feed
status: PLANNED
date_planned: 2026-05-17
decision_refs: ADR-006 (Realtime), ADR-008 (State management), D-022 (Discovery slot ẩn), D-023 (user_discovery_settings), D-028 (active member), D-030 (soft delete)
---

# Sprint 3 — Circle Home + Feed

---

## Goal

User đăng nhập thành công (Sprint 1-2 done) và thấy ngay màn hình Circle Home với danh sách open requests của vòng mình đang tham gia. Khi có request mới được đăng bởi thành viên khác, feed tự cập nhật mà không cần refresh tay.

---

## Dependencies

| Dependency | Status | Ghi chú |
|---|---|---|
| Sprint 2 — Onboarding + Invite | DONE (2026-05-17) | Profile đã có, invite + join flow hoạt động |
| Migration 000001-000005 | Applied | Các tables: profiles, circles, circle_members, circle_invites, aid_requests, help_offers, push_subscriptions |
| `user_discovery_settings` migration | Cần tạo sprint này | D-023: tạo ngay Sprint 3, không đợi Sprint 11 |
| ADR-006 Realtime | ACCEPTED (2026-05-16) | Supabase Realtime Postgres Changes |
| `src/lib/supabase/client.ts` | Có sẵn | Browser Supabase client cho Realtime subscription |
| `src/lib/supabase/server.ts` | Có sẵn | Server Supabase client cho fetch initial data |
| Design spec | Done | `docs/02-design/screen-specs/home-screen.md` |
| Design system CSS | Done | custom CSS tokens trong `src/app/globals.css` |

**OQs check trước khi bắt đầu:**

- OQ-010 (aid request expiry) — RESOLVED D-032: không block Sprint 3 nhưng biết để tránh design sai
- OQ-017 (backup helper) — RESOLVED D-033: không liên quan Sprint 3
- OQ-007 (match algorithm) — OPEN, deadline Sprint 6: không block Sprint 3
- OQ-012 (inactivity notification) — OPEN, deadline Sprint 6: không block Sprint 3

Không có OQ nào deadline = Sprint 3 còn OPEN. Sprint 3 có thể bắt đầu.

---

## Out of Scope

Các item này KHÔNG làm trong Sprint 3, dù liên quan đến màn hình này:

- `POST /requests/new` — form tạo request (Sprint 4)
- Push notification khi có request mới (Sprint 5)
- Hiển thị badge notification trên bell icon (Sprint 5)
- Help offer flow từ RequestCard (Sprint 6 — "Tôi giúp được" button navigate to `/requests/[id]` nhưng detail screen chưa có)
- Avatar upload (Sprint 7)
- Pull-to-refresh haptic feedback
- Skeleton loading shimmer animation (Sprint 8 polish)
- Infinite scroll / load-more phân trang (quyết khi build Sprint 4+)
- `/notifications` page (Sprint 5)
- Bật Discovery tab (Sprint 11)
- Tạo vòng mới (`/circles/new`) — chưa trong MVP path

---

## Subagents & Task Breakdown

### @schema — Migration `user_discovery_settings`

**Đọc trước:** `docs/03-technical/data-model.md` (mục `user_discovery_settings`), `supabase/migrations/`

**Tasks:**
1. Tạo migration `supabase/migrations/20260517000006_sprint3_discovery_settings.sql`
   - Tạo table `user_discovery_settings` đúng schema từ data-model.md (D-023)
   - Enable RLS
   - Policy: user chỉ đọc/update settings của chính mình
   - Trigger: `updated_at` auto-update
2. Verify migration không conflict với migrations 000001-000005 đã có
3. Không tạo policy nào cho discovery visibility (chưa cần — Sprint 11)

**Acceptance:** Migration file tạo được, syntax đúng, RLS enable + policies đủ cho self-read/write.

---

### @backend — Server Actions + Data Fetching

**Đọc trước:** `docs/03-technical/api-contract.md`, `docs/03-technical/data-model.md` (aid_requests RLS), `docs/03-technical/coding-conventions.md`

**Tasks:**
1. Tạo `src/lib/schemas/requests.ts` — Zod schema cho aid_request (read/display — chưa cần create schema, để Sprint 4)
2. Tạo `src/app/actions/requests.ts`:
   - `getCircleRequests(circleId: string)` — fetch open requests của circle theo user hiện tại
     - Chỉ lấy `status = 'open'`
     - Sort: `is_urgent DESC, created_at DESC`
     - Join với `profiles` để lấy `display_name` của requester
     - Return type: `ActionResult<AidRequestWithProfile[]>`
     - Dùng server Supabase client (RLS apply tự động)
   - `getCircleInfo(circleId: string)` — lấy circle name + active member count
     - Return: `{ name: string; member_count: number }`
3. Đảm bảo auth guard pattern nhất quán với auth.ts, invites.ts đã có

**Acceptance:** `getCircleRequests` trả đúng data, RLS apply (user ngoài vòng không đọc được), type-safe.

---

### @frontend — Circle Home Page + Components

**Đọc trước:** `docs/02-design/screen-specs/home-screen.md`, `docs/02-design/information-architecture.md`, `docs/02-design/design-system.md`, `docs/02-design/microcopy.md`

**Tasks:**
1. Tạo `src/app/(app)/home/page.tsx` — Server Component
   - Fetch session → lấy user circle membership
   - Gọi `getCircleRequests` + `getCircleInfo`
   - Pass data xuống Client Component
   - Redirect về `/onboarding` nếu profile chưa complete
2. Tạo `src/app/(app)/home/circle-home-client.tsx` — Client Component
   - Nhận initial requests từ Server Component
   - Khởi tạo Supabase Realtime subscription (ADR-006)
   - Subscribe event `INSERT` trên `aid_requests` filter `circle_id=eq.{circleId}`
   - Khi có event mới: prepend vào state (React `useState`)
   - Cleanup subscription khi unmount
   - Reconnect khi `visibilitychange` (document.hidden = false)
3. Tạo `src/components/features/request-card.tsx` — Component `RequestCard`
   - Props: `RequestCard({ req, onOpen, onHelp, onDecline })`
   - Layout đúng theo home-screen.md: UrgentPill, IconTile, title, desc truncate 80 chars, meta (clock/pin/asker), 2 buttons
   - "Tôi giúp được" → navigate `/requests/${req.id}` (detail screen Sprint 6)
   - "Không lần này" → gọi `onDecline` — KHÔNG notify asker (Nguyên tắc 3), KHÔNG persist state
   - KHÔNG hiện số lần giúp hay bất kỳ counter nào (Nguyên tắc 2 — không ledger)
4. Tạo `src/components/layout/top-header.tsx` — Component `TopHeader`
   - Props: `TopHeader({ title, sub, right })`
   - Layout: title trái, sub dưới title, right icon trái phải
   - Bell icon right → navigate `/notifications` (page chưa có — sprint này chỉ navigate, không cần error)
5. Tạo `src/components/layout/bottom-nav.tsx` — Component `BottomNav`
   - 3 tabs hiển thị: "Vòng của tôi" (IconHome), "Nhờ giúp" (IconPlusCircle), "Hồ sơ" (IconUser)
   - Discovery slot: render nhưng `disabled` + `aria-hidden` (D-022) — KHÔNG visible cho user, KHÔNG bật "Sắp có" tooltip
   - "Nhờ giúp" tab → navigate `/requests/new` (page Sprint 4 chưa có — OK)
   - "Hồ sơ" tab → navigate `/profile` (page Sprint 7 chưa có — OK)
   - Active tab highlight dựa theo `usePathname()`
6. Tạo `src/components/ui/fab.tsx` — FAB button
   - Coral `#FF8966`, circle, shadow
   - `aria-label="Nhờ giúp"`
   - Tap → navigate `/requests/new`
7. Empty state: khi requests rỗng — text invitation-style từ microcopy.md, FAB vẫn hiện
8. Error state: friendly error + "Thử lại" button
9. Update `src/app/(app)/layout.tsx` — thêm BottomNav vào app shell layout
10. Update `src/middleware.ts` — confirm `/home` protected (đã có từ Sprint 1, verify)

**Acceptance:** Circle Home render đúng, Realtime subscription hoạt động, BottomNav 3 tabs, Discovery slot ẩn, không có ledger/counter.

---

### @tester — Tests

**Đọc trước:** `docs/03-technical/test-strategy.md`, `docs/04-operations/sprint-3-test-plan.md`, `src/__tests__/` (xem pattern đang dùng)

**Tasks:**
1. Unit tests — `src/__tests__/schemas/` (nếu có schema requests.ts mới)
2. Integration tests — `src/__tests__/actions/requests.test.ts`:
   - `getCircleRequests`: trả đúng requests cho member, trả rỗng cho non-member (RLS boundary)
   - `getCircleInfo`: trả đúng name + member_count
   - Verify: requests của circle A không leak sang user thuộc circle B
3. Component test (nếu setup cho React components): `RequestCard` render không có counter/badge
4. Manual E2E checklist (Playwright chưa setup đầy đủ — Sprint 9):
   - Flow: đăng nhập → thấy Circle Home → requests hiện đúng
   - Flow: user B đăng request mới → user A thấy card xuất hiện trên feed không cần refresh

**Acceptance:** RLS boundary tests pass, unit tests pass, CI xanh.

---

## File Paths Expected

### Files sẽ được tạo

```
supabase/migrations/20260517000006_sprint3_discovery_settings.sql

src/lib/schemas/requests.ts
src/app/actions/requests.ts

src/app/(app)/home/page.tsx
src/app/(app)/home/circle-home-client.tsx

src/components/features/request-card.tsx
src/components/layout/top-header.tsx
src/components/layout/bottom-nav.tsx
src/components/ui/fab.tsx

src/__tests__/actions/requests.test.ts
```

### Files sẽ được cập nhật

```
src/app/(app)/layout.tsx          -- thêm BottomNav
src/app/globals.css               -- styles: request-card, top-header, bottom-nav, fab
src/middleware.ts                  -- verify /home protected (nếu cần update)
src/lib/types.ts                   -- thêm AidRequestWithProfile type
```

---

## Acceptance Criteria

Mỗi criterion phải testable và rõ ràng:

- [ ] **AC-3-01** — User đăng nhập thành công → navigate tới `/home` → thấy Circle Home với tên vòng + số gia đình trong TopHeader
- [ ] **AC-3-02** — Feed hiển thị đúng danh sách `status = 'open'` requests của vòng user đang ở, sorted: urgent trước, sau đó newest first
- [ ] **AC-3-03** — RequestCard hiển thị đủ: UrgentPill (nếu urgent), emoji category, title, description (truncate 80 chars), scheduled_at, location, tên requester
- [ ] **AC-3-04** — RequestCard KHÔNG có bất kỳ counter, số lần giúp, badge contribution nào
- [ ] **AC-3-05** — Realtime: User B đăng request mới → User A đang mở `/home` thấy card mới xuất hiện ở đầu feed trong vòng 3 giây, không cần refresh
- [ ] **AC-3-06** — Empty state: vòng chưa có request → hiện text invitation-style, FAB vẫn visible
- [ ] **AC-3-07** — FAB coral tap → navigate `/requests/new` (Sprint 4 chưa có — OK nếu 404 trong sprint này)
- [ ] **AC-3-08** — BottomNav hiển thị 3 tabs: "Vòng của tôi", "Nhờ giúp", "Hồ sơ". Discovery slot NOT visible (không thấy được, không có tooltip "Sắp có")
- [ ] **AC-3-09** — "Không lần này" tap → KHÔNG gửi bất kỳ thông báo nào đến requester, KHÔNG persist state vào DB
- [ ] **AC-3-10** — RLS: User không trong vòng không đọc được requests của vòng đó (integration test pass)
- [ ] **AC-3-11** — `user_discovery_settings` migration apply thành công, RLS enable, user chỉ đọc/update settings của mình
- [ ] **AC-3-12** — `npm run build` pass, CI xanh (lint + typecheck + vitest)
- [ ] **AC-3-13** — Render đúng trên mobile Chrome + mobile Safari (manual check)

---

## Forbidden Patterns — Chú ý đặc biệt Sprint 3

Sprint 3 build UI đầu tiên của app — các forbidden patterns đặc biệt nguy hiểm ở đây:

| Pattern bị cấm | Áp dụng cụ thể trong Sprint 3 |
|---|---|
| **Ledger / counter UI** | `RequestCard` KHÔNG có "đã giúp X lần", không có contribution badge, không có "helped N times" label |
| **Leaderboard / ranking** | Feed sort chỉ theo urgency + time — không sort theo "helper reputation" |
| **Public profile ngoài vòng** | TopHeader hiện tên vòng, không hiện public profile của bất kỳ ai với người ngoài vòng |
| **In-app chat** | Không có chat UI trong RequestCard hay bất kỳ đâu trong sprint này |
| **Dark patterns** | "Không lần này" phải là lựa chọn dễ thấy, không bị giấu, không nhỏ hơn "Tôi giúp được" quá nhiều |
| **Discovery leak** | BottomNav Discovery slot phải `disabled` + `aria-hidden` — không render visible content nào |

---

## Risks & Mitigations

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| Realtime subscription không cleanup đúng → memory leak trên mobile | Cao | Viết cleanup rõ ràng trong useEffect return, test bằng cách navigate in/out nhiều lần |
| WebSocket bị kill khi app background trên iOS | Cao | Implement `visibilitychange` listener để re-subscribe khi app focus lại (ADR-006 đã có pattern) |
| User chưa có circle membership → `/home` crash | Trung bình | Handle edge case: nếu `circle_members` rỗng → redirect về `/onboarding` hoặc hiện empty state "Bạn chưa trong vòng nào" |
| RLS misconfiguration → data leak giữa vòng | Cao | Integration test bắt buộc: user circle A không thấy requests của circle B |
| `user_discovery_settings` migration conflict | Thấp | Run migration trên local Supabase trước, verify không conflict với 000001-000005 |
| Discovery slot vô tình visible | Thấp | Review kỹ CSS + aria-hidden, Reviewer phải check BottomNav DOM |

---

## Deferred Items từ Sprint 2 (cần check)

- `getUserByEmail` bug ghi nhận trong Sprint 2: non-blocking, không ảnh hưởng Sprint 3
- `CircleInvite` interface: recommend split thành public/full type — Sprint 3+ có thể address khi dùng

---

## Test Plan Reference

`docs/04-operations/sprint-3-test-plan.md`

---

## Definition of Done

- [ ] Tất cả Acceptance Criteria (AC-3-01 đến AC-3-13) met
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅ (không chấp nhận CHANGES REQUESTED mà chưa fix)
- [ ] `npm run build` pass
- [ ] CI xanh (lint + typecheck + vitest)
- [ ] Deploy Vercel preview branch thành công
- [ ] Founder test thủ công trên mobile Chrome + Safari iOS: Circle Home load, card hiện, Realtime update nhìn thấy

---

*Tạo bởi Docs Steward Agent | 2026-05-17*
*Nguồn: `docs/03-technical/sprint-plan-phase4.md` Sprint 3 | `docs/02-design/screen-specs/home-screen.md` | `docs/02-design/information-architecture.md` | `docs/03-technical/adr/ADR-006-realtime.md` | `docs/03-technical/data-model.md` | `docs/00-foundation/open-questions.md`*