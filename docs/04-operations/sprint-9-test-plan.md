---
title: Sprint 9 Test Plan — Polish + PWA
sprint: 9
phase: Phase 4 — Build MVP
created: 2026-05-20
status: DRAFT
refs: sprint-9-spec.md, docs/03-technical/test-strategy.md, docs/03-technical/security-privacy.md
---

# Sprint 9 Test Plan — Polish + PWA

---

## Test Scope

Sprint 9 không thêm business logic mới — tập trung polish, PWA infrastructure, và non-functional requirements. Test plan phản ánh điều này:

- **Không cần** RLS tests mới (schema không thay đổi)
- **Không cần** Server Action unit tests mới (không có action mới)
- **Cần:** Infrastructure verification (manifest, SW, headers, Lighthouse)
- **Cần:** Manual device tests (iOS Add to Home Screen, offline behavior)
- **Cần:** Accessibility smoke tests
- **Cần:** Regression suite toàn bộ (đảm bảo không break Sprint 8)

---

## Test Data Setup

```
Trước khi chạy test suite:
- User test A: đã có profile đầy đủ, đã có circle, có ≥1 aid request trong circle
- User test B: đã join cùng circle với User A
- Dùng Vercel preview URL (deploy từ @frontend hoàn thành)
- Lighthouse test: Chrome DevTools hoặc CLI `lighthouse <url> --preset mobile`
- Security headers test: `curl -I <url>` hoặc browser DevTools > Network tab
```

---

## TC-9.1 — PWA Manifest

**Mục tiêu:** Manifest valid, app installable

**Test data:** Bất kỳ URL của app (preview hoặc production)

### TC-9.1.1 — Manifest Parsing
**Given** user mở app trong Chrome DevTools > Application > Manifest
**When** inspect manifest
**Then:**
- Không có "Manifest errors" trong DevTools
- `name` = "Vòng Tròn Tương Trợ"
- `short_name` = "Vòng Tròn"
- `start_url` = "/home"
- `display` = "standalone"
- `icons` có ít nhất 2 entries: sizes 192x192 và 512x512

**Pass criteria:** 0 manifest errors, tất cả fields trên có giá trị đúng
**Fail criteria:** Bất kỳ manifest error nào, thiếu icon sizes

### TC-9.1.2 — Icon Files Exist
**Given** manifest đã parsed
**When** browser fetch icon URLs (`/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`)
**Then** mỗi icon return HTTP 200, content-type `image/png`

**Pass criteria:** 3/3 icon files return 200
**Fail criteria:** Bất kỳ icon nào return 404

### TC-9.1.3 — Apple Touch Icon
**Given** user mở app trên Safari iOS
**When** Safari > Share > "Add to Home Screen"
**Then** icon preview hiển thị đúng (không phải default Safari screenshot)

**Pass criteria:** Custom icon hiện trong Add to Home Screen dialog
**Fail criteria:** Safari dùng screenshot thay icon

---

## TC-9.2 — Service Worker + Offline

**Mục tiêu:** SW registered, cache shell hoạt động, offline fallback đúng

### TC-9.2.1 — Service Worker Registration
**Given** user load app trong Chrome
**When** Chrome DevTools > Application > Service Workers
**Then:**
- SW status: "activated and is running"
- Scope: `/`
- Script: `/sw.js`

**Pass criteria:** SW active, không có errors
**Fail criteria:** SW "redundant", "waiting", hoặc có error

### TC-9.2.2 — Cache Shell Populated
**Given** SW đã registered + activated
**When** Chrome DevTools > Application > Cache Storage
**Then** cache `fc-shell-v1` tồn tại với ít nhất 3 entries (offline.html, icon, manifest)

**Pass criteria:** Cache `fc-shell-v1` có ≥3 entries
**Fail criteria:** Cache rỗng hoặc không tồn tại

### TC-9.2.3 — Offline Fallback (Fresh Load)
**Given** user chưa từng visit app
**When** Chrome DevTools > Network > Offline mode ON → navigate đến `/home`
**Then** `offline.html` được render — hiển thị message "Bạn đang offline. Kiểm tra kết nối mạng và thử lại."

**Pass criteria:** offline.html render đúng, không có blank white screen
**Fail criteria:** Blank screen, Chrome default offline dinosaur page

### TC-9.2.4 — Offline Fallback (Previously Loaded)
**Given** user đã load app (shell cached)
**When** tắt mạng (DevTools Offline) → navigate sang route khác
**Then** app shell (HTML + CSS) vẫn render được, BottomNav visible

**Pass criteria:** App shell render, không crash
**Fail criteria:** Blank screen, JS error

### TC-9.2.5 — Push Handler Preserved
**Given** SW đã update từ Sprint 9
**When** trigger push notification (qua Supabase Edge Function test)
**Then** push handler vẫn hoạt động đúng (notification hiện trên device)

**Pass criteria:** Notification hiện đúng như Sprint 5
**Fail criteria:** Push notification bị mất sau SW update

---

## TC-9.3 — Security Headers

**Mục tiêu:** Tất cả security headers có mặt trong HTTP response

**Test data:** `curl -I https://<preview-url>/home` hoặc Chrome DevTools > Network > response headers

### TC-9.3.1 — X-Frame-Options
**Given** request đến bất kỳ route nào
**When** check response headers
**Then** `X-Frame-Options: DENY` có mặt

**Pass criteria:** Header present với value DENY
**Fail criteria:** Header absent

### TC-9.3.2 — X-Content-Type-Options
**Given** request đến bất kỳ route nào
**When** check response headers
**Then** `X-Content-Type-Options: nosniff` có mặt

**Pass criteria:** Header present với value nosniff
**Fail criteria:** Header absent

### TC-9.3.3 — Content-Security-Policy
**Given** request đến bất kỳ route nào
**When** check response headers
**Then** `Content-Security-Policy` header có mặt với value không rỗng

**Pass criteria:** Header present, value có `default-src`, `connect-src` chứa Supabase domain
**Fail criteria:** Header absent

### TC-9.3.4 — Referrer-Policy
**Given** request đến bất kỳ route nào
**When** check response headers
**Then** `Referrer-Policy: strict-origin-when-cross-origin` có mặt

**Pass criteria:** Header present với value đúng
**Fail criteria:** Header absent

### TC-9.3.5 — CSP Không Break App
**Given** CSP headers đã bật
**When** user dùng app bình thường (login, post request, view profile)
**Then** không có CSP violation errors trong browser console (DevTools > Console > filter "Content Security Policy")

**Pass criteria:** 0 CSP violation errors trong console khi dùng app bình thường
**Fail criteria:** Bất kỳ CSP violation nào block functionality

---

## TC-9.4 — Lighthouse Audit

**Mục tiêu:** Performance ≥80, Accessibility ≥90 trên mobile

**Test setup:**
```bash
# Option A: Chrome DevTools > Lighthouse > Mobile
# Option B: CLI
lighthouse https://<preview-url>/home --preset mobile --output html --output-path ./lighthouse-report.html
```

### TC-9.4.1 — Performance Score
**Given** Lighthouse chạy trên `/home` (mobile preset, 3G Fast, 4× CPU slowdown)
**When** audit hoàn thành
**Then** Performance score ≥80

**Pass criteria:** Performance score ≥80
**Fail criteria:** Score <80 → identify top 3 opportunities, fix trước mark done

### TC-9.4.2 — Accessibility Score
**Given** Lighthouse chạy trên `/home`
**When** audit hoàn thành
**Then** Accessibility score ≥90

**Pass criteria:** Accessibility score ≥90
**Fail criteria:** Score <90 → fix tất cả "Needs review" items có impact high/medium

### TC-9.4.3 — PWA Installability (Lighthouse)
**Given** Lighthouse PWA audit chạy
**When** check "Installable" section
**Then** Không có failed checks trong "Installable" section

**Pass criteria:** 0 failed installability checks
**Fail criteria:** Bất kỳ failed check nào trong Installable section

---

## TC-9.5 — Accessibility Manual Test

**Mục tiêu:** Keyboard navigation đầy đủ, aria-labels đúng, contrast đạt WCAG AA

### TC-9.5.1 — Keyboard Navigation Home Feed
**Given** user mở `/home` trên desktop Chrome
**When** press Tab liên tục từ đầu page
**Then:**
- FAB ("Đăng nhờ giúp") focusable với visible focus ring
- Mỗi RequestCard button ("Xem chi tiết", "Tôi giúp được") focusable
- BottomNav tabs (Vòng, Nhờ giúp, Hồ sơ) focusable

**Pass criteria:** Tab đến được tất cả interactive elements, focus ring visible
**Fail criteria:** Bất kỳ interactive element nào không có focus ring hoặc unreachable bằng Tab

### TC-9.5.2 — aria-label Icon-only Buttons
**Given** inspect DOM bằng browser accessibility tree (DevTools > Accessibility)
**When** check các icon-only buttons
**Then:**
- FAB: `aria-label` = "Đăng nhờ giúp" (hoặc tương đương)
- Chat icon trên MemberRow: `aria-label` chứa "LINE" và/hoặc "sắp ra mắt"
- Back button (nếu có): `aria-label` = "Quay lại"
- Edit profile button: accessible name rõ ràng

**Pass criteria:** Tất cả icon-only buttons có aria-label không rỗng
**Fail criteria:** Bất kỳ button nào có accessible name = "button" hoặc rỗng

### TC-9.5.3 — Form Labels
**Given** user mở Edit Profile modal
**When** inspect form fields bằng accessibility tree
**Then** mỗi input có label rõ ràng: "Tên hiển thị", "Khu vực / Ga", "Mô tả con", "Có thể giúp"

**Pass criteria:** 4/4 form fields có label đúng
**Fail criteria:** Bất kỳ field nào không có label

### TC-9.5.4 — Color Contrast (Text trên Background)
**Given** design tokens trong `globals.css`
**When** check contrast ratio bằng Lighthouse hoặc browser color picker tool
**Then** body text (dark on white) ≥4.5:1; secondary text ≥3:1 (WCAG AA)

**Pass criteria:** Không có contrast failure trong Lighthouse Accessibility audit
**Fail criteria:** Bất kỳ contrast failure nào trong Lighthouse report

---

## TC-9.6 — iOS Add to Home Screen (Manual)

**Mục tiêu:** App installable trên iOS, safe-area insets đúng

**Test device:** iPhone (bất kỳ model có home indicator — iPhone X trở lên), Safari iOS

### TC-9.6.1 — Installation Flow
**Given** mở Vercel preview URL trên Safari iOS
**When** Safari > Share button > "Add to Home Screen"
**Then:**
- Custom icon hiện trong dialog (không phải website screenshot)
- Name default = "Vòng Tròn" (short_name)
- Tap "Add" → icon xuất hiện trên Home Screen

**Pass criteria:** Icon đúng, name đúng, icon xuất hiện sau Add
**Fail criteria:** Sai icon, sai name

### TC-9.6.2 — Standalone Launch
**Given** đã Add to Home Screen
**When** tap icon từ Home Screen
**Then:**
- App mở ở standalone mode (không có Safari URL bar)
- Theme color của status bar: xanh lá (fc-green-600)
- Start URL là `/home`

**Pass criteria:** Standalone mode, không có Safari chrome
**Fail criteria:** App mở trong Safari với URL bar

### TC-9.6.3 — Safe-Area Insets (BottomNav)
**Given** app đang chạy standalone trên iPhone có home indicator
**When** nhìn vào BottomNav ở cuối màn hình
**Then:**
- BottomNav icons/labels không bị che bởi home indicator (dải đen/trắng ở đáy màn hình)
- Có khoảng trắng đủ giữa BottomNav content và home indicator

**Pass criteria:** BottomNav không bị chồng lên bởi home indicator
**Fail criteria:** Home indicator đè lên tab labels của BottomNav

---

## TC-9.7 — Empty States

**Mục tiêu:** Tất cả screens có empty state rõ ràng, không blank

### TC-9.7.1 — Home Feed Empty State
**Given** user đăng nhập vào vòng chưa có request nào
**When** vào `/home`
**Then** hiển thị empty state message (không blank), ví dụ: "Vòng chưa có nhờ giúp nào. Nhấn + để đăng nhờ."

**Pass criteria:** Empty state message visible, không có loading spinner mãi mãi
**Fail criteria:** Blank screen, spinner không dừng

### TC-9.7.2 — Members Page Empty State
**Given** user trong vòng chỉ có 1 thành viên (mình)
**When** vào `/circles/[id]/members`
**Then** hiển thị message "Vòng của bạn chưa có thành viên nào khác..."

**Pass criteria:** Empty state message visible
**Fail criteria:** Blank screen hoặc chỉ có InviteCTA mà không có message giải thích

---

## TC-9.8 — Error Boundaries

**Mục tiêu:** App không crash hoàn toàn khi có lỗi server

### TC-9.8.1 — Network Error on Home Feed
**Given** user load `/home` khi Supabase tạm thời unreachable (simulate bằng block request trong DevTools)
**When** page load fail
**Then** error boundary hiện — có message thân thiện + button "Thử lại" — BottomNav vẫn visible

**Pass criteria:** Error UI hiện, BottomNav không biến mất, button "Thử lại" clickable
**Fail criteria:** Blank screen, app crash, BottomNav biến mất

---

## TC-9.9 — Regression Tests

**Mục tiêu:** Sprint 8 features không bị break sau Polish changes

### TC-9.9.1 — Vitest Suite
**Given** sau tất cả @frontend changes trong Sprint 9
**When** `npm run test` từ `famicon/`
**Then** tất cả tests pass — ≥452 pass, 0 fail (không tính pre-existing failures đã documented)

**Pass criteria:** Pass count ≥452, fail count = 0 mới
**Fail criteria:** Bất kỳ test mới nào fail

### TC-9.9.2 — Profile Flow
**Given** user đã có profile
**When** vào `/profile` → tap "Chỉnh sửa hồ sơ" → edit display_name → save
**Then** profile page hiển thị name mới ngay (không cần manual refresh)

**Pass criteria:** Tên mới hiện sau save
**Fail criteria:** Tên cũ vẫn hiện, cần refresh

### TC-9.9.3 — Avatar Upload
**Given** user ở Edit Profile modal
**When** chọn ảnh → preview local → save
**Then** avatar mới hiển thị trên profile

**Pass criteria:** Avatar mới hiện sau save
**Fail criteria:** Avatar không đổi sau save, error toast không rõ nguyên nhân

### TC-9.9.4 — Request Post + Feed Update
**Given** user ở `/home`
**When** tap FAB → điền form → submit
**Then** redirect về `/home`, request mới xuất hiện trong feed

**Pass criteria:** Request mới visible trong feed <5 giây
**Fail criteria:** Request không xuất hiện, redirect fail

---

## TC-9.10 — npm audit

**Mục tiêu:** Không còn high/critical vulnerabilities

### TC-9.10.1 — Audit Clean
**Given** sau `npm audit fix` từ @frontend
**When** chạy `npm audit --audit-level=high` từ `famicon/`
**Then** output: "found 0 vulnerabilities" hoặc chỉ còn low/moderate

**Pass criteria:** 0 high/critical vulnerabilities
**Fail criteria:** Bất kỳ high hoặc critical vulnerability nào còn lại

---

## Device Targets

| Platform | Priority | Coverage |
|---|---|---|
| Android Chrome (mobile) | Primary | TC-9.2, TC-9.3, TC-9.4, TC-9.5, TC-9.7, TC-9.8, TC-9.9 |
| iOS Safari (standalone) | Primary | TC-9.6 (Add to Home Screen full flow) |
| Desktop Chrome | Secondary | TC-9.5.1–9.5.4 (keyboard nav, a11y), TC-9.3 (headers via DevTools) |

---

## Pass/Fail Thresholds

| Test Area | Pass Threshold | Fail Action |
|---|---|---|
| Lighthouse Performance | ≥80 | Block exit — fix trước mark done |
| Lighthouse Accessibility | ≥90 | Block exit — fix tất cả high/medium issues |
| Security Headers | 4/4 headers present | Block exit |
| PWA Installability | 0 Lighthouse failures | Block exit |
| Offline Fallback | offline.html hiện đúng | Block exit |
| Vitest regression | 0 new failures | Block exit |
| iOS Add to Home Screen | Standalone mode, safe-area đúng | Block exit |
| npm audit | 0 high/critical | Block exit |

---

## Regression Check (Sprint 8 Features)

Các features sau phải pass trước khi mark Sprint 9 Done:

| Feature | Test Case | Sprint Origin |
|---|---|---|
| Profile load | TC-9.9.2 | Sprint 8 |
| Avatar upload | TC-9.9.3 | Sprint 8 |
| New request post | TC-9.9.4 | Sprint 4 |
| Push notification (device test) | TC-9.2.5 | Sprint 5 |
| Members list load | Manual: `/circles/[id]/members` load | Sprint 8 |
| Auth (login/logout) | Manual: email OTP flow | Sprint 1 |

---

*Tạo: 2026-05-20 | Sprint 9 — Phase 4 Build MVP*
*Nguồn: sprint-9-spec.md | docs/03-technical/test-strategy.md | docs/03-technical/security-privacy.md | sprint-8-spec.md (format reference)*
