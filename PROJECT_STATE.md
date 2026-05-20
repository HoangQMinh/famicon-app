# PROJECT_STATE.md

**Last updated:** 2026-05-20
**Current phase:** Phase 4 — Build MVP
**Current sprint:** Sprint 11 (NEXT)
**Days into phase:** Sprint 10 DONE (conditional — pending manual 5-flow verify + CI green after push)

---

## Phase History

### Phase 0 — Foundation Setup (DONE — 2026-05-16)

**Goal:** Tạo toàn bộ Foundation Docs (Tầng 1), setup Claude Code subagents, và chuẩn bị nền tảng để Phase 1 có thể bắt đầu.

**Foundation Docs (Tầng 1) — Tất cả done:**
- [x] `docs/00-foundation/constitution.md` — Done (2026-05-16)
- [x] `docs/00-foundation/vision.md` — Done (2026-05-16)
- [x] `docs/00-foundation/glossary.md` — Done (2026-05-16)
- [x] `docs/00-foundation/non-goals.md` — Done (2026-05-16)
- [x] `docs/00-foundation/decision-log.md` — Done (2026-05-16), 23 quyết định
- [x] `docs/00-foundation/open-questions.md` — Done (2026-05-16), 16 OQs
- [x] `README.md` — Done (2026-05-16)
- [x] 7 Subagents config done

---

### Phase 1 — Pre-product Validation (DONE — 2026-05-16)

**Goal:** Validate 4 giả định cốt lõi trên LINE Open Chat với ~10 gia đình pilot — không code.

**Timeline thực tế:** 3 tuần validation (đủ sustained signal)

**Kết quả metrics:**

| Chỉ số | Target | Thực tế | Đạt |
|---|---|---|---|
| Aid requests/tuần | ≥15/tuần | 20 requests/tuần | ✓ |
| Match Rate | ≥70% | 75% | ✓ |
| Bypass Rate | <30% | 20% | ✓ |
| Sustained (số tuần liên tiếp) | ≥3 tuần | 3 tuần | ✓ |
| Discovery signal (Q1 "Muốn quen thêm") | tracking | 5/10 gia đình (50%) | ✓ Signal đủ mạnh |

**Giả định đã validate:**
- A1 — Coordination friction là pain đủ lớn: **Confirm**
- A5 — Văn hoá ân tình tương thích (không cần ledger): **Confirm**
- A6 — 5 loại aid request đủ bao quát: **Confirm**
- A15 — Gia đình Việt có muốn dùng Discovery: **Confirm** (50% signal)

**Product Docs (Tầng 2 — Phase 1):**
- [x] `docs/01-product/user-personas-v1.md` — Done (2026-05-16)
- [x] `docs/01-product/user-stories-v1.md` — Done (2026-05-16), 24 stories, MoSCoW
- [x] `docs/01-product/pilot-observations.md` — Done (2026-05-16), weekly log template
- [x] `docs/01-product/tracking-template.md` — Done (2026-05-16), Google Sheets guide 4 sheets

**Key learnings Phase 1:**
1. Concierge role là critical — không có concierge = lurkers không convert
2. Bypass pattern của Linh: ping người quen trước, rồi mới post nhóm — rational, không phải lỗi
3. Persona Mai cần "trigger bên ngoài" mới post lần đầu
4. Helper thường kèm điều kiện khi reply (70% cases) — cần design support pattern này
5. Culture ân tình vận hành tự nhiên — không ai hỏi "mình giúp mấy lần rồi"

---

### Phase 2 — Replication Test (DONE — 2026-05-16)

**Goal:** Validate pattern lặp lại ở 2-3 vòng độc lập — không code, dùng LINE Open Chat + pilot-playbook.md.

**Kết quả:**

| Chỉ số | Kết quả |
|---|---|
| Vòng pass metrics (≥3 tuần) | 2/3 vòng (Yokohama + Osaka) |
| Founder tự duy trì (không hand-hold) | Có — Yokohama từ tuần 2 |
| Discovery signal Q1 "Có" | ~53% (14 người được hỏi) |
| Willingness to install app | 79% |
| Go/No-go build app | **GO** |
| Go/No-go Discovery Sprint 11-12 | **GO** |

**Phase 2 Docs (Tầng 2):**
- [x] `docs/01-product/pilot-playbook.md` — Done
- [x] `docs/01-product/user-personas-v2.md` — Done
- [x] `docs/01-product/user-stories-v2.md` — Done
- [x] `docs/01-product/user-flows.md` — Done
- [x] `docs/01-product/use-cases.md` — Done
- [x] `docs/01-product/replication-report.md` — Done (2026-05-16)

---

## Phase Status — Phase 3 (DONE — 2026-05-16)

### Goal

Tạo đủ design + technical spec để Phase 4 build không bị block. ✅ **Hoàn thành.**

### Tasks — Phase 3

**Design Docs (Tầng 3) — DONE**

- [x] `docs/01-product/replication-report.md` — Done (2026-05-16)
- [x] `docs/02-design/information-architecture.md` — Done (2026-05-16)
- [x] `docs/02-design/design-system.md` — Done (2026-05-16)
- [x] `docs/02-design/microcopy.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/home-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/post-request-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/request-detail-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/profile-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/members-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/auth-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/invite-member-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/notification-screen.md` — Done (2026-05-16)
- [x] `docs/02-design/screen-specs/discovery-screens.md` — Done (draft, 2026-05-16)
- [ ] `docs/02-design/wireframes/` — Bỏ qua (React prototype thay thế, đủ cho Phase 4)

**Technical Docs (Tầng 4) — DONE**

- [x] `docs/03-technical/adr/ADR-001-stack.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-002-pwa.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-003-auth.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-004-notification.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-005-data-model.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-006-realtime.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-007-storage.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-008-state-management.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-009-form-handling.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-010-testing.md` — Done (2026-05-16)
- [x] `docs/03-technical/adr/ADR-011-discovery-privacy.md` — Done (2026-05-16)
- [x] `docs/03-technical/data-model.md` — Done (2026-05-16)
- [x] `docs/03-technical/api-contract.md` — Done (2026-05-16)
- [x] `docs/03-technical/notification-strategy.md` — Done (2026-05-16)
- [x] `docs/03-technical/coding-conventions.md` — Done (2026-05-16)
- [x] `docs/03-technical/security-privacy.md` — Done (2026-05-16)
- [x] `docs/03-technical/test-strategy.md` — Done (2026-05-16)
- [x] `docs/03-technical/sprint-plan-phase4.md` — Done (2026-05-16)

**OQs Phase 3 — Tất cả resolved**

- [x] OQ-001 → D-025 (safety valve khi >2 members)
- [x] OQ-002 → D-026 (re-invite giữ data)
- [x] OQ-003 → D-027 (email OTP)
- [x] OQ-004 → D-027 (không LINE Login)
- [x] OQ-005 → D-028 (active = not deleted)
- [x] OQ-006 → D-024 (7-day expiry, remind day 5)
- [x] OQ-008 → D-029 (Supabase Storage)
- [x] OQ-009 → D-030 (soft delete only)
- [x] OQ-013 → D-031 (5km default, 3/5/10km options)

---

## Recent Decisions

Xem `docs/00-foundation/decision-log.md` — 38 quyết định D-001 đến D-038.

Phase 3 resolved: D-024 đến D-031 (invite expiry, safety valve, re-invite, auth, active member, storage, soft delete, discovery radius).

---

## Open Questions

9 OQs còn OPEN (Phase 3 đã resolve 9 OQs):

**Cần quyết trước Sprint 4:**
- OQ-010 — Aid request tự expire sau bao lâu?
- OQ-017 — Backup helper khi match cancel?

**Cần quyết trước Sprint 6:**
- OQ-007 — Match algorithm weight (urgency/location/preference)
- OQ-012 — Push notification khi vòng không active 7 ngày?

**Cần quyết trước Sprint 11:**
- OQ-014 — Greeting format (message tùy chọn hay 1-click?)
- OQ-016 — User thấy được visible cho bao nhiêu người?

**Cần quyết trước Phase 4 cuối:**
- OQ-011 — Luật sư Nhật review privacy policy?

**Cần quyết trước Phase 5:**
- OQ-015 — Discovery moderation (block/report)

Chi tiết xem `docs/00-foundation/open-questions.md`.

---

## Metrics

**Phase 1 Results (confirmed):**

| Chỉ số | Target | Actual | Status |
|---|---|---|---|
| Aid requests/tuần | ≥15/tuần | 20 | ✓ |
| Match Rate | ≥70% | 75% | ✓ |
| Bypass Rate | <30% | 20% | ✓ |
| Sustained tuần | ≥3 | 3 | ✓ |
| Discovery signal Q1 | tracking | 50% (5/10) | Signal đủ |

**Phase 2 Results (confirmed):**

| Chỉ số | Target | Actual | Status |
|---|---|---|---|
| Vòng pass metrics | ≥2 vòng | 2/3 (Yokohama + Osaka) | ✓ |
| Founder tự duy trì | ≥1 vòng | Yokohama từ tuần 2 | ✓ |
| Discovery signal tổng | ≥40% | ~53% | ✓ |
| Willingness to install | tracking | 79% | Signal mạnh |

---

## Exit Criteria Phase 2 (DONE)

- [x] ≥2 vòng mới đã vận hành được ≥3 tuần liên tiếp
- [x] Ít nhất 1 vòng mới không cần hand-hold từ founder chính
- [x] Discovery signal được hỏi ≥8 thành viên (đã hỏi 14 người)
- [x] replication-report.md done
- [x] Quyết định build app: Go
- [x] Quyết định build Discovery Sprint 11-12: Go

## Exit Criteria Phase 3 — DONE ✅

- [x] Wireframes — bỏ qua (React prototype thay thế, founder approve)
- [x] Tầng 3 docs: IA, 8 screen specs, design system, microcopy — Done
- [x] Tầng 4 docs: 11 ADRs, data-model, api-contract, security-privacy, test-strategy, notification-strategy, coding-conventions — Done
- [x] OQ-001 đến OQ-009, OQ-013 đã resolved — Done
- [x] Navigation structure có discovery slot (D-022) — Done
- [x] Discovery screen specs (draft) — Done
- [x] Sprint plan 12 sprints Phase 4 — Done

---

## Phase 4 — Build MVP

### Sprint 0 — Foundation Setup (DONE — 2026-05-17)

- [x] Init Next.js 14 App Router + TypeScript strict
- [x] Supabase tables + RLS migrations (8 tables: profiles, circles, circle_members, circle_invites, aid_requests, help_offers, push_subscriptions, user_discovery_settings)
- [x] Supabase Storage bucket `avatars`
- [x] Kết nối Next.js ↔ Supabase (`src/lib/supabase/client.ts` + `server.ts`)
- [x] Deploy Vercel (main branch auto-deploy)
- [x] PWA manifest + Service Worker cơ bản
- [x] Design system CSS — color tokens, typography, spacing, shadow, motion
- [x] `docs/04-operations/deployment-runbook.md` — Bổ sung (bị bỏ sót từ Sprint 0)

**Exit criteria:** `npm run build` pass ✅ — Deploy Vercel success ✅

---

### Sprint 1 — Auth (DONE — 2026-05-17) ✅

**Goal:** User đăng nhập bằng Email OTP.

**Tasks:**
- [x] Auth pages: `/auth` (email input), `/auth/verify` (OTP input)
- [x] Server Action: `signInWithEmail`, `verifyOtp`, `signOut`
- [x] Middleware: protect routes, redirect to /auth nếu chưa login
- [x] Invite gating: check email trong `circle_invites` trước khi gửi OTP
- [x] Rate limiting: 3 OTP requests / email / 10 phút
- [x] Error states: email không trong invite, OTP sai, max attempts
- [x] Test suite: 58 tests — schemas, rate limiter, invite gating, middleware

**Files created:**
- `src/lib/types.ts` — ActionResult<T> type
- `src/lib/schemas/auth.ts` — Zod emailSchema, otpSchema
- `src/lib/logger.ts` — dev-only logger (no console.* in production)
- `src/lib/supabase/server-admin.ts` — service-role client (pre-auth checks only)
- `src/app/actions/auth.ts` — signInWithEmail, verifyOtp, signOut
- `src/middleware.ts` — route protection
- `src/app/(auth)/layout.tsx` — auth group layout
- `src/app/(auth)/auth/page.tsx` — email input page
- `src/app/(auth)/auth/verify/page.tsx` — OTP verify page (6-box, countdown, paste)
- `src/__tests__/schemas/auth.test.ts` — 23 tests
- `src/__tests__/actions/auth.test.ts` — 10 tests
- `src/__tests__/actions/auth-invite-gating.test.ts` — 8 tests
- `src/__tests__/middleware.test.ts` — 17 tests
- `vitest.config.ts` — Vitest setup

**Completion Reports:**
- [x] @backend — DONE
- [x] @frontend — DONE
- [x] @tester — DONE (58/58 pass)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-17 (sau 2 rounds: CHANGES REQUESTED → fix → APPROVED)

**Notes quan trọng:**
- Cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local` + Vercel env
- Rate limiter dùng in-memory Map (reset khi server restart — MVP acceptable)
- `getUserByEmail()` thay vì `listUsers()` để tránh pagination bug

**OQs cần quyết trước Sprint 4:**
- OQ-010 — Aid request expiry time
- OQ-017 — Backup helper flow

---

### Sprint 2 — Onboarding + Invite (DONE — 2026-05-17) ✅

**Goal:** User mới có thể tạo profile và vào vòng; thành viên có thể mời.

**Tasks:**
- [x] Onboarding screen: emoji picker, display_name, kids_desc, location
- [x] Server Action: `createProfile` (idempotent, activates pending invite, re-invite D-026)
- [x] Server Action: `updateProfile`
- [x] Invite screen: generate link, copy, share (Web Share API)
- [x] Server Action: `createInvite`, `acceptInvite`, `revokeInvite`, `getInvite`, `getInviteState`
- [x] Server Action: `createLinkInvite`, `revokeLinkInvites` (link-based invite, email nullable)
- [x] `/join/[token]` page: 3 states (valid/expired/invalid), logged-in auto-accept
- [x] Invite expiry: `expires_at = now() + 7 days` (D-024)
- [x] Re-invite: detect returning member, reactivate profile (D-026)
- [x] Edge Function: `expire-invites` stub (daily cron)
- [x] Migration: `circle_invites.email` nullable (migration 000005)
- [x] Zod schema: `profileCreateSchema`, `profileUpdateSchema`
- [x] Test suite: 96 tests total (Sprint 1 + Sprint 2) — all pass

**Files created:**
- `src/lib/schemas/profiles.ts` — profileCreateSchema, profileUpdateSchema
- `src/app/actions/profiles.ts` — createProfile (+ invite activation), updateProfile
- `src/app/actions/invites.ts` — createInvite, acceptInvite, revokeInvite, getInvite, getInviteState, createLinkInvite, revokeLinkInvites
- `src/app/(auth)/onboarding/page.tsx` — onboarding form (Client Component)
- `src/app/(auth)/join/[token]/page.tsx` — join via invite (Server Component, 3 states)
- `src/app/(app)/invite/page.tsx` — invite page wrapper (Server Component)
- `src/components/features/invite-screen-client.tsx` — invite screen interactive (Client Component)
- `supabase/functions/expire-invites/index.ts` — Edge Function stub
- `supabase/migrations/20260517000004_sprint2_invites_verify.sql` — assertion-only migration
- `supabase/migrations/20260517000005_make_invites_email_nullable.sql` — email nullable
- `src/__tests__/schemas/profiles.test.ts` — 16 tests
- `src/__tests__/actions/invites.test.ts` — 22 tests (fixed mock)

**Files updated:**
- `src/app/(auth)/auth/page.tsx` — forward invite_token param
- `src/app/(auth)/auth/verify/page.tsx` — acceptInvite post-OTP, returning member routing
- `src/middleware.ts` — /onboarding, /invite protected; /join public
- `src/app/globals.css` — emoji picker, onboarding, join page, invite screen styles

**Completion Reports:**
- [x] @schema — DONE
- [x] @backend — DONE (2 escalations resolved: email nullable, getUserByEmail bug noted)
- [x] @frontend — DONE
- [x] @tester — DONE (96/96 pass, mock fix by Master Agent)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-17 (sau 1 round: CHANGES REQUESTED → 2 fixes → APPROVED)

**Reviewer fixes applied:**
- Security: `getInvite()` không còn trả `email`/`invited_by` (PII) cho unauthenticated caller
- TypeScript: `email: null as any` → `email: null` (migration resolved)

**Notes quan trọng:**
- `getUserByEmail()` không tồn tại trong @supabase/auth-js v2.x — invite gating dùng circle_invites table làm proxy
- `createLinkInvite` dùng `email = null` — cần migration 000005 trước khi deploy production
- Logger silent trong production — track để Sprint 8 xem xét structured logging
- `CircleInvite` interface: recommend split thành public/full type trong Sprint 3+

**Sprint 2 deferred (tracked):**
- `getUserByEmail` bug trong Sprint 1 auth.ts — non-blocking cho Sprint 2, cần fix trước Sprint 3

---

### Sprint 3 — Circle Home + Feed (DONE — 2026-05-17) ✅

**Goal:** User thấy danh sách open requests trong vòng, realtime update.

**Tasks:**
- [x] Migration `user_discovery_settings` — assertion + trigger updated_at (000006)
- [x] `getCircleRequests(circleId)` — fetch open requests, sorted urgent first, RLS enforced
- [x] `getCircleInfo(circleId)` — circle name + active member count
- [x] Circle Home page — Server Component fetch + Client Component Realtime (ADR-006)
- [x] Supabase Realtime subscription — INSERT prepend, cleanup, visibilitychange reconnect
- [x] `RequestCard` — layout, UrgentPill, category emoji, desc truncate 80 chars, 2 buttons
- [x] `TopHeader`, `BottomNav` (3 tabs + Discovery slot ẩn D-022), `FAB`
- [x] Empty state + Error state
- [x] middleware.ts — `/home` protected, redirect target updated
- [x] Test suite: 54 new tests (32 schema + 22 action) — 149/150 pass (1 pre-existing)

**Files created:**
- `supabase/migrations/20260517000006_sprint3_discovery_settings.sql`
- `src/lib/schemas/requests.ts` — aidRequestCategorySchema, aidRequestStatusSchema, aidRequestDisplaySchema
- `src/app/actions/requests.ts` — getCircleRequests, getCircleInfo
- `src/app/(app)/home/page.tsx` — Server Component
- `src/app/(app)/home/circle-home-client.tsx` — Client Component + Realtime
- `src/app/(app)/home/loading.tsx` — skeleton loading
- `src/app/(app)/home/error.tsx` — error boundary
- `src/components/features/request-card.tsx`
- `src/components/layout/top-header.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/ui/fab.tsx`
- `src/app/(app)/layout.tsx` — app shell với BottomNav
- `src/__tests__/schemas/requests.test.ts` — 32 tests
- `src/__tests__/actions/requests.test.ts` — 22 tests

**Files updated:**
- `src/lib/types.ts` — thêm AidRequestWithProfile
- `src/middleware.ts` — /home protected, redirect → /home
- `src/app/globals.css` — styles Sprint 3 components

**Completion Reports:**
- [x] @schema — DONE
- [x] @backend — DONE
- [x] @frontend — DONE
- [x] @tester — DONE (149/150 pass)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-17 (sau 1 round CHANGES REQUESTED → 3 fixes → APPROVED)

**Reviewer fixes applied:**
- [HIGH] Enum 'ride' vs 'dropoff' — align Zod schema + RequestCard với DB CHECK constraint
- [MEDIUM] TC-3.2 docs — update test-plan phản ánh success=false contract
- [LOW] createClient() — memoize via useRef trong CircleHomeClient

**Notes quan trọng:**
- Realtime payload không include profile join → requester_name fallback = 'Thành viên' (full name chỉ có từ SSR)
- 1 pre-existing test failure: middleware.test.ts:154 — redirect /auth → /circle (cũ), cần fix trong Sprint cleanup
- Enum canonical: `'ride'` (không phải `'dropoff'`) — theo DB CHECK constraint
- `user_discovery_settings` đã tồn tại từ migration 000001; 000006 chỉ thêm trigger updated_at bị thiếu

---

### Sprint 4 — New Request (DONE — 2026-05-17) ✅

**Goal:** User có thể tạo aid request trong 30 giây.

**Tasks:**
- [x] `newRequestSchema` (Zod) — 6 fields, enum align với DB CHECK
- [x] `createRequest` Server Action — auth → validate → membership → insert
- [x] `/new-request` page — Server Component + Client Component form
- [x] Form 5 fields: CategoryTiles (pickup pre-selected), textarea+counter, scheduled_at, location, urgent buttons
- [x] `canSubmit` logic: category + description (≥5) + scheduled_at + location
- [x] FAB wired → `/new-request`
- [x] Success toast + redirect `/home`; Error toast + form preserved
- [x] Fix `middleware.test.ts:154` — redirect `/circle` → `/home`
- [x] Test suite: 56 new tests (42 schema + 14 action) — 200/200 pass (6 pre-existing)

**Files created:**
- `src/app/(app)/new-request/page.tsx`
- `src/app/(app)/new-request/loading.tsx`
- `src/app/(app)/new-request/error.tsx`
- `src/components/features/new-request-form.tsx`
- `src/__tests__/schemas/new-request.test.ts` — 42 tests
- `src/__tests__/actions/create-request.test.ts` — 17 tests (sau fix: 56 total)

**Files updated:**
- `src/lib/schemas/requests.ts` — thêm `newRequestSchema`
- `src/app/actions/requests.ts` — thêm `createRequest`
- `src/middleware.ts` — fix redirect target
- `src/__tests__/middleware.test.ts` — fix test assertion line 154
- `src/components/ui/fab.tsx` — wire `/new-request`
- `src/app/globals.css` — Sprint 4 styles

**Completion Reports:**
- [x] @backend — DONE
- [x] @frontend — DONE
- [x] @tester — DONE (200/206 pass — 6 pre-existing)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-17 (sau 1 round: CHANGES REQUESTED → 2 fixes → APPROVED)

**Reviewer fixes applied:**
- [HIGH] canSubmit test function: `> 0` → `>= 5`, thêm 3 boundary tests
- [MEDIUM] Toast microcopy: `'Đã gửi!...'` → `'Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay.'`
- [LOW] Metadata: `import type { Metadata } from 'next'` + typed export

**Notes quan trọng:**
- canSubmit: description cần ≥5 chars (không phải > 0) — test và production đã sync
- circle_id lấy server-side từ active membership — không trust client input
- 6 pre-existing failures (`auth-invite-gating.test.ts`) — không liên quan Sprint 4
- OQ-010 → D-032: request expire khi qua scheduled_at (không cần Edge Function ở Sprint 4)
- OQ-017 → D-033: re-notify khi cancel implement trong Sprint 6 (offer flow)

**OQs cần quyết trước Sprint 5:**
- ~~OQ-012 — Push notification khi vòng không active 7 ngày?~~ → RESOLVED D-034

---

### Sprint 5 — Notifications (DONE — 2026-05-18) ✅

**Goal:** Members nhận push notification khi có request mới.

**Tasks:**
- [x] VAPID key setup + `push_subscriptions` table verify
- [x] Service Worker: push handler (`tag` dedup), notificationclick
- [x] Permission request flow + iOS Add to Home Screen guide
- [x] `NotificationPermissionPrompt` component (dismissible, data-testids)
- [x] `IOSInstallGuide` component (iOS detection, localStorage dismiss)
- [x] `LINEConnectCard` component (iOS + no line_user_id condition)
- [x] Server Action: `savePushSubscription` (upsert on endpoint)
- [x] Server Action: `saveLINEUserId`
- [x] Edge Function: `notify-circle` (Web Push primary + LINE fallback, quiet hours, rate limit, DI pattern)
- [x] Edge Function: `remind-invite` (daily cron, D-024)
- [x] LINE Webhook: `POST /api/line/webhook` (HMAC-SHA256 verify, follow event)
- [x] Migration: `notification_logs` table + RLS (SELECT-self, no user INSERT)
- [x] Wire `notify-circle` vào `createRequest` (fire-and-forget)
- [x] Test suite: 98 new tests — tất cả pass (307 total, 6 pre-existing fail)
- [x] tsconfig.json: exclude `supabase/functions` (Deno không compile với Next.js tsconfig)
- [x] .eslintrc.json: override `no-unused-vars` off cho test files

**Files created:**
- `supabase/migrations/20260517000007_sprint5_notification_logs.sql`
- `src/app/actions/notifications.ts` — savePushSubscription, saveLINEUserId
- `supabase/functions/notify-circle/index.ts`
- `supabase/functions/remind-invite/index.ts`
- `src/app/api/line/webhook/route.ts`
- `src/lib/notifications/helpers.ts` — pure functions (isQuietHoursJST, isRateLimited, formatLineMessage)
- `src/components/features/notification-permission-prompt.tsx`
- `src/components/features/ios-install-guide.tsx`
- `src/components/features/line-connect-card.tsx`
- `src/__tests__/schemas/push-subscription.test.ts` — 13 tests
- `src/__tests__/actions/push-subscription.test.ts` — 12 tests
- `src/__tests__/actions/save-line-userid.test.ts` — 12 tests
- `src/__tests__/utils/notification-quiet-hours.test.ts` — 11 tests
- `src/__tests__/utils/line-message.test.ts` — 10 tests
- `src/__tests__/utils/notification-rate-limit.test.ts` — 8 tests
- `src/__tests__/rls/push-subscriptions.test.ts` — 6 tests
- `src/__tests__/rls/notification-logs.test.ts` — 6 tests
- `src/__tests__/functions/notify-circle.test.ts` — 19 tests

**Files updated:**
- `src/app/actions/requests.ts` — wire triggerNotifyCircle vào createRequest
- `public/sw.js` — extend với push + notificationclick handlers
- `src/app/(app)/home/page.tsx` — 3 notification opt-in components
- `tsconfig.json` — exclude supabase/functions
- `.eslintrc.json` — override test files lint rule

**Completion Reports:**
- [x] @schema — DONE
- [x] @backend — DONE
- [x] @frontend — DONE
- [x] @tester — DONE (98/98 Sprint 5 pass)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-18 (sau 1 round: CHANGES REQUESTED → 3 fixes → APPROVED)

**Reviewer fixes applied:**
- [HIGH] PII: `formatLineMessage` — bỏ `description` khỏi LINE message body (description là free-text, có thể chứa tên, địa chỉ, SĐT)
- [LOW] eslint-disable comment placement — inline thay vì dòng trên
- [LOW] `logger.error` → `console.log` cho idempotent LINE follow event

**Notes quan trọng:**
- LINE Official Account chưa setup → LINE fallback graceful: log + skip khi không có `LINE_CHANNEL_ACCESS_TOKEN`
- VAPID keys cần generate + lưu vào Vercel env trước khi test Web Push trên device thật: `npx web-push generate-vapid-keys`
- `notify-circle` dùng DI pattern (`pushFn`/`lineFn`) — testable mà không cần Deno
- Pure functions extract vào `src/lib/notifications/helpers.ts` — Edge Function import từ đây
- 6 pre-existing test failures (`auth-invite-gating.test.ts`) — Sprint 2 mock issue, không liên quan Sprint 5
- `description` trong LINE message đã bị loại bỏ (PII) — spec F5.5 LINE template cần update cho nhất quán

**OQs cần quyết trước Sprint 6:**
- OQ-007 — Match algorithm weight (urgency/location/preference)

---

### Sprint 6 — Open Registration + Discovery Onboarding (DONE — 2026-05-18) ✅

- Open registration flow: `/register` → OTP verify → profile onboarding
- 3-step discovery onboarding: enable discovery → find circles → create circle
- `circle_join_requests` table: any member can accept, broadcast notification
- Dual registration model: invite flow unchanged, open flow added in parallel (D-035)
- Any member can accept join request — peer-to-peer (D-036)
- Discovery location privacy: only `is_visible = true` members exposed (D-037)
- Notification types: `'join_request'` vs `'new_member'` distinct semantics (D-038)
- Reviewer: APPROVED ✅

**Files created:**
- `supabase/migrations/20260518000001_join_requests.sql` — `circle_join_requests` table + RLS
- `src/app/actions/auth.ts` — thêm `signUpWithEmail()` (open, no invite gate)
- `src/app/actions/profiles.ts` — `createProfile()` trả về `hasCircle: boolean`
- `src/app/actions/discovery.ts` — `updateDiscoverySettings()`
- `src/app/actions/circles.ts` — `createCircleWithFounder`, `requestToJoinCircle`, `acceptJoinRequest`, `getCirclesNearby`
- `src/middleware.ts` — routes `/register` + `/onboarding/discovery`
- `src/app/(auth)/register/page.tsx` — open registration email form
- `src/app/(auth)/register/verify/page.tsx` — OTP verify
- `src/app/(auth)/onboarding/page.tsx` — redirects to discovery nếu không có circle
- `src/app/(auth)/onboarding/discovery/page.tsx` — 3-step discovery onboarding

**OQ notes:**
- OQ-014 — Greeting format: silent broadcast model implemented (không có custom text, không có 1-click say hi); deadline Sprint 11 vẫn giữ cho full discovery feature

---

### Sprint 7 — Request Detail + Help Offer (DONE — 2026-05-18) ✅

**Goal:** User xem chi tiết aid request và bày tỏ ý muốn giúp → app ghi nhận offer vào DB, hand-off LINE.

**Tasks:**
- [x] Verify `help_offers` table + RLS policies — đã đúng trong Sprint 0 migrations
- [x] `getRequestDetail(requestId)` Server Action — RLS enforced, no line_user_id leak
- [x] `createOffer(requestId)` Server Action — auth → membership → status check → duplicate check → INSERT → LINE deeplink
- [x] `acceptOffer(offerId)` Server Action — chỉ requester, batch decline others, notify helper_confirmed
- [x] `cancelRequest` / `closeRequest` — re-notify vòng khi cancel (D-033)
- [x] Zod schemas: offerCreateSchema, offerAcceptSchema, requestDetailSchema
- [x] `/requests/[id]` page — Server Component + Client Component (state machine)
- [x] `InfoBlock` reusable UI component
- [x] `RequestDetailClient` — 4 states: open/matched/cancelled/closed, "Không lần này" local only
- [x] `loading.tsx` skeleton + `error.tsx` boundary
- [x] Test suite: 80 new tests (28 schema + 19 action offers + 24 action requests-detail + 9 RLS) — 80/80 pass
- [x] `HelpOffer` + `RequestDetail` TypeScript interfaces added to types.ts

**Files created:**
- `famicon/src/app/actions/offers.ts` — createOffer, acceptOffer
- `famicon/src/app/(app)/requests/[id]/page.tsx` — Server Component
- `famicon/src/app/(app)/requests/[id]/loading.tsx` — shimmer skeleton
- `famicon/src/app/(app)/requests/[id]/error.tsx` — error boundary
- `famicon/src/components/features/request-detail-client.tsx` — Client Component + state machine
- `famicon/src/components/ui/info-block.tsx` — reusable InfoBlock
- `famicon/src/__tests__/schemas/offers.test.ts` — 28 tests
- `famicon/src/__tests__/actions/offers.test.ts` — 19 tests
- `famicon/src/__tests__/actions/requests-detail.test.ts` — 24 tests
- `famicon/src/__tests__/rls/help-offers.test.ts` — 9 tests

**Files updated:**
- `famicon/src/app/actions/requests.ts` — getRequestDetail, cancelRequest, closeRequest added
- `famicon/src/lib/schemas/requests.ts` — 4 schemas mới
- `famicon/src/lib/types.ts` — HelpOffer, RequestDetail interfaces
- `famicon/src/app/globals.css` — Sprint 7 styles
- `docs/03-technical/api-contract.md` — updated với Sprint 7 contracts
- `docs/04-operations/sprint-7-spec.md` — created
- `docs/04-operations/sprint-7-test-plan.md` — created

**Completion Reports:**
- [x] @schema — DONE (no migration needed, schema verified correct)
- [x] @backend — DONE
- [x] @frontend — DONE
- [x] @tester — DONE (80/80 pass)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-18

**Notes quan trọng:**
- `line_user_id` của requester không bao giờ xuất hiện trong ActionResult — chỉ dùng server-side để build LINE deeplink
- LINE deeplink: `https://line.me/ti/p/~{lineId}?openExternalBrowser=1` khi có line_user_id, fallback `https://line.me/R/`
- "Không lần này" button: local state only, không gọi API, không persist — Constitution P3
- State 'matched': không hiện tên helper — Constitution P3
- Component tests skipped — React Testing Library chưa installed (plan cho Sprint 8/9)
- Side-finding: `join_request` notification type (Sprint 6 D-038) chưa có trong `notification_logs` CHECK constraint — cần migration fix, xem Sprint 8
- 6 pre-existing failures (`auth-invite-gating.test.ts`) — Sprint 2 mock issue, không liên quan Sprint 7
- Full suite: 379 pass / 6 fail (pre-existing)

---

### Sprint 8 — Profile + Members (DONE — 2026-05-20) ✅

**Goal:** User xem và chỉnh sửa hồ sơ; xem danh sách thành viên vòng.

**Tasks:**
- [x] Migration: fix `notification_logs` CHECK constraint (thêm `join_request`, `new_member`)
- [x] Verify profiles RLS policies (3 policies confirmed)
- [x] Verify Storage avatars RLS (INSERT own folder, SELECT public)
- [x] `uploadAvatar` Server Action — validate file type/size, upload to `{userId}/avatar.webp`, update profile
- [x] `getMyProfile` Server Action — return ProfileData, no PII leak
- [x] `getCircleMembers` Server Action — no `line_user_id`, order by `joined_at ASC`
- [x] Zod schemas: `avatarUploadSchema`, `membersQuerySchema`, `profileUpdateSchema` with help_tags
- [x] `ProfileData` + `MemberProfile` types (no counter, no badge, no line_user_id)
- [x] `/profile` page — Server Component, skeleton, error boundary
- [x] `ProfileClient` — avatar, name, location, kids_desc, help_tags chips
- [x] `EditProfileModal` — avatar upload preview, form, sequential upload→update
- [x] `HelpTagsPicker` — 5 chips multi-select
- [x] `/circles/[id]/members` page — Server Component, skeleton, error boundary
- [x] `MembersClient` — list với InviteCTA, empty state, no BottomNav
- [x] `MemberRow` — avatar, name, location, kids_desc, help_tags, chat icon disabled (OQ-007)
- [x] `InviteCTA` — dashed button → `/invite`
- [x] BottomNav tab "Hồ sơ" wired, middleware protects `/circles`
- [x] Test suite: 59 tests Sprint 8 / 453 total — all pass

**Completion Reports:**
- [x] @schema — APPROVED ✅
- [x] @backend — APPROVED ✅
- [x] @frontend — APPROVED ✅
- [x] @tester — APPROVED ✅

**Reviewer Notes (backlog Sprint 9 Polish):**
- `edit-profile-modal.tsx`: `newAvatarUrl` intent cần clarify (doc hoặc pass vào updateData)
- `edit-profile-modal.tsx`: URL.createObjectURL memory leak — revoke on change/close
- `edit-profile-modal.tsx`: reset `isSubmitting` trước setTimeout
- `_currentUserId` + `_circleId` props unused — xem xét remove
- Focus trap cho edit modal

**Notes quan trọng:**
- Chat icon trên MemberRow: disabled (OQ-007 OPEN — LINE handoff from members screen = Phase 5 scope)
- Storage SELECT là public — privacy enforced ở app layer qua `profiles_select_circle_member` RLS
- Policy name: `profiles_select_circle_member` (không phải `profiles_select_same_circle` như trong spec)
- `help_tags` là `text[]` ở DB — render bất kỳ string, chỉ strict enum khi write (Zod)

---

### Sprint 9 — Polish + PWA (DONE — 2026-05-20) ✅

**Goal:** App sẵn sàng pilot — PWA installable, offline fallback, security headers, a11y polish.

**Tasks:**
- [x] PWA manifest hoàn chỉnh (name, short_name, start_url, icons 192+512)
- [x] PWA icons: icon-192.png, icon-512.png, apple-touch-icon.png
- [x] offline.html — offline fallback page với Vietnamese message + retry button
- [x] Service Worker cache shell strategy (fc-shell-v1) — network-first API, cache-first shell, offline fallback
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, X-XSS-Protection, Permissions-Policy
- [x] iOS safe-area insets (`env(safe-area-inset-bottom)`) trong BottomNav, FAB, main content
- [x] Loading skeletons verify (home, profile, members, request detail — đã có)
- [x] Error boundaries verify (home, profile, members, request detail — đã có)
- [x] Empty states verify (home feed, members page — đã có)
- [x] Accessibility: FAB aria-label, :focus-visible ring styles, img→Image, aria-disabled→disabled
- [x] Next.js 14→15 upgrade (build clean)
- [x] Next.js Image optimization (member-row, profile-client)
- [x] npm audit: 0 high/critical (2 moderate PostCSS transitive — not actionable)
- [x] Vitest: 453 pass / 0 fail

**Completion Reports:**
- [x] @frontend — APPROVED ✅
- [x] @tester — DONE (automated: all pass; manual: pending device)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-20 (conditional on user device test)

**Reviewer suggestions (backlog Sprint 10+):**
- manifest.json: split `"purpose": "any maskable"` → separate entries (Safari compatibility)
- Move inline SW registration → `/register-sw.js` file (allows drop `unsafe-inline` from CSP)
- Verify `unsafe-eval` not needed in production build — CSP hardening opportunity

**Manual tests pending user (device):**
- [ ] TC-9.4 — Lighthouse Performance ≥80, Accessibility ≥90 (Chrome DevTools / PageSpeed Insights)
- [ ] TC-9.2 — SW offline simulation (Chrome DevTools Network > Offline)
- [ ] TC-9.6 — iOS Add to Home Screen + standalone launch (Safari iOS)
- [ ] TC-9.6.3 — Safe-area BottomNav not hidden by home indicator

**Notes:**
- Code committed: `0243ce5 feat: Sprint 8-9`, follow-up fixes `eca7bda`, `0be5048`, `3c1120b`, `fc1cbef`
- Next.js 15: 3 auth pages wrapped in Suspense (Next.js 15 requirement for useSearchParams)
- Security headers live-verified on https://famicon-app.vercel.app/ ✅

---

### Sprint 10 — E2E Testing + Bug Fix (DONE — 2026-05-20) ✅

**Goal:** Tất cả E2E tests pass local, CI pipeline xanh, 5 core flows verified.

**Tasks:**
- [x] global.setup.ts rewrite — password-based auth + @supabase/ssr cookie injection
- [x] No-auth suite: 12/12 pass (auth-page, pwa-assets, security-headers)
- [x] Authenticated suite: 31/31 pass (home, new-request, profile, members, accessibility, middleware)
- [x] B-003 fix — GRANT SELECT + write ops cho 10 tables (migration 20260520000002)
- [x] T-006 fix — vitest.config.ts exclude e2e/**
- [x] .github/workflows/ci.yml — jobs: unit + e2e-no-auth
- [x] /auth/callback route + middleware exemption
- [x] deployment-runbook.md — Section 9 E2E Test Setup
- [x] Vitest regression: 453/0

**Completion Reports:**
- [x] @tester — PARTIAL→DONE (B-003 escalated + resolved)
- [x] @architect — DONE
- [x] @backend — DONE (B-003 + T-006 fixes)

**Reviewer Verdict:**
- [x] APPROVED ✅ — 2026-05-20 (conditional on manual flows + CI after push)

**Pending (user action required):**
- [ ] TC-10.3 — 5 core flows manual verify trên desktop Chrome
- [ ] TC-10.4 — CI pipeline green sau khi push lên GitHub remote

**Key fixes:**
- B-003 CRITICAL: Missing `GRANT SELECT ON circle_members TO authenticated` — applied to Supabase via Management API
- global.setup.ts: magic link implicit flow → password-based auth (signInWithPassword + @supabase/ssr cookie)
- middleware.spec.ts: `browser.newContext()` trong authenticated project kế thừa storageState — fix bằng explicit `{ cookies: [], origins: [] }`

**Notes:**
- `stringToBase64URL` từ `@supabase/ssr` là internal API — nếu upgrade @supabase/ssr cần verify vẫn exported
- Dedicated E2E test account (không phải real user) là best practice — backlog Sprint 11
- Reviewer suggestions for Sprint 11 backlog: `/circles` middleware test, cache-dependency-path in CI

---

### Sprint 11 (NEXT)

---

_Maintain bởi Docs Steward Agent | Template từ `mvp-roadmap-v1.md` Mục 16_
_Audit Protocol: `docs/00-foundation/audit-protocol.md` | Task chỉ DONE khi Reviewer APPROVED ✅_
