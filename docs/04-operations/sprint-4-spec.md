---
title: Sprint 4 Spec — New Request
sprint: 4
theme: New Request
week: Tuần 5 — Phase 4 Build MVP
last_updated: 2026-05-17
decision_refs: D-032 (aid request expiry), D-033 (backup helper flow), D-013 (sprint length)
---

# Sprint 4 — New Request

## Goal

User có thể tạo một aid request trong vòng 30 giây, kể từ lúc tap FAB đến lúc request hiện trên feed của vòng.

---

## Dependencies

| Dependency | Status | Ghi chú |
|---|---|---|
| Sprint 3 — Circle Home + Feed | DONE ✅ | FAB đã có, feed đã render |
| OQ-010 — Aid request expiry | RESOLVED → D-032 ✅ | Request tự expire khi qua `scheduled_at` |
| OQ-017 — Backup helper khi cancel | RESOLVED → D-033 ✅ | App re-notify toàn vòng khi match bị cancel |

### Decision References bắt buộc đọc

**D-032:** Aid request tự động expire khi qua thời điểm `scheduled_at` của request. Sau thời điểm đó request không còn actionable — expire theo thực tế nghiệp vụ, không cần config thêm.

**D-033:** Khi match bị cancel, app tự re-notify toàn bộ vòng để tìm helper mới. Giảm friction cho asker — không cần post lại từ đầu; re-notify giữ nguyên request gốc, chỉ reset trạng thái về `open`.

---

## Features

| # | Feature | User Story | Priority |
|---|---|---|---|
| F-4.1 | New Request page `/new-request` | US-007 | Must |
| F-4.2 | Form 5 fields (category tiles, description, scheduled_at, location, urgent) | US-007 | Must |
| F-4.3 | `createRequest` Server Action | US-007 | Must |
| F-4.4 | `canSubmit` validation logic | US-007 | Must |
| F-4.5 | Success toast + redirect về Home | US-007 | Must |
| F-4.6 | FAB wiring từ Circle Home → `/new-request` | US-007 | Must |
| F-4.7 | Fix pre-existing test failure `middleware.test.ts:154` | — | Must |

### Ghi chú về URL

Screen spec (`post-request-screen.md`) ghi URL là `/requests/new`. Coding conventions ghi `new-request/page.tsx`. Sprint plan ghi `/new-request`. Dùng `/new-request` cho nhất quán với coding-conventions.md và sprint plan. Nếu cần redirect từ `/requests/new` thì thêm redirect rule sau.

---

## Out of Scope

- Notification gửi đi khi có request mới — Sprint 5
- `cancelRequest`, `closeRequest`, `acceptOffer` — Sprint 6
- Request expiry logic (scheduled job) — Sprint 6 hoặc Sprint 8 (cần Edge Function)
- Re-notify khi match cancel (D-033) — Sprint 6 (phần offer flow)
- Edit request sau khi đã submit
- Draft / auto-save form
- Image attachment trong request
- Location map picker (field là free text)

---

## Acceptance Criteria

Mỗi criterion phải testable — không dùng "hoạt động bình thường".

| AC # | Criterion | Cách verify |
|---|---|---|
| AC-4.1 | Tap FAB trên Home → navigate đến `/new-request` | Manual test + E2E |
| AC-4.2 | Form hiển thị đúng 5 fields theo screen spec: CategoryTiles (5 loại), textarea description, input scheduled_at, input location, urgent buttons | Visual inspection + unit test |
| AC-4.3 | `pickup` pre-selected khi mở form | Unit test state initial |
| AC-4.4 | Submit button disabled khi thiếu bất kỳ field nào trong: category, description (non-empty), scheduled_at (non-empty), location (non-empty) | Unit test canSubmit logic |
| AC-4.5 | Submit button enabled khi đủ 4 fields bắt buộc | Unit test |
| AC-4.6 | `createRequest` Server Action nhận đúng input, insert vào `aid_requests`, trả về `{ request_id }` | Integration test |
| AC-4.7 | RLS: chỉ user là member của circle mới insert được aid_request vào circle đó | RLS test |
| AC-4.8 | Sau submit thành công → redirect về `/home` + success toast xuất hiện | E2E flow |
| AC-4.9 | **30-second test:** từ FAB tap đến request hiện trên feed < 30 giây (bao gồm realtime update từ Sprint 3) | Manual test trên device thật |
| AC-4.10 | Lỗi network khi submit → toast error, form giữ nguyên data, button re-enabled | Unit test + manual |
| AC-4.11 | Double-tap submit: chỉ 1 request được tạo (button disabled during submit) | Unit test |
| AC-4.12 | `middleware.test.ts:154` pass (fix redirect /auth → /home) | `vitest run` CI green |
| AC-4.13 | `npm run build` pass, không có TypeScript error | CI check |

---

## OQ Dependencies

| OQ | Deadline | Status | Decision |
|---|---|---|---|
| OQ-010 | Sprint 4 | RESOLVED ✅ | D-032 — expire theo scheduled_at |
| OQ-017 | Sprint 4 | RESOLVED ✅ | D-033 — re-notify vòng khi cancel |

Không có OQ nào còn OPEN blocking Sprint 4. Sprint được phép bắt đầu.

---

## Sub-agent Breakdown

### @backend

**Nhiệm vụ:**

1. Tạo `src/lib/schemas/requests.ts` — bổ sung `newRequestSchema` (Zod) cho form submission
   - `circle_id: z.string().uuid()`
   - `category: z.enum(['pickup', 'borrow', 'childcare', 'ride', 'other'])`
   - `description: z.string().min(5).max(200)`
   - `scheduled_at: z.string().min(1)`
   - `location: z.string().min(1)`
   - `is_urgent: z.boolean()`

2. Tạo `createRequest` Server Action trong `src/app/actions/requests.ts`
   - Auth guard: user phải logged in
   - Kiểm tra user là member của `circle_id` trước khi insert
   - Insert vào `aid_requests`
   - Return `ActionResult<{ request_id: string }>`
   - Error codes: `UNAUTHORIZED`, `NOT_MEMBER`, `VALIDATION_ERROR`

3. Fix `src/middleware.ts` — pre-existing failure: redirect target cũ `/circle` → update thành `/home` (align với Sprint 3 implementation)

**Files cần đọc:**
- `docs/03-technical/api-contract.md` — `createRequest` spec
- `docs/03-technical/data-model.md` — `aid_requests` schema + RLS
- `docs/03-technical/coding-conventions.md` — patterns
- `src/app/actions/requests.ts` — file hiện tại (getCircleRequests, getCircleInfo đã có)
- `src/lib/schemas/requests.ts` — schemas hiện tại (Sprint 3)
- `src/middleware.ts` — fix redirect target

### @frontend

**Nhiệm vụ:**

1. Tạo `/new-request` page: `src/app/(app)/new-request/page.tsx`
   - Server Component wrapper (layout + metadata)
   - Client Component: `src/components/features/new-request-form.tsx`

2. Implement form theo `docs/02-design/screen-specs/post-request-screen.md`:
   - `CategoryTile` component (hoặc reuse nếu đã có) — 5 tiles, 3×2 grid, `pickup` pre-selected
   - Field 2: `<textarea className="fc-textarea" maxLength={200} />` + counter `N/200`
   - Field 3: `<input className="fc-input">` với IconCalendar icon, free-text
   - Field 4: `<input className="fc-input">` với IconMapPin icon, free-text
   - Field 5: 2 urgent buttons, mặc định `is_urgent = false` ("Không" highlighted)
   - Submit button: disabled khi `!canSubmit`, loading state khi submitting
   - `canSubmit`: `cat && detail.trim().length > 0 && when.length > 0 && place.length > 0`

3. Wire FAB trong `src/app/(app)/home/circle-home-client.tsx` hoặc `src/components/ui/fab.tsx` → navigate đến `/new-request`

4. Success toast: sau submit thành công → navigate về `/home` với toast "Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay."

5. Error toast: "Gửi không được. Kiểm tra mạng và thử lại." — form giữ nguyên data

**Files cần đọc:**
- `docs/02-design/screen-specs/post-request-screen.md` — layout đầy đủ
- `docs/02-design/design-system.md` — CSS classes (`fc-cat-tile`, `fc-btn`, `fc-textarea`, `fc-input`)
- `src/app/(app)/home/circle-home-client.tsx` — FAB wiring
- `src/components/ui/fab.tsx`

### @tester

**Nhiệm vụ:**

1. Unit tests cho `newRequestSchema` — validation rules, edge cases

2. Unit tests cho `canSubmit` logic — tất cả combinations required/optional fields

3. Integration tests cho `createRequest` Server Action — happy path + error paths

4. Verify `middleware.test.ts:154` fix pass sau khi @backend fix

5. Verify toàn bộ test suite pass (`npm run vitest run`)

**Files cần đọc:**
- `docs/04-operations/sprint-4-test-plan.md` — test cases chi tiết
- `src/__tests__/` — convention từ Sprint 1-3

---

## File Paths Expected

### Files mới cần tạo

```
src/app/(app)/new-request/page.tsx
src/components/features/new-request-form.tsx
src/__tests__/schemas/new-request.test.ts
src/__tests__/actions/create-request.test.ts
```

### Files cần update

```
src/lib/schemas/requests.ts          -- thêm newRequestSchema
src/app/actions/requests.ts          -- thêm createRequest
src/middleware.ts                    -- fix redirect /circle → /home
src/app/globals.css                  -- styles mới nếu cần (CategoryTile)
src/components/ui/fab.tsx            -- wire navigate → /new-request
```

---

## Forbidden Patterns — Lưu ý Sprint 4

Từ `docs/00-foundation/constitution.md`:

- **Không** thêm bất kỳ counter hay column nào tracking "số lần post request" của user (vi phạm Nguyên tắc 2 / D-004)
- **Không** hiển thị "bạn đã nhờ N lần" hay bất kỳ aggregate count nào
- **Không** thêm confirmation dialog "Bạn có chắc muốn gửi?" — vi phạm Nguyên tắc 3 (tôn trọng thể diện)
- **Không** tự động bật urgent hay cảnh báo "bạn dùng urgent nhiều" — vi phạm Nguyên tắc 4
- **Không** public route cho request — vòng kín (Nguyên tắc 9)
- **Không** `ledger`, `helps_given_count`, `reputation_score`, hoặc bất kỳ field đo đếm nào

---

## Risks và Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Category enum mismatch giữa Zod và DB CHECK constraint | Medium | High | @backend phải align với `aid_requests` CHECK: `('pickup', 'borrow', 'childcare', 'ride', 'other')` — Sprint 3 đã có bug tương tự với `ride` vs `dropoff`, cần verify lại |
| 30-second test fail vì realtime lag | Low | Medium | Realtime từ Sprint 3 đã hoạt động; test trên mobile Chrome thực tế (không phải desktop emulator) |
| Middleware fix gây regression cho Sprint 1-3 tests | Low | High | @tester verify toàn bộ 149 tests vẫn pass sau fix |
| Form state không reset khi navigate back rồi vào lại | Low | Low | Verify bằng navigation test; acceptable nếu state giữ (user context) |

---

## Definition of Done

- [ ] Tất cả 13 Acceptance Criteria đã met
- [ ] `vitest run` — tất cả tests pass (bao gồm fix `middleware.test.ts:154`)
- [ ] `npm run build` pass, không TypeScript error
- [ ] 30-second test pass trên mobile Chrome thật (không emulator)
- [ ] Reviewer Agent APPROVED ✅
- [ ] Deployed lên Vercel preview
- [ ] User (founder) confirm không có blocking bug trên device

---

## Test Plan Reference

Chi tiết test cases: `docs/04-operations/sprint-4-test-plan.md`

---

## Files Cần Đọc Trước Khi Làm Sprint

| Agent | Files bắt buộc đọc |
|---|---|
| @backend | `docs/03-technical/api-contract.md`, `docs/03-technical/data-model.md`, `src/app/actions/requests.ts`, `src/middleware.ts` |
| @frontend | `docs/02-design/screen-specs/post-request-screen.md`, `docs/02-design/design-system.md`, `src/app/(app)/home/circle-home-client.tsx` |
| @tester | `docs/04-operations/sprint-4-test-plan.md`, `src/__tests__/` (Sprint 1-3 conventions) |
| All | `docs/00-foundation/constitution.md`, `docs/00-foundation/decision-log.md` (D-032, D-033) |
