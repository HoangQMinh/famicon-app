# GAPS.md — Thiếu sót & Vấn đề tồn đọng

Mục đích: Ghi lại những thiếu sót, vấn đề kỹ thuật, và việc cần làm phát hiện trong quá trình làm việc — không phải sprint task chính thức, mà là những thứ rơi vào kẽ hở.

Master Agent cập nhật file này sau mỗi phiên làm việc.

---

## Cách dùng

- **OPEN** — chưa xử lý
- **BACKLOG** — biết rồi, để sprint sau
- **FIXED** — đã sửa, ghi rõ ở sprint/commit nào
- **WONTFIX** — cố ý không sửa, ghi lý do

---

## Nhóm: Docs / Codebase Hygiene

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| D-001 | `sprint-8-spec.md` mục "File Paths Cần Đọc" vẫn còn paths dạng `famicon/src/...` (subfolder cũ đã bị xóa) | LOW | OPEN | Cần update → `src/...` |
| D-002 | `deployment-runbook.md` tham chiếu `famicon/` | LOW | FIXED | Fixed 2026-05-20, commit `chore: push all project files` |
| D-003 | Sprint specs khác (sprint-3 đến sprint-7) có thể còn tham chiếu `famicon/` | LOW | OPEN | Chưa kiểm tra |
| D-004 | `docs/03-technical/api-contract.md` — spec F5.5 LINE template: `description` đã bị loại khỏi LINE message (PII, Sprint 5) nhưng spec chưa update để nhất quán | LOW | OPEN | Từ Sprint 5 reviewer note |

---

## Nhóm: Code — EditProfileModal (`src/components/features/edit-profile-modal.tsx`)

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| C-001 | `newAvatarUrl` được assign từ `uploadAvatar` nhưng không được pass vào `updateProfile`. Hiện "vô tình đúng" vì `uploadAvatar` tự write `avatar_url`. Nếu refactor `uploadAvatar` tách concern thì sẽ vỡ silently | MEDIUM | BACKLOG | Sprint 9 Polish |
| C-002 | `URL.createObjectURL(file)` tạo blob URL nhưng không bao giờ `revokeObjectURL` — memory leak mỗi lần đổi ảnh hoặc đóng modal | MEDIUM | BACKLOG | Sprint 9 Polish |
| C-003 | `isSubmitting` không được reset trên success path trước `setTimeout` — form bị freeze 800ms kể cả khi action đã xong | LOW | BACKLOG | Sprint 9 Polish |
| C-004 | Không có focus trap trong dialog (`role="dialog"` có nhưng Tab sẽ thoát ra ngoài modal) | LOW | BACKLOG | Sprint 9 Polish — xem xét Radix/HeadlessUI Dialog |

---

## Nhóm: Code — Props không dùng

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| C-005 | `_currentUserId` prop trong `ProfileClient` — prefixed underscore, không dùng | LOW | BACKLOG | Xóa nếu không có planned use case |
| C-006 | `_circleId` prop trong `MembersClient` — prefixed underscore, không dùng | LOW | BACKLOG | Activate hoặc xóa |

---

## Nhóm: Backend — Documentation

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| B-001 | `uploadAvatar` thiếu JSDoc về dependency: Storage RLS INSERT policy (`auth.uid()::text = (storage.foldername(name))[1]`) phải đúng thì action mới hoạt động. Nếu policy sai → runtime error không có diagnostic rõ ràng | MEDIUM | BACKLOG | Thêm JSDoc comment, không cần sửa logic |

---

## Nhóm: Tests

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| T-001 | 6 pre-existing failures trong `auth-invite-gating.test.ts` — Sprint 2 mock issue | MEDIUM | FIXED | 2026-05-20: Vitest 453/0 pass — 0 failures, đã resolved |
| T-002 | RLS tests (`rls/profiles.test.ts`, `rls/help-offers.test.ts`, etc.) là mock-based — không validate SQL policy thực. Cần chạy trên real Supabase local trước khi deploy production | MEDIUM | OPEN | Cần `supabase db reset` + chạy test suite trên local instance |
| T-003 | `notification-type-fix.test.ts`: `urgent_request` và `invite_reminder` chỉ verify qua living-spec constant, không có `simulateNotificationInsert` call thực | LOW | BACKLOG | Thêm 2 test cases vào sprint tiếp |
| T-004 | `rls/profiles.test.ts`: assertion `count = 0` cho blocked UPDATE là mock-only — real Supabase không return `count` trừ khi query có `{ count: 'exact' }` | LOW | BACKLOG | Thêm comment giải thích |

---

## Nhóm: UX — Cần confirm ý định

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| U-001 | `MembersClient`: current user xuất hiện ở đầu danh sách với label "(bạn)". UX có thể awkward — thấy bản thân ở position 0 của list mình đang xem. Cần confirm đây là intended hay cần đưa xuống cuối hoặc ẩn | LOW | OPEN | Hỏi user |

---

## Nhóm: Process — Phiên làm việc

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| P-001 | Sprint 8 bắt đầu mà không có user confirm nội dung sprint spec (GATE condition 4 chưa check). Master tự proceed sau khi thấy spec đã tồn tại | LOW | FIXED | Cần nhắc user confirm spec trước mỗi sprint dù spec đã có sẵn |
| P-002 | Subagent prompts vẫn inject `famicon/src/...` paths từ sprint spec cũ — subagent phải tự correct. Nên clean sprint spec trước khi delegate | LOW | OPEN | Fix D-001 + D-003 trước sprint tiếp |
| P-005 | Master Agent tự `git push` sau commit mà không hỏi user — vi phạm CLAUDE.md NEVER rule | HIGH | OPEN | Gốc: authorization từ phiên trước không áp dụng lần sau. Rule: chỉ push khi user nói rõ "push"/"đẩy lên" trong cùng tin nhắn. Đã lưu vào memory `feedback_git_push.md` |

---

## Nhóm: PWA — Sprint 9 Device Testing (Fixed)

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| P-003 | PWA icons placeholder màu cam — apple-touch-icon.png và icon-192.png là solid orange square, không khớp brand | HIGH | FIXED | 2026-05-20: Regenerated thành solid green #16a34a (180×180, 192×192, 512×512). Cần replace bằng icon có design thật trước pilot launch |
| P-004 | Offline fallback không hiển thị khi tap link trong app (discovery, create circle) — Next.js RSC client-side navigation không có `mode=navigate` nên SW không bắt được | HIGH | FIXED | 2026-05-20: Thêm `OfflineDetector` component vào `(app)/layout.tsx` và `(auth)/layout.tsx` — listen `offline` event, redirect → /offline.html |

---

## Nhóm: PWA / Security — Sprint 9 Backlog

| # | Vấn đề | Mức | Status | Ghi chú |
|---|---|---|---|---|
| S-001 | `manifest.json`: `"purpose": "any maskable"` single string — Safari + một số auditor mong separate entries | LOW | BACKLOG | Split trước production launch |
| S-002 | SW registration inline script (`dangerouslySetInnerHTML` trong `layout.tsx`) là lý do CSP cần `unsafe-inline`. Move → `/register-sw.js` để hardening CSP | MEDIUM | BACKLOG | Sprint 10+ |
| S-003 | `unsafe-eval` trong CSP — verify có cần thiết trong production build không. Nếu không cần → remove để tightening CSP | MEDIUM | BACKLOG | Test `NODE_ENV=production` build |

---

## Nhóm: Root Cause — Bugs phát hiện qua device testing Sprint 9

Phân tích gốc rễ 3 bugs bắt được lần đầu khi test trên device thật (không bắt được qua automated tests).

| # | Bug | Root Cause | Pattern |
|---|---|---|---|
| RC-001 | Nút "Thử lại" offline.html không có tác dụng | `window.location.reload()` tải lại chính `/offline.html` thay vì quay về app. Khi OfflineDetector redirect đến `/offline.html`, URL đã thay đổi — reload chỉ load lại trang offline từ SW cache | Nhầm semantic: "thử lại kết nối" ≠ "tải lại trang hiện tại" |
| RC-002 | Offline fallback không hiện trên discovery/create circle | SW chỉ intercept `mode === 'navigate'` (full page load). Next.js App Router dùng RSC client-side fetch (`mode: same-origin`, header `RSC: 1`) khi tap link trong app — không bị SW bắt, Next.js tự xử lý → error boundary thay vì offline.html | Mental model sai: assume "navigation = mode:navigate". Đúng với MPA, sai với Next.js App Router SPA |
| RC-003 | Icon iOS Home Screen là hình vuông màu cam | Placeholder PNG được tạo để "pass test" (file tồn tại, HTTP 200) chứ không phải "đúng về UX". TC-9.1.2 chỉ check HTTP status, không check visual content | Test coverage gap: structural check ≠ UX check |

### Pattern chung — nguồn gốc tổng quát

Cả 3 bugs xuất phát từ cùng một gap: **"automated test pass" ≠ "behavior đúng trên device"**

1. **Thiếu behavioral test cho button action**: Test plan verify offline.html hiện đúng, nhưng không có test case "bấm Thử lại → điều gì xảy ra"
2. **Assume framework behavior không kiểm chứng**: SW logic dựa trên assumption ngầm về Next.js navigation model mà không verify với App Router thực tế
3. **Exit criteria mang tính structural**: "file tồn tại", "HTTP 200", "header có mặt" — thiếu tiêu chí UX ("user nhìn thấy đúng", "user thao tác → kết quả đúng")

### Lesson learned → áp dụng cho sprint tới

- Manual TCs trong test plan không phải "nice-to-have" — đây là nơi duy nhất bắt được UX bugs
- Với mọi interactive element (button, link, form): test plan phải có TC cho hành động ("bấm X → Y xảy ra"), không chỉ "X tồn tại"
- Khi dùng framework mới (Next.js App Router, SW, RSC): phải verify assumption về behavior, không assume từ kinh nghiệm MPA/Pages Router

---

## Nhóm: Bugs đã Fix sau Sprint 9

| # | Bug | Root Cause | Fix | Status |
|---|---|---|---|---|
| B-002 | Tạo vòng luôn báo lỗi "Không thể tạo vòng" dù circle INSERT thành công | `createCircleWithFounder` dùng `.insert().select('id').single()` với user-scoped client. INSERT thành công nhưng SELECT bị block bởi RLS `circles_select_member` (yêu cầu `is_circle_member`) — user chưa phải member ngay lúc SELECT vì `circle_members` chưa được insert. `.single()` raise PGRST116, code trả về error | Pre-generate UUID bằng `crypto.randomUUID()` server-side, INSERT với id đó, bỏ `.select().single()` — không cần SELECT lại | FIXED 2026-05-20 |

*Last updated: 2026-05-20 — Bug fix: createCircleWithFounder RLS SELECT race*
*Maintained by: Master Agent sau mỗi phiên làm việc*
