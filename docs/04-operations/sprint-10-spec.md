---
title: Sprint 10 Spec — E2E Testing + Bug Fix
sprint: 10
phase: Phase 4 — Build MVP
created: 2026-05-20
status: DRAFT
---

# Sprint 10 — E2E Testing + Bug Fix

## Goal

Tất cả Playwright E2E tests passing trên local. CI pipeline (vitest + no-auth Playwright) chạy xanh trên GitHub Actions. 5 core user flows đã được verify thủ công trên desktop Chrome. Không còn blocking bug nào trước Pilot Launch.

## Dependencies

- Sprint 9 ✅ — PWA, security headers, offline fallback, a11y complete; @frontend APPROVED
- E2E test files đã committed — `e2e/` directory với cấu trúc đầy đủ, `playwright.config.ts` với 3 projects
- `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` đã có trong `.env.local`

Không có OQ nào deadline = Sprint 10 — không bị block bởi open questions.

## Out of Scope

- Discovery tab unlock — scope Sprint 11
- Push notification E2E tests — requires device + push subscription setup, deferred
- Authenticated Playwright suite trong CI — requires live Supabase credentials; skip CI for now, documented lý do trong `ci.yml`
- Privacy Policy text đầy đủ (OQ-011) — placeholder đã có, full text scope Sprint 11 prep
- Mobile device E2E automation — manual verification đủ cho sprint này

## Tasks

### @tester

1. **Setup E2E env vars** — Chuẩn bị environment cho authenticated suite:
   - Tạo test user trong Supabase Dashboard: Authentication > Users > Invite User
   - Email test user: bất kỳ email hợp lệ (ghi lại để dùng lại)
   - Test user phải có profile đầy đủ VÀ thuộc ít nhất 1 circle
   - Lấy `E2E_TEST_CIRCLE_ID`:
     ```sql
     -- Chạy trong Supabase SQL Editor
     SELECT circle_id FROM circle_members WHERE user_id = (
       SELECT id FROM auth.users WHERE email = 'your-test-email@example.com'
     ) LIMIT 1;
     ```
   - Thêm vào `famicon/.env.local`:
     ```
     E2E_TEST_EMAIL=your-test-email@example.com
     E2E_TEST_CIRCLE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     PLAYWRIGHT_BASE_URL=http://localhost:3000
     ```
   - Document cách lấy 2 giá trị này trong `docs/04-operations/runbook.md` (thêm section "E2E Test Setup")

2. **Chạy no-auth suite** — Verify tất cả no-auth specs pass:
   ```bash
   # Từ famicon/ directory
   npm run dev &  # Start dev server trước
   npm run test:e2e:no-auth
   ```
   - Specs cần pass: `e2e/no-auth/auth-page.spec.ts`, `pwa-assets.spec.ts`, `security-headers.spec.ts`
   - Document bất kỳ failure nào với error message đầy đủ
   - Fix nếu là string/URL mismatch (pattern đã seen ở commit 0a9b583); escalate lên @backend/@frontend nếu là logic bug

3. **Chạy authenticated suite** — Verify tất cả authenticated specs pass:
   ```bash
   npm run test:e2e
   ```
   - Specs cần pass: `e2e/authenticated/home.spec.ts`, `new-request.spec.ts`, `profile.spec.ts`, `members.spec.ts`, `accessibility.spec.ts`, `middleware.spec.ts`
   - `global.setup.ts` phải chạy trước — tạo Supabase session dùng `SERVICE_ROLE_KEY`
   - Document bất kỳ failure nào với: spec file, test name, error message, screenshots nếu Playwright tự capture
   - Nếu ≥3 tests fail trong cùng 1 spec → likely root cause chung → investigate trước khi fix từng cái

4. **Document failing tests** — Tổng hợp sau bước 2 và 3:
   - Format: `| spec file | test name | error | root cause | fix owner |`
   - Mỗi failing test phải có root cause rõ (không chấp nhận "unknown")
   - Fix owner: @tester (nếu là test assertion sai), @frontend (UI bug), @backend (Server Action/API bug)

5. **Bug bash — 5 core flows trên desktop Chrome** — Manual verification, không cần automated:

   **Flow 1: Auth**
   - Mở `http://localhost:3000` (hoặc Vercel preview)
   - Nhập email → nhận OTP (check inbox) → nhập OTP
   - Expected: redirect đến `/home` (user cũ) hoặc `/onboarding` (user mới)
   - Check: không có lỗi console, không có redirect loop

   **Flow 2: New Request**
   - Từ `/home` → tap FAB (button `+` góc phải)
   - Điền form: tiêu đề, mô tả, deadline (optional)
   - Submit → redirect về `/home`
   - Expected: request mới xuất hiện trong feed <5 giây

   **Flow 3: Help Offer**
   - Từ `/home` → chọn 1 request card → vào detail page
   - Tap "Tôi giúp được"
   - Expected: LINE handoff — mở LINE app hoặc LINE URL scheme, hoặc hiện dialog hướng dẫn liên hệ qua LINE

   **Flow 4: Profile Edit**
   - Vào Profile tab → tap "Chỉnh sửa hồ sơ"
   - Đổi display_name → Save
   - Expected: Profile page hiện tên mới ngay, không cần refresh

   **Flow 5: Members List**
   - Vào Members tab (hoặc `/circles/[id]/members`)
   - Expected: danh sách thành viên visible, InviteCTA visible (button mời thêm)

   Ghi nhận: mỗi flow — PASS / FAIL + note nếu fail

### @architect

1. **Tạo `.github/workflows/ci.yml`** — CI pipeline cho GitHub Actions:

   ```yaml
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     unit:
       name: Unit Tests
       runs-on: ubuntu-latest
       defaults:
         run:
           working-directory: famicon
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             cache-dependency-path: famicon/package-lock.json
         - run: npm ci
         - run: npm run lint
         - run: npm run test

     e2e-no-auth:
       name: E2E (no-auth)
       runs-on: ubuntu-latest
       needs: unit
       defaults:
         run:
           working-directory: famicon
       env:
         NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
         NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
         PLAYWRIGHT_BASE_URL: http://localhost:3000
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             cache-dependency-path: famicon/package-lock.json
         - run: npm ci
         - run: npx playwright install --with-deps chromium
         - run: npm run build
         - run: npm run test:e2e:no-auth
           env:
             CI: true
         - uses: actions/upload-artifact@v4
           if: failure()
           with:
             name: playwright-report
             path: famicon/playwright-report/
             retention-days: 7
   ```

   **Lý do không chạy authenticated suite trong CI:**
   - Authenticated suite yêu cầu `E2E_TEST_EMAIL` + `E2E_TEST_CIRCLE_ID` trỏ đến live Supabase data
   - Secrets này depend vào state của Supabase instance (test user phải tồn tại, phải có circle)
   - Fragile trong CI — test có thể fail vì data issue chứ không phải code issue
   - Documented tại comment trong `ci.yml`; sẽ revisit khi có Supabase seed script (Sprint 11+)
   - Add comment trong `ci.yml`:
     ```yaml
     # NOTE: Authenticated E2E suite is excluded from CI.
     # Reason: requires live Supabase test data (E2E_TEST_EMAIL + E2E_TEST_CIRCLE_ID).
     # Run locally with: npm run test:e2e (after setting env vars in .env.local)
     # Will be automated in CI when Supabase seed script is available (Sprint 11+).
     ```

   Thêm GitHub Secrets cần thiết vào docs — hướng dẫn user add `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào GitHub repo Settings > Secrets.

### @backend (nếu cần)

- Fix bất kỳ Server Action bug nào @tester phát hiện trong E2E hoặc bug bash
- Ưu tiên theo severity: Flow blocking > UI degraded > minor
- Mỗi fix phải có unit test cover case vừa fix

### @frontend (nếu cần)

- Fix bất kỳ UI bug nào @tester phát hiện trong E2E hoặc bug bash
- Ưu tiên: Flow blocking > visual glitch > a11y minor
- Mỗi fix phải pass vitest regression

## Exit Criteria

- [ ] `npm run test:e2e:no-auth` pass locally — tất cả no-auth specs green (auth-page, pwa-assets, security-headers)
- [ ] `npm run test:e2e` pass locally với `E2E_TEST_EMAIL` + `E2E_TEST_CIRCLE_ID` được set — tất cả authenticated specs green
- [ ] `.github/workflows/ci.yml` tồn tại và chạy được — job `unit` + job `e2e-no-auth` thành công
- [ ] 5 core flows verify thủ công trên desktop Chrome — tất cả PASS
- [ ] Không có high/critical bug mới (hoặc đã documented trong `GAPS.md` nếu deferred)
- [ ] `E2E_TEST_EMAIL` và `E2E_TEST_CIRCLE_ID` đã document trong runbook
- [ ] Completion Reports từ @tester, @architect submitted
- [ ] Reviewer Agent APPROVED ✅

## Open Questions Liên Quan

Không có OQ nào deadline = Sprint 10.

**OQ-011** (OPEN, deadline Phase 4 cuối) — Luật sư Nhật review Privacy Policy. Sprint 10 không bị block, nhưng Sprint 11 (Pilot Launch) sẽ bị block nếu OQ-011 chưa resolved. **Cần quyết OQ-011 trước khi bắt đầu Sprint 11.**

## Forbidden Patterns Checklist

- [ ] Không thêm counter, badge, hay tracking metric nào vào UI (Constitution Nguyên tắc 2)
- [ ] Không thêm public profile URL accessible ngoài vòng (Constitution Nguyên tắc 9)
- [ ] E2E test fixtures không lưu data cá nhân vào repo (chỉ dùng env vars, không hardcode)
- [ ] CI secrets không expose trong logs (dùng `${{ secrets.X }}`, không echo ra)
- [ ] Không thêm analytics tracking scripts (APPI compliance)
- [ ] Không dùng `any` TypeScript để bypass type errors (coding-conventions.md)

## File Paths Cần Đọc

- `famicon/playwright.config.ts` — Playwright config: 3 projects (setup, no-auth, authenticated)
- `famicon/e2e/global.setup.ts` — Auth bypass setup dùng SERVICE_ROLE_KEY
- `famicon/e2e/no-auth/` — 3 no-auth spec files
- `famicon/e2e/authenticated/` — 6 authenticated spec files
- `famicon/package.json` — npm scripts: `test:e2e`, `test:e2e:no-auth`
- `docs/04-operations/runbook.md` — Runbook hiện tại (thêm section E2E Setup)
- `docs/00-foundation/constitution.md` — Forbidden patterns
- `GAPS.md` — Track bugs phát hiện trong sprint này

## Sub-agent Breakdown

| Agent | Tasks | Notes |
|---|---|---|
| @tester | 1-5 (env setup, no-auth suite, auth suite, document failures, bug bash) | Chạy locally; escalate bugs sang @backend/@frontend |
| @architect | 1 (tạo ci.yml) | File mới, không chỉnh sửa logic; document lý do skip authenticated in CI |
| @backend | Conditional — fix Server Action bugs nếu @tester report | Chỉ gọi nếu có bug |
| @frontend | Conditional — fix UI bugs nếu @tester report | Chỉ gọi nếu có bug |

**Dependency order:** @tester chạy trước → identify bugs → @backend/@frontend fix (song song nếu cần) → @tester re-run → @architect tạo CI pipeline (độc lập, song song với fixes)

## Risks + Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| global.setup.ts fail — SERVICE_ROLE_KEY không đúng hoặc user không tồn tại | Toàn bộ authenticated suite skip/fail | Verify SERVICE_ROLE_KEY trong .env.local; tạo test user đúng cách qua Supabase Dashboard; kiểm tra log setup |
| E2E_TEST_CIRCLE_ID sai — user không thuộc circle | authenticated tests fail với "not found" / redirect | Dùng SQL query chính xác như documented trong task 1; verify bằng Supabase Table Editor |
| CI build fail vì missing env vars | Job e2e-no-auth fail với config error | no-auth suite không cần Supabase auth; chỉ cần NEXT_PUBLIC_SUPABASE_URL cho init; document required secrets rõ |
| Playwright version mismatch (local vs CI) | Test pass local, fail CI | Pin Playwright version trong package.json; `npx playwright install` explicit trong CI step |
| Bug bash phát hiện blocking bug ngay trước Sprint 11 | Sprint 11 bị delay | Log ngay vào GAPS.md; triage severity; fix trong Sprint 10 nếu blocking, defer nếu không |

## Definition of Done

- [ ] Tất cả exit criteria met
- [ ] Completion Reports từ @tester, @architect (và @backend/@frontend nếu có fixes) submitted
- [ ] Reviewer Agent APPROVED ✅
- [ ] `npm run test` (vitest) pass toàn bộ — không có regression mới
- [ ] CI pipeline chạy xanh trên GitHub (sau push lên main)
- [ ] GAPS.md đã cập nhật — bugs mới phát hiện documented, items đã fix đổi status

---

*Tạo: 2026-05-20 | Sprint 10 — Phase 4 Build MVP*
*Nguồn: sprint-plan-phase4.md Sprint 9 section | sprint-9-spec.md (format template) | playwright.config.ts | e2e/ directory structure | PROJECT_STATE.md Sprint 9 notes*
