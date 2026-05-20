---
title: Sprint 9 Spec — Polish + PWA
sprint: 9
phase: Phase 4 — Build MVP
created: 2026-05-20
status: DRAFT
---

# Sprint 9 — Polish + PWA

## Goal

App sẵn sàng pilot: PWA installable trên iOS/Android, offline fallback hoạt động, Lighthouse mobile ≥80, tất cả screens có đủ loading/error/empty states, security headers đã cài, không còn high-severity vulnerability.

## Dependencies

- Sprint 8 ✅ — Profile + Members complete, BottomNav fully wired, test suite 452/452 pass
- Sprint 0 ✅ — PWA manifest cơ bản và Service Worker cơ bản đã có tại `public/sw.js` và `public/manifest.json`
- Sprint 5 ✅ — Service Worker đã có push handler; sprint này mở rộng thêm cache shell strategy

Không có OQ nào deadline = Sprint 9 — không bị block bởi open questions.

## Out of Scope

- Settings screen đầy đủ (notification preferences, đăng xuất) — deferred sang Sprint 9+ theo note Sprint 8; nếu scope cho phép có thể thêm nhưng không bắt buộc
- E2E automated tests với Playwright — scope của Sprint 10 (E2E Testing + Bug Fix)
- Discovery tab unlock — scope Sprint 11
- Hard delete account — scope Phase 5 (D-030)
- Privacy Policy text đầy đủ tiếng Nhật/Việt — OQ-011 chưa resolved, chỉ cần placeholder link, không cần nội dung đầy đủ
- Push notification inactivity reminder (`remind-invite` Edge Function) — đã implement Sprint 5, không cần thay đổi

## Tasks

### @frontend

1. **PWA manifest hoàn chỉnh** — Update `public/manifest.json`:
   - `name`: "Vòng Tròn Tương Trợ"
   - `short_name`: "Vòng Tròn"
   - `start_url`: "/home"
   - `display`: "standalone"
   - `background_color`: "#ffffff"
   - `theme_color`: "#16a34a" (fc-green-600)
   - `orientation`: "portrait"
   - `icons`: ít nhất 2 sizes — 192×192 và 512×512, format PNG
   - `screenshots` (optional): mobile screenshot cho Chrome install prompt
   - Verify: manifest link tag đã có trong `src/app/layout.tsx` (`<link rel="manifest" ...>`)

2. **PWA icons** — Tạo hoặc đặt icon files tại `public/`:
   - `icon-192.png` — 192×192px
   - `icon-512.png` — 512×512px
   - `apple-touch-icon.png` — 180×180px (cho iOS Add to Home Screen)
   - Màu nền: `#16a34a` (fc-green-600), design đơn giản (initials "VT" hoặc symbol vòng tròn)
   - Thêm `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` vào `src/app/layout.tsx`

3. **Offline fallback page** — Tạo `public/offline.html`:
   - Nội dung: thông báo thân thiện "Bạn đang offline. Kiểm tra kết nối mạng và thử lại."
   - Style inline (không phụ thuộc external CSS khi offline)
   - Logo/icon text đơn giản
   - Button "Thử lại" gọi `window.location.reload()`

4. **Service Worker — cache shell strategy** — Update `public/sw.js`:
   - Cache name: `fc-shell-v1` (versioned — thay đổi khi có breaking change)
   - **Install event:** pre-cache shell assets:
     - `/` (root HTML)
     - `/_next/static/css/**` (CSS chunks — dùng pattern hoặc hardcode key files)
     - `/offline.html`
     - `/icon-192.png`
     - `/manifest.json`
   - **Fetch event:** Network-first strategy cho API calls (`/api/**`, Supabase); Cache-first cho shell assets; fallback `offline.html` khi navigation fetch fail + offline
   - **Activate event:** Delete old caches (không phải `fc-shell-v1`)
   - Giữ nguyên push handler và notificationclick handler từ Sprint 5 — không xóa

5. **Security headers** — Update `next.config.js` (hoặc `next.config.ts`):
   ```javascript
   const securityHeaders = [
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-XSS-Protection', value: '1; mode=block' },
     { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
     {
       key: 'Content-Security-Policy',
       value: [
         "default-src 'self'",
         "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
         "style-src 'self' 'unsafe-inline'",
         "img-src 'self' data: blob: https://*.supabase.co",
         "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.line.me",
         "font-src 'self'",
         "worker-src 'self'",
         "manifest-src 'self'",
         "frame-ancestors 'none'",
       ].join('; ')
     },
     { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
   ];
   ```
   Apply headers trong `headers()` async function của Next.js config cho tất cả routes (`source: '/(.*)'`).

6. **iOS safe-area insets** — Update `src/app/globals.css`:
   - Thêm `env(safe-area-inset-bottom)` padding cho BottomNav container — tránh bị che bởi home indicator iOS
   - Verify `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` đã có trong layout
   - Thêm `viewport-fit=cover` vào meta viewport nếu chưa có

7. **Loading states — skeleton screens** — Verify và bổ sung nếu thiếu:
   - `src/app/(app)/home/loading.tsx` — skeleton cho request feed (đã có từ Sprint 3, verify còn đúng)
   - `src/app/(app)/profile/loading.tsx` — skeleton profile (đã có từ Sprint 8, verify)
   - `src/app/(app)/circles/[id]/members/loading.tsx` — skeleton members list (đã có từ Sprint 8, verify)
   - `src/app/(app)/requests/[id]/loading.tsx` — skeleton request detail (đã có từ Sprint 7, verify)
   - Nếu bất kỳ screen nào thiếu `loading.tsx` → tạo bổ sung với skeleton phù hợp

8. **Error boundaries** — Verify và bổ sung nếu thiếu:
   - `src/app/(app)/home/error.tsx` — đã có từ Sprint 3, verify
   - `src/app/(app)/profile/error.tsx` — đã có từ Sprint 8, verify
   - `src/app/(app)/circles/[id]/members/error.tsx` — đã có từ Sprint 8, verify
   - `src/app/(app)/requests/[id]/error.tsx` — đã có từ Sprint 7, verify
   - Mỗi error boundary phải: hiện message thân thiện (tiếng Việt) + button "Thử lại", BottomNav vẫn render

9. **Empty states** — Verify và bổ sung cho tất cả screens:
   - Home feed: không có request → "Vòng chưa có nhờ giúp nào. Nhấn + để đăng nhờ." (đã có Sprint 3, verify)
   - Members list: chỉ mình user → "Vòng của bạn chưa có thành viên nào khác..." (đã có Sprint 8, verify)
   - Notifications screen (nếu có) → "Chưa có thông báo nào."
   - Requests: không có request nào match filter → empty state

10. **Accessibility (a11y)** — Bổ sung cho toàn app:
    - Tất cả interactive elements (buttons, links, inputs) phải có accessible name rõ ràng (text content hoặc `aria-label`)
    - Icon-only buttons phải có `aria-label`: ví dụ FAB "Đăng nhờ giúp", chat icon "Kết nối qua LINE (sắp ra mắt)", back button "Quay lại"
    - Form inputs phải có `<label>` rõ ràng hoặc `aria-label`
    - Color contrast: text chính trên background phải ≥4.5:1 ratio (WCAG AA) — verify design tokens trong `globals.css`
    - Focus visible: `:focus-visible` style cho keyboard navigation — thêm nếu bị reset bởi CSS
    - Semantic HTML: dùng `<button>` cho actions, `<a>` cho navigation, không dùng `<div onClick>`
    - `role="status"` hoặc `aria-live="polite"` cho toast notifications

11. **Performance — image optimization** — Update code dùng avatar images:
    - `src/components/features/member-row.tsx`: dùng Next.js `<Image>` component thay `<img>` nếu chưa dùng — tự động optimize, lazy load
    - `src/components/features/profile-client.tsx`: tương tự
    - Thêm `sizes` prop phù hợp với layout
    - Config `next.config.js` thêm `images.remotePatterns` cho `*.supabase.co`

12. **`npm audit` — fix high severity** — Chạy từ `famicon/` directory:
    - `npm audit --audit-level=high`
    - Fix tất cả `high` và `critical` vulnerabilities bằng `npm audit fix` hoặc manual upgrade
    - Nếu không thể fix tự động (breaking changes): document lý do và workaround
    - Low/moderate: document nhưng không bắt buộc fix trong sprint này

### @tester

1. **Lighthouse audit** — Chạy Lighthouse CLI hoặc Chrome DevTools:
   - Target: Vercel preview URL sau khi @frontend deploy
   - `lighthouse <url> --emulation.mobile --output json --output html`
   - Ghi lại scores: Performance, Accessibility, Best Practices, SEO
   - **Pass criteria:** Performance ≥80, Accessibility ≥90 (target cao hơn vì là app hỗ trợ cộng đồng)
   - Identify top 3 issues cần fix nếu không đạt

2. **PWA installability check** — Verify trong Chrome DevTools > Application:
   - Manifest parsed correctly, không có errors
   - Service Worker registered + active
   - Icons load được (192px, 512px)
   - `start_url` accessible
   - Installable: "Add to Home Screen" prompt xuất hiện (Android Chrome)

3. **Offline behavior test** — Simulate offline trong Chrome DevTools > Network > Offline:
   - Khi online → đã load app → tắt mạng → navigate trong app: SW trả về cached shell
   - Fresh load offline: SW trả về `offline.html`
   - Re-connect: app hoạt động bình thường
   - **Pass criteria:** Không có blank white screen khi offline; `offline.html` hiện đúng khi fresh load offline

4. **Security headers verification** — Dùng curl hoặc browser DevTools > Network:
   ```bash
   curl -I https://<preview-url>/home
   ```
   Verify có các headers sau trong response:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Content-Security-Policy: ...` (có giá trị, không rỗng)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - **Pass criteria:** Tất cả 4 headers có mặt

5. **Accessibility smoke test** — Manual keyboard navigation:
   - Tab qua Home page: mỗi interactive element đều có focus ring visible
   - Tab qua FAB, RequestCard buttons, BottomNav tabs — đều focusable và có aria-label
   - Screen reader test (VoiceOver iOS): bật VoiceOver, navigate qua Home feed — mỗi RequestCard announce đủ thông tin
   - **Pass criteria:** Không có interactive element nào unreachable bằng keyboard; không có "button" hoặc "link" không có label

6. **Empty states** — Verify với fresh test user (không có data):
   - Home feed: empty state hiển thị đúng
   - Members page: empty state hiển thị đúng (chỉ 1 member)
   - **Pass criteria:** Mỗi screen có empty state rõ ràng, không blank

7. **iOS Add to Home Screen flow** — Manual test trên iPhone (Safari):
   - Truy cập Vercel preview URL trên Safari iOS
   - Safari > Share > "Add to Home Screen" → icon hiện đúng trên Home Screen
   - Tap icon → app mở standalone (không có Safari URL bar)
   - Safe-area insets đúng: BottomNav không bị che bởi home indicator
   - **Pass criteria:** App mở standalone, BottomNav không bị cắt

8. **Regression tests** — Verify Sprint 8 features vẫn hoạt động:
   - Chạy vitest suite: `npm run test` pass toàn bộ (452+)
   - Verify `/profile` page load, edit profile, avatar upload vẫn hoạt động
   - Verify `/circles/[id]/members` vẫn load đúng

## Exit Criteria

- [ ] `public/manifest.json` valid: `name`, `short_name`, `start_url`, `display: standalone`, icons 192+512px
- [ ] `apple-touch-icon.png` tồn tại và được link trong `<head>`
- [ ] `public/offline.html` tồn tại, hiển thị message offline thân thiện
- [ ] Service Worker: cache shell strategy hoạt động — offline load trả về `offline.html` thay vì blank screen
- [ ] Lighthouse Performance mobile ≥80 (trên Vercel preview)
- [ ] Lighthouse Accessibility mobile ≥90
- [ ] Security headers có mặt trong HTTP response: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy
- [ ] Tất cả icon-only buttons có `aria-label` rõ ràng (FAB, chat icon trên MemberRow, back buttons)
- [ ] BottomNav: safe-area inset-bottom hoạt động đúng trên iPhone (không bị che bởi home indicator)
- [ ] `npm audit` không còn high/critical vulnerabilities
- [ ] Vitest suite pass toàn bộ (không có test nào mới bị fail)
- [ ] Empty states đúng trên: Home feed, Members page
- [ ] Error boundaries đúng trên: Home, Profile, Members, Request Detail
- [ ] Completion Reports từ @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

## Open Questions Liên Quan

Không có OQ nào deadline = Sprint 9.

**OQ-011** (OPEN, deadline Phase 4 cuối) — Luật sư Nhật review Privacy Policy. Sprint 9 không bị block, nhưng sau sprint này là Sprint 10 (Pilot Launch) — cần quyết OQ-011 trước Sprint 10 để có Privacy Policy placeholder đủ chuẩn khi launch.

**Flag cho Master Agent:** OQ-011 cần quyết trước Sprint 10. Nếu không resolve → Sprint 10 Pilot Launch có thể bị block.

## Forbidden Patterns Checklist

- [ ] Không thêm counter, badge, hay tracking metric nào vào UI (Constitution Nguyên tắc 2)
- [ ] Không thêm public profile URL accessible ngoài vòng (Constitution Nguyên tắc 9)
- [ ] Service Worker không cache data cá nhân (profiles, requests) vào offline storage (Constitution Nguyên tắc 9 — offline cache chỉ cho app shell, không cho user data)
- [ ] CSP không dùng `unsafe-eval` trong production build — nếu Next.js yêu cầu, document lý do
- [ ] Không dùng `any` TypeScript để bypass type errors (coding-conventions.md)
- [ ] Không thêm analytics tracking scripts mà không có user consent (APPI compliance)

## File Paths Cần Đọc

- `docs/03-technical/security-privacy.md` — Security headers spec (Mục Security Headers)
- `docs/03-technical/adr/ADR-002-pwa.md` — PWA architecture decision
- `docs/02-design/design-system.md` — Color tokens, typography (để verify contrast ratio)
- `docs/00-foundation/constitution.md` — Nguyên tắc 2, 9; Forbidden UX
- `famicon/public/sw.js` — Service Worker hiện tại (Sprint 5, cần extend)
- `famicon/public/manifest.json` — Manifest hiện tại (Sprint 0, cần update)
- `famicon/next.config.js` (hoặc `.ts`) — Config hiện tại, thêm headers
- `famicon/src/app/layout.tsx` — Root layout, thêm meta tags
- `famicon/src/app/globals.css` — Global styles, thêm safe-area insets
- `famicon/src/components/features/member-row.tsx` — Update `<img>` → `<Image>`
- `famicon/src/components/features/profile-client.tsx` — Update `<img>` → `<Image>`
- `famicon/src/components/layout/bottom-nav.tsx` — Verify aria-labels + safe-area

## Sub-agent Breakdown

| Agent | Tasks | Notes |
|---|---|---|
| @frontend | 1-12 (manifest, icons, offline, SW cache, security headers, iOS insets, loading/error/empty states, a11y, image optimization, npm audit) | Chỉnh sửa nhiều files nhỏ — không phải feature mới, là polish |
| @tester | 1-8 (Lighthouse, PWA check, offline, security headers, a11y, empty states, iOS Add to Home Screen, regression) | Mix manual + automated; một số test cần device thật |

**Dependency order:** @frontend trước → @frontend deploy preview → @tester chạy audit trên preview

## Risks + Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| CSP quá strict → app break (CORS block Supabase calls, inline script bị chặn) | App không hoạt động sau khi thêm CSP | Test kỹ trên local dev trước deploy; bắt đầu với Report-Only mode nếu cần (`Content-Security-Policy-Report-Only`); `connect-src` phải include Supabase domain + wss |
| Service Worker cache stale — user thấy version cũ sau update | Bugs cũ vẫn còn, confusing UX | Cache versioning (`fc-shell-v1`) — tăng version khi có breaking change; activate event phải delete old caches |
| Lighthouse score <80 vì ảnh không optimize hoặc render-blocking resources | Exit criteria không đạt | Fix: Next.js `<Image>` component, defer non-critical scripts, preconnect Supabase domain |
| iOS Safari không support Service Worker fully (push notifications đã biết từ Sprint 5) | Offline fallback không hoạt động trên iOS Safari (non-standalone) | Acceptable known limitation; standalone mode (Add to Home Screen) hỗ trợ SW đầy đủ trên iOS 16.4+; document rõ trong test plan |
| `npm audit fix` gây breaking changes trong dependencies | Build fail sau audit fix | Chạy `npm audit fix --dry-run` trước; nếu breaking → fix manually từng package; không dùng `--force` |

## Definition of Done

- [ ] Tất cả exit criteria met
- [ ] Completion Reports từ @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅
- [ ] Tests pass CI (vitest run, lint, typecheck)
- [ ] Deploy preview Vercel thành công
- [ ] Founder test trên device thật (mobile Chrome Android + Safari iOS) — PWA installable, offline fallback hiện, BottomNav không bị che

---

*Tạo: 2026-05-20 | Sprint 9 — Phase 4 Build MVP*
*Nguồn: sprint-plan-phase4.md Sprint 8 section | docs/03-technical/security-privacy.md | ADR-002-pwa.md | constitution.md | PROJECT_STATE.md Sprint 8 notes | sprint-8-spec.md (format template)*
