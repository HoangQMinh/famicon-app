---
title: Sprint Plan — Phase 4 (Build MVP)
phase: Phase 3 (planning document)
last_updated: 2026-05-16
decision_refs: D-013 (sprint = 1 tuần), D-021 (Discovery Sprint 11-12), D-022 (Discovery slot từ đầu)
---

# Sprint Plan — Phase 4

> 12 sprints × 1 tuần = 12 tuần build MVP.
> Mỗi sprint: Plan → Subagents implement → Completion Report → Master Audit → Reviewer APPROVED → merge + mark done.
> D-013: sprint length 1 tuần.
> **Bắt buộc:** Không mark DONE nếu chưa có Reviewer APPROVED. Xem `docs/00-foundation/audit-protocol.md`.

---

## Timeline tổng quan

| Sprint | Tuần | Theme | Deliverable chính |
|---|---|---|---|
| Sprint 0 | Tuần 1 | Foundation Setup | Project init, DB migrations, CI/CD |
| Sprint 1 | Tuần 2 | Auth | Email OTP, session, invite gating |
| Sprint 2 | Tuần 3 | Onboarding + Invite | Profile create, invite link, join flow |
| Sprint 3 | Tuần 4 | Circle Home + Feed | Request list, realtime, BottomNav |
| Sprint 4 | Tuần 5 | New Request | Form, submit, category tiles |
| Sprint 5 | Tuần 6 | Notifications | Web Push, LINE fallback, SW |
| Sprint 6 | Tuần 7 | Request Detail + Offer | Detail screen, help offer, LINE handoff |
| Sprint 7 | Tuần 8 | Profile + Members | Profile edit, members list, avatar upload |
| Sprint 8 | Tuần 9 | Polish + PWA | PWA manifest, offline, A11y, performance |
| Sprint 9 | Tuần 10 | E2E Testing + Bug Fix | Playwright 5 flows, bug fixes |
| Sprint 10 | Tuần 11 | Pilot Launch | Soft launch ~10 gia đình, monitor |
| Sprint 11 | Tuần 12 | Discovery | Opt-in, radius filter, family list |
| Sprint 12 | Tuần 13 | Discovery Polish + Connect | Greeting flow, LINE handoff, settings |

> Discovery slot (Sprint 11-12) có thể cancel nếu core coordination chưa có traction (D-021).

---

## Sprint 0 — Foundation Setup

**Goal:** Repo, infra, CI/CD sẵn sàng để Sprint 1 bắt đầu code ngay.

**Tasks:**

- [ ] Init Next.js 14 App Router project + TypeScript strict
- [ ] Setup Supabase project (production + local dev)
- [ ] Run migrations: `profiles`, `circles`, `circle_members`, `circle_invites`, `aid_requests`, `help_offers`, `push_subscriptions`
- [ ] Setup Supabase Storage bucket `avatars`
- [ ] Setup Vercel deploy (main branch auto-deploy)
- [ ] GitHub Actions CI: lint + typecheck + `vitest run`
- [ ] PWA: `manifest.json`, icon 192 + 512, basic Service Worker
- [ ] Design system CSS: import `colors_and_type.css` + `components.css`
- [ ] Seed data cho local dev

**Exit criteria:**
- [ ] `npm run build` pass, deploy Vercel success, local Supabase start
- [ ] Completion Reports từ @schema, @backend, @frontend submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 1 — Auth

**Goal:** User có thể đăng nhập bằng Email OTP.

**Dependencies:** OQ-003, OQ-004 resolved (D-027 ✅)

**Tasks:**

- [ ] Auth pages: `/auth` (email input), `/auth/verify` (OTP input)
- [ ] Server Action: `signInWithEmail`, `verifyOtp`, `signOut`
- [ ] Middleware: protect routes, redirect to /auth nếu chưa login
- [ ] Invite gating: check email trong `circle_invites` trước khi gửi OTP
- [ ] Rate limiting: 3 OTP requests / email / 10 phút
- [ ] Error states: email không trong invite, OTP sai, max attempts
- [ ] Test: unit (schema), integration (auth boundary), E2E flow 1

**Exit criteria:**
- [ ] Auth E2E test pass trên mobile Chrome + Safari
- [ ] Completion Reports từ @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 2 — Onboarding + Invite

**Goal:** User mới có thể tạo profile và vào vòng; founder có thể mời.

**Dependencies:** Sprint 1 ✅

**Tasks:**

- [ ] Onboarding screen: avatar picker, name, kids_desc, location
- [ ] Server Action: `createProfile`
- [ ] Invite screen: generate link, copy, share (Web Share API)
- [ ] Server Action: `createInvite`, `acceptInvite`, `revokeInvite`
- [ ] `/join/[token]` page: validate token → auth → onboarding → circle
- [ ] Invite expiry: `expires_at = now() + 7 days` (D-024)
- [ ] Re-invite: detect returning member, reactivate profile (D-026)
- [ ] Edge Function: `expire-invites` (daily cron)
- [ ] Test: E2E flow 4 (invite)

**Exit criteria:**
- [ ] Full invite + join flow working end-to-end
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 3 — Circle Home + Feed

**Goal:** User thấy danh sách open requests trong vòng, realtime update.

**Dependencies:** Sprint 2 ✅

**Tasks:**

- [ ] Circle Home page: TopHeader (circle name + N gia đình), request list, FAB
- [ ] Server Component: fetch initial requests
- [ ] Client Component: Supabase Realtime subscribe (ADR-006)
- [ ] `RequestCard` component: layout từ design spec
- [ ] Empty state: khi vòng chưa có request
- [ ] BottomNav: 3 tabs (Vòng / Nhờ giúp / Hồ sơ) + Discovery slot ẩn (D-022)
- [ ] `user_discovery_settings` table migration (D-023) ← tạo ngay sprint này
- [ ] Test: integration (RLS requests), E2E flow sơ bộ

**Exit criteria:**
- [ ] Realtime update working — request mới hiện ngay trên feed mà không cần refresh
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 4 — New Request

**Goal:** User có thể tạo request trong 30 giây.

**Dependencies:** Sprint 3 ✅, OQ-010 (request expiry) nên quyết trước sprint này

**Tasks:**

- [ ] New Request page: `/new-request`
- [ ] Form 5 fields: category tiles, description, scheduled_at, location, urgent buttons
- [ ] Server Action: `createRequest`
- [ ] `canSubmit` logic: category + description + scheduled_at + location
- [ ] Success toast: "Đã gửi! Vòng của bạn sẽ thấy ngay thôi."
- [ ] Redirect về Circle Home sau submit
- [ ] FAB wiring từ Circle Home → `/new-request`
- [ ] Test: unit (schema), E2E flow 2 (new request)

**Exit criteria:**
- [ ] 30-second test: từ FAB đến request appear trên feed < 30 giây
- [ ] Completion Reports từ @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 5 — Notifications

**Goal:** Members nhận push notification khi có request mới.

**Dependencies:** Sprint 4 ✅, OQ-012 (inactivity notification) nên quyết trước

**Tasks:**

- [ ] VAPID key setup + `push_subscriptions` table
- [ ] Service Worker: push handler, notification click
- [ ] Onboarding iOS: hướng dẫn Add to Home Screen
- [ ] Permission request flow trong app
- [ ] Server Action: `savePushSubscription`
- [ ] Edge Function: `notify-circle` (Web Push primary)
- [ ] LINE Messaging API setup + opt-in flow trong settings
- [ ] Edge Function: LINE fallback trong `notify-circle`
- [ ] Notification types: new_request, urgent_request, helper_confirmed
- [ ] Edge Function: `remind-invite` (daily cron, D-024)
- [ ] Test: integration (push subscription RLS)

**Exit criteria:**
- [ ] Android user nhận Web Push
- [ ] iOS user (no Add to Home Screen) nhận LINE message
- [ ] Completion Reports từ @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 6 — Request Detail + Help Offer

**Goal:** Member xem detail request và offer giúp → hand-off LINE.

**Dependencies:** Sprint 5 ✅, OQ-007 (match algorithm weight) nên quyết

**Tasks:**

- [ ] Request Detail page: `/requests/[id]`
- [ ] Layout: IconTile lg, category, UrgentPill, InfoBlocks, "Tôi giúp được" button
- [ ] Server Action: `createOffer` → return LINE handoff URL
- [ ] LINE handoff: deeplink với pre-filled message
- [ ] Server Action: `acceptOffer`, `cancelRequest`, `closeRequest`
- [ ] Notification: `helper_confirmed` khi offer accepted
- [ ] "Không lần này" button: dismiss card (local state, không persist)
- [ ] Test: E2E flow 3 (help offer)

**Exit criteria:**
- [ ] Full flow: request → detail → offer → LINE handoff working
- [ ] Completion Reports từ @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 7 — Profile + Members

**Goal:** User có thể xem và edit profile; xem danh sách members.

**Dependencies:** Sprint 3 ✅

**Tasks:**

- [ ] Profile page: card (avatar + name + location), kids section, help_tags chips, edit button
- [ ] Edit Profile: form, Server Action `updateProfile`
- [ ] Avatar upload: image picker, Server Action `uploadAvatar` (Supabase Storage)
- [ ] help_tags picker: 5 loại aid, multi-select
- [ ] Members page: list MemberRows, InviteCTA dashed button
- [ ] MemberRow: avatar, name, place, kids_desc, help_tags chips
- [ ] Notification settings: per-type toggle (Sprint 6 notification types)
- [ ] Test: E2E flow 5 (profile edit)

**Exit criteria:**
- [ ] Profile edit → save → refresh → hiển thị đúng
- [ ] Completion Reports từ @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 8 — Polish + PWA

**Goal:** App sẵn sàng pilot: performance, accessibility, offline, UI polish.

**Dependencies:** Sprint 7 ✅

**Tasks:**

- [ ] PWA: full manifest, icons, offline fallback page
- [ ] Service Worker: cache shell (HTML, CSS, JS)
- [ ] Performance: Lighthouse score ≥80 mobile
- [ ] Accessibility: keyboard nav, aria-labels, contrast ratio
- [ ] Loading states: skeleton screens cho feed, profile
- [ ] Error boundaries: graceful degradation
- [ ] Empty states: tất cả screens
- [ ] iOS: test Add to Home Screen flow, safe-area insets
- [ ] Security headers: CSP, X-Frame-Options (security-privacy.md)
- [ ] `npm audit` — fix high severity

**Exit criteria:**
- [ ] Lighthouse mobile ≥80
- [ ] Offline: có fallback screen
- [ ] Completion Reports từ @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 9 — E2E Testing + Bug Fix

**Goal:** Tất cả 5 E2E flows pass. Pilot-reported bugs fixed.

**Dependencies:** Sprint 8 ✅

**Tasks:**

- [ ] E2E flows 1-5 tất cả pass trên Chrome mobile + Safari mobile
- [ ] RLS test suite: tất cả boundary tests pass
- [ ] Bug bash nội bộ (founder + 1-2 pilot family)
- [ ] Fix bugs từ bug bash
- [ ] CI: tất cả checks pass

**Exit criteria:**
- [ ] CI green
- [ ] Tất cả 5 E2E flows pass
- [ ] Completion Report từ @tester submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 10 — Pilot Launch

**Goal:** Soft launch với ~10 gia đình pilot, monitor metrics 2 tuần.

**Dependencies:** Sprint 9 ✅

**Tasks:**

- [ ] Production deploy (Vercel + Supabase production)
- [ ] Setup monitoring: Vercel Analytics, Supabase Dashboard
- [ ] Invite 10 gia đình pilot (từ LINE circles Phase 1-2)
- [ ] Onboarding support: hướng dẫn Add to Home Screen cho iOS users
- [ ] Monitor: aid requests/tuần, match rate, notification delivery rate
- [ ] Collect feedback sau 1 tuần, 2 tuần

**Exit criteria (sau 2 tuần):**
- [ ] ≥10 aid requests posted
- [ ] ≥60% match rate
- [ ] ≥0 crash bugs reported
- [ ] Completion Report từ @docs-steward submitted
- [ ] Reviewer Agent APPROVED ✅

---

## Sprint 11 — Discovery Feature

**Goal:** Gia đình có thể tìm nhau theo bán kính.

**Dependencies:** Sprint 10 traction đủ (D-021); OQ-014, OQ-016 resolved

**Tasks:**

- [ ] Bật Discovery tab trên BottomNav (ẩn "Sắp ra mắt")
- [ ] Discovery Home: opt-in toggle, radius selector, family list
- [ ] Family Detail screen
- [ ] Server Action: `updateDiscoverySettings`
- [ ] Server Action / RPC: `getDiscoveryFamilies` (filter by radius)
- [ ] Location: geocode khu vực → centroid (ADR-011)
- [ ] ALTER profiles: thêm `location_lat`, `location_lng`
- [ ] RLS: discovery families visible chỉ khi is_visible = true
- [ ] Privacy consent UI khi bật Discovery
- [ ] Test: RLS discovery isolation

**Exit criteria:**
- [ ] User opt-in → thấy danh sách families trong 5km
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅ (Discovery RLS CRITICAL)

---

## Sprint 12 — Discovery Polish + Greeting

**Goal:** Full Discovery flow: tìm → xem profile → gửi lời chào → LINE.

**Dependencies:** Sprint 11 ✅; OQ-014 resolved (format lời chào)

**Tasks:**

- [ ] Compose Greeting screen (theo OQ-014 decision)
- [ ] LINE handoff từ Greeting
- [ ] Discovery Settings screen (ADR-011)
- [ ] "Gia đình đã gửi lời chào" tracking (avoid duplicate greeting)
- [ ] Block/report placeholder (OQ-015 — Phase 5)
- [ ] Final E2E: Discovery flow end-to-end
- [ ] Retrospective Phase 4

**Exit criteria:**
- [ ] Full Discovery flow working
- [ ] Phase 4 retro done
- [ ] Completion Reports từ @backend, @frontend, @tester, @docs-steward submitted
- [ ] Reviewer Agent APPROVED ✅

---

## OQs cần quyết theo sprint

| Sprint | OQ cần quyết trước |
|---|---|
| Sprint 4 | OQ-010 — request expiry |
| Sprint 4 | OQ-017 — backup helper khi cancel |
| Sprint 5 | OQ-012 — inactivity notification |
| Sprint 6 | OQ-007 — match algorithm weight |
| Sprint 11 | OQ-014 — greeting format |
| Sprint 11 | OQ-016 — discovery visibility count |
| Phase 4 cuối | OQ-011 — legal disclaimer |

---

## Metrics theo dõi trong Phase 4

| Metric | Target MVP launch | Công cụ |
|---|---|---|
| Aid requests/tuần (sau launch) | ≥15 | Supabase Dashboard |
| Match rate | ≥60% | Query DB |
| Notification delivery rate (Web Push) | ≥70% | notification_logs |
| Crash rate | 0 | Vercel Error tracking |
| Time to post request | <30 giây | Manual test |
