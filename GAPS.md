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
| T-001 | 6 pre-existing failures trong `auth-invite-gating.test.ts` — Sprint 2 mock issue, không liên quan Sprint 8 | MEDIUM | OPEN | Chưa ai fix. Xem lại trong Sprint 9 |
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

---

*Last updated: 2026-05-20 — Sprint 8 DONE*
*Maintained by: Master Agent sau mỗi phiên làm việc*
