---
title: Sprint 10 Test Plan — E2E Testing + Bug Fix
sprint: 10
phase: Phase 4 — Build MVP
created: 2026-05-20
status: DRAFT
refs: sprint-10-spec.md, docs/03-technical/test-strategy.md, playwright.config.ts
---

# Sprint 10 Test Plan — E2E Testing + Bug Fix

---

## Test Scope

Sprint 10 tập trung vào việc chạy và verify Playwright E2E test suite, đồng thời bug bash 5 core user flows và thiết lập CI pipeline. Không có business logic mới trong sprint này.

- **Không cần** RLS tests mới (schema không thay đổi)
- **Không cần** Server Action unit tests mới (không có action mới — trừ khi bug fix yêu cầu)
- **Cần:** Playwright no-auth suite pass (TC-10.1)
- **Cần:** Playwright authenticated suite pass local (TC-10.2)
- **Cần:** 5 core flows manual verification trên desktop Chrome (TC-10.3)
- **Cần:** CI pipeline chạy xanh (TC-10.4)
- **Cần:** Regression vitest suite không có failures mới

---

## Test Data Setup

```
Trước khi chạy authenticated suite:
- Tạo test user trong Supabase Dashboard > Authentication > Users
- Test user phải: có profile đầy đủ, thuộc ít nhất 1 circle, circle có ≥1 aid request
- Lấy E2E_TEST_CIRCLE_ID:
    SELECT circle_id FROM circle_members
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
    LIMIT 1;
- Set trong famicon/.env.local:
    E2E_TEST_EMAIL=your-test@example.com
    E2E_TEST_CIRCLE_ID=<uuid>
    PLAYWRIGHT_BASE_URL=http://localhost:3000
- Start dev server: npm run dev (từ famicon/)
- No-auth suite: không cần E2E_TEST_EMAIL/CIRCLE_ID — chỉ cần server running
```

---

## TC-10.1 — No-Auth Playwright Suite

**Mục tiêu:** 3 no-auth specs pass hoàn toàn không cần authentication

**Command:** `npm run test:e2e:no-auth`

### TC-10.1.1 — auth-page.spec.ts
**Given** dev server running tại `PLAYWRIGHT_BASE_URL`
**When** Playwright chạy `e2e/no-auth/auth-page.spec.ts`
**Then:**
- Auth page render đúng tại `/` hoặc `/auth`
- Input email visible và functional
- Submit button accessible
- Tất cả assertions trong spec pass

**Pass criteria:** 0 failed tests trong auth-page.spec.ts
**Fail criteria:** Bất kỳ test nào fail — document error message + screenshot

### TC-10.1.2 — pwa-assets.spec.ts
**Given** dev server running
**When** Playwright chạy `e2e/no-auth/pwa-assets.spec.ts`
**Then:**
- `/manifest.json` trả về HTTP 200, content-type `application/json`
- `/icon-192.png` trả về HTTP 200
- `/icon-512.png` trả về HTTP 200
- `/apple-touch-icon.png` trả về HTTP 200
- `/offline.html` trả về HTTP 200
- `/sw.js` trả về HTTP 200

**Pass criteria:** 0 failed tests trong pwa-assets.spec.ts; tất cả assets return 200
**Fail criteria:** Bất kỳ asset nào return 404

### TC-10.1.3 — security-headers.spec.ts
**Given** dev server running
**When** Playwright request đến app routes và inspect response headers
**Then:**
- `X-Frame-Options: DENY` present
- `X-Content-Type-Options: nosniff` present
- `Content-Security-Policy` present (value không rỗng)
- `Referrer-Policy: strict-origin-when-cross-origin` present

**Pass criteria:** 0 failed tests; tất cả 4 headers present
**Fail criteria:** Bất kỳ header nào absent; test assertion fail

---

## TC-10.2 — Authenticated Playwright Suite

**Mục tiêu:** 6 authenticated specs pass với E2E_TEST_EMAIL + E2E_TEST_CIRCLE_ID đã set

**Pre-condition:** `famicon/.env.local` có đủ 3 E2E env vars; test user tồn tại trong Supabase với circle

**Command:** `npm run test:e2e`

### TC-10.2.1 — global.setup.ts (Auth Bypass)
**Given** `SUPABASE_SERVICE_ROLE_KEY` và `E2E_TEST_EMAIL` đã set trong `.env.local`
**When** Playwright setup project chạy `e2e/global.setup.ts`
**Then:**
- Setup tạo Supabase session thành công (dùng SERVICE_ROLE_KEY)
- Session storage file được ghi vào disk (để authenticated tests dùng)
- Setup exit code 0 (không fail)

**Pass criteria:** Setup project pass; session file tồn tại sau setup
**Fail criteria:** Setup fail với auth error; session file không được tạo

### TC-10.2.2 — home.spec.ts
**Given** authenticated session đã setup
**When** Playwright chạy `e2e/authenticated/home.spec.ts`
**Then:**
- `/home` load thành công với authenticated user
- Request feed visible (hoặc empty state nếu không có data)
- FAB button visible
- BottomNav visible với đúng tabs

**Pass criteria:** 0 failed tests trong home.spec.ts
**Fail criteria:** Bất kỳ test nào fail; redirect về auth page (session không work)

### TC-10.2.3 — new-request.spec.ts
**Given** authenticated session
**When** Playwright chạy `e2e/authenticated/new-request.spec.ts`
**Then:**
- Form new request render đúng
- Form fields accessible (title, description)
- Submit flow hoạt động hoặc form validation đúng

**Pass criteria:** 0 failed tests trong new-request.spec.ts
**Fail criteria:** Form không render; submit crash; test assertion fail

### TC-10.2.4 — profile.spec.ts
**Given** authenticated session
**When** Playwright chạy `e2e/authenticated/profile.spec.ts`
**Then:**
- `/profile` load với user data đúng
- Edit profile elements accessible
- Profile data match E2E_TEST_EMAIL user

**Pass criteria:** 0 failed tests trong profile.spec.ts
**Fail criteria:** Profile không load; data không match; assertion fail

### TC-10.2.5 — members.spec.ts
**Given** authenticated session và `E2E_TEST_CIRCLE_ID` đã set
**When** Playwright chạy `e2e/authenticated/members.spec.ts`
**Then:**
- Members page load với circle đúng
- Danh sách thành viên visible
- InviteCTA visible

**Pass criteria:** 0 failed tests trong members.spec.ts
**Fail criteria:** Circle không load (sai CIRCLE_ID); members list empty khi không nên

### TC-10.2.6 — accessibility.spec.ts
**Given** authenticated session
**When** Playwright chạy `e2e/authenticated/accessibility.spec.ts`
**Then:**
- Axe accessibility checks pass trên các authenticated pages
- Không có critical a11y violations

**Pass criteria:** 0 axe critical violations; 0 failed tests
**Fail criteria:** Critical accessibility violation detected

### TC-10.2.7 — middleware.spec.ts
**Given** authenticated session
**When** Playwright chạy `e2e/authenticated/middleware.spec.ts`
**Then:**
- Unauthenticated requests đến protected routes → redirect đến auth page
- Authenticated requests không bị redirect sai
- Middleware logic đúng

**Pass criteria:** 0 failed tests trong middleware.spec.ts
**Fail criteria:** Auth middleware không redirect; hoặc redirect sai (authenticated user bị kick ra)

---

## TC-10.3 — Manual Bug Bash (5 Core Flows)

**Mục tiêu:** 5 user flows hoạt động end-to-end trên desktop Chrome

**Setup:** Mở `http://localhost:3000` (hoặc Vercel preview) trong Chrome. Có DevTools mở để watch console errors.

### TC-10.3.1 — Flow 1: Auth
**Given** user chưa login, mở app URL
**When:**
1. Nhập email vào input → Submit
2. Nhận OTP email → nhập OTP vào form
3. Confirm
**Then:**
- Redirect đến `/home` (user đã có circle) hoặc `/onboarding` (user mới)
- Không có error trong console
- Không có redirect loop

**Pass criteria:** Login thành công, redirect đúng destination
**Fail criteria:** OTP không gửi; OTP invalid; redirect loop; console error rõ ràng

### TC-10.3.2 — Flow 2: New Request
**Given** user đã login, đang ở `/home`
**When:**
1. Tap FAB button (`+` góc phải dưới)
2. Điền form: nhập tiêu đề và mô tả
3. Submit form
**Then:**
- Redirect về `/home`
- Request mới xuất hiện trong feed trong vòng <5 giây
- Không có lỗi

**Pass criteria:** Request mới visible trong feed sau submit
**Fail criteria:** Form không submit; redirect fail; request không xuất hiện sau 10 giây

### TC-10.3.3 — Flow 3: Help Offer
**Given** user đã login, ở `/home`, có ít nhất 1 request trong feed
**When:**
1. Click vào request card → vào detail page
2. Click "Tôi giúp được" button
**Then:**
- LINE handoff trigger — mở LINE URL scheme hoặc hiện dialog hướng dẫn liên hệ qua LINE
- Không có JS error trong console

**Pass criteria:** LINE handoff behavior trigger đúng
**Fail criteria:** Button không respond; error toast; console error

### TC-10.3.4 — Flow 4: Profile Edit
**Given** user đã login, vào Profile tab
**When:**
1. Tap "Chỉnh sửa hồ sơ" (hoặc edit button)
2. Đổi display_name → Save
**Then:**
- Profile page hiển thị tên mới ngay sau save
- Không cần manual page refresh
- Success toast (nếu có) hiện đúng

**Pass criteria:** Tên mới visible sau save không cần refresh
**Fail criteria:** Tên cũ vẫn hiện sau save; error toast; save không hoạt động

### TC-10.3.5 — Flow 5: Members List
**Given** user đã login
**When** vào Members tab (hoặc navigate đến `/circles/[id]/members`)
**Then:**
- Danh sách thành viên visible
- InviteCTA visible (button/section mời thêm thành viên)
- Loading không bị stuck

**Pass criteria:** Member list và InviteCTA cả hai visible
**Fail criteria:** Blank screen; loading spinner không dừng; InviteCTA không hiện

---

## TC-10.4 — CI Pipeline

**Mục tiêu:** `.github/workflows/ci.yml` tồn tại, chạy được, job unit và e2e-no-auth pass

### TC-10.4.1 — File tồn tại và valid YAML
**Given** `.github/workflows/ci.yml` đã được commit
**When** GitHub nhận push/PR lên main
**Then:**
- GitHub Actions nhận diện workflow
- Không có YAML syntax error
- Workflow trigger on: push branches [main] và pull_request branches [main]

**Pass criteria:** Workflow hiện trong GitHub Actions tab, không có parse error
**Fail criteria:** YAML syntax error; workflow không hiện trong Actions tab

### TC-10.4.2 — Job: unit
**Given** workflow trigger
**When** job `unit` chạy
**Then:**
- `npm ci` install thành công
- `npm run lint` pass (0 errors)
- `npm run test` (vitest) pass — 0 failures

**Pass criteria:** Job `unit` green ✅
**Fail criteria:** Bất kỳ step nào fail

### TC-10.4.3 — Job: e2e-no-auth
**Given** job `unit` đã pass (dependency)
**When** job `e2e-no-auth` chạy
**Then:**
- `npm ci` install + Playwright install thành công
- `npm run build` pass (Next.js build không có errors)
- `npm run test:e2e:no-auth` pass — tất cả no-auth specs green
- Nếu fail: playwright-report artifact được upload

**Pass criteria:** Job `e2e-no-auth` green ✅; no-auth suite pass trong CI environment
**Fail criteria:** Build fail; Playwright fail cài browser; bất kỳ no-auth spec nào fail

### TC-10.4.4 — Authenticated Suite Exclusion Documented
**Given** `ci.yml` đã review
**When** kiểm tra file content
**Then:**
- Không có job nào chạy authenticated Playwright suite
- Comment trong file giải thích lý do exclude authenticated suite
- Comment mention `npm run test:e2e` cho local run

**Pass criteria:** Comment documentation tồn tại và rõ ràng
**Fail criteria:** Không có explanation; authenticated suite được chạy trong CI mà không có proper secrets setup

---

## TC-10.5 — Regression Tests

**Mục tiêu:** Sprint 9 features không bị break sau E2E fixes

### TC-10.5.1 — Vitest Suite
**Given** sau tất cả changes trong Sprint 10 (E2E fixes, bug fixes)
**When** `npm run test` từ `famicon/`
**Then** tất cả vitest tests pass — fail count = 0 mới (so với Sprint 9 baseline)

**Pass criteria:** 0 new test failures
**Fail criteria:** Bất kỳ test nào pass ở Sprint 9 mà fail ở Sprint 10

### TC-10.5.2 — Security Headers Vẫn Hoạt Động
**Given** sau mọi thay đổi trong sprint
**When** `curl -I http://localhost:3000/home` hoặc DevTools inspect
**Then** 4 security headers vẫn có mặt: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy

**Pass criteria:** 4/4 headers present (không bị remove bởi config change)
**Fail criteria:** Bất kỳ header nào mất sau changes

### TC-10.5.3 — PWA Assets Vẫn Serve Đúng
**Given** sau mọi thay đổi trong sprint
**When** request các PWA assets
**Then** manifest.json, icons, sw.js, offline.html vẫn return 200

**Pass criteria:** Tất cả PWA assets return 200
**Fail criteria:** Bất kỳ asset nào return 404 (regression từ Sprint 9)

---

## Pass/Fail Thresholds

| Test Area | Pass Threshold | Fail Action |
|---|---|---|
| No-auth Playwright suite | 0 failed tests (3 specs) | Block exit — fix trước mark done |
| Authenticated Playwright suite | 0 failed tests (6 specs + setup) | Block exit — fix hoặc document blocker rõ ràng |
| 5 Manual flows | 5/5 PASS | Block exit nếu bất kỳ flow nào FAIL |
| CI unit job | Green ✅ | Block exit |
| CI e2e-no-auth job | Green ✅ | Block exit |
| Vitest regression | 0 new failures | Block exit |
| Security headers regression | 4/4 headers | Block exit |

---

## Playwright Suite Summary

| Spec File | Suite | Chạy ở | Cần E2E vars |
|---|---|---|---|
| e2e/no-auth/auth-page.spec.ts | no-auth | Local + CI | Không |
| e2e/no-auth/pwa-assets.spec.ts | no-auth | Local + CI | Không |
| e2e/no-auth/security-headers.spec.ts | no-auth | Local + CI | Không |
| e2e/authenticated/home.spec.ts | authenticated | Local only | Có |
| e2e/authenticated/new-request.spec.ts | authenticated | Local only | Có |
| e2e/authenticated/profile.spec.ts | authenticated | Local only | Có |
| e2e/authenticated/members.spec.ts | authenticated | Local only | Có (+ CIRCLE_ID) |
| e2e/authenticated/accessibility.spec.ts | authenticated | Local only | Có |
| e2e/authenticated/middleware.spec.ts | authenticated | Local only | Có |

---

## Failure Documentation Template

Khi @tester gặp failing test, dùng format sau để report:

```
| Spec | Test Name | Error Message | Root Cause | Fix Owner | Severity |
|------|-----------|---------------|------------|-----------|---------|
| home.spec.ts | "shows request feed" | Expected "Nhờ giúp" to be visible | Text mismatch — component dùng text khác | @frontend | Medium |
```

Severity:
- **Critical** — Test fail vì feature không hoạt động (Flow blocking)
- **Medium** — Test fail vì assertion sai (text/URL mismatch) nhưng feature OK
- **Low** — Flaky test (pass 3/5 runs), timing issue

---

## Regression Check (Sprint 9 Features)

Các features sau phải pass trước khi mark Sprint 10 Done:

| Feature | Test Case | Sprint Origin |
|---|---|---|
| PWA manifest valid | TC-10.1.2 (pwa-assets) | Sprint 9 |
| Security headers | TC-10.1.3 + TC-10.5.2 | Sprint 9 |
| Profile load + edit | TC-10.3.4 (Flow 4) | Sprint 8 |
| New request post | TC-10.3.2 (Flow 2) | Sprint 4 |
| Members list | TC-10.3.5 (Flow 5) | Sprint 8 |
| Auth flow | TC-10.3.1 (Flow 1) | Sprint 1 |
| Vitest suite | TC-10.5.1 | All sprints |

---

*Tạo: 2026-05-20 | Sprint 10 — Phase 4 Build MVP*
*Nguồn: sprint-10-spec.md | sprint-9-test-plan.md (format reference) | playwright.config.ts | e2e/ directory structure | docs/03-technical/test-strategy.md*
