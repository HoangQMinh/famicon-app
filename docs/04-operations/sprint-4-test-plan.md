---
title: Sprint 4 Test Plan — New Request
sprint: 4
last_updated: 2026-05-17
spec_ref: docs/04-operations/sprint-4-spec.md
strategy_ref: docs/03-technical/test-strategy.md
---

# Sprint 4 Test Plan — New Request

> Tham chiếu: `sprint-4-spec.md`, `docs/03-technical/test-strategy.md`
> Primary device targets: mobile Chrome (Android) + mobile Safari (iOS)
> Pass threshold: tất cả TC phải PASS trước khi mark sprint DONE

---

## Test Data Setup

Trước khi chạy tests, cần có seed data sau:

```
User A (requester):
  - email: test-requester@example.com
  - profile: { display_name: "Nguyễn Linh", location: "Yokohama" }
  - circle_member: is_active = true trong circle_id = TEST_CIRCLE_ID

User B (member, không phải requester):
  - email: test-member@example.com
  - profile: { display_name: "Trần Mai" }
  - circle_member: is_active = true trong TEST_CIRCLE_ID

User C (outsider):
  - email: test-outsider@example.com
  - profile: { display_name: "Phạm Cường" }
  - KHÔNG có circle_members record cho TEST_CIRCLE_ID

Circle:
  - id: TEST_CIRCLE_ID
  - name: "Vòng Yokohama Test"
```

---

## TC-4.1 — Schema / Validation: `newRequestSchema`

**Phạm vi:** Unit test — `src/__tests__/schemas/new-request.test.ts`

### TC-4.1.1 — Happy path: input hợp lệ

```
Given: input đầy đủ {
  circle_id: valid UUID,
  category: "pickup",
  description: "Đón con từ trường Sakura lúc 5pm",
  scheduled_at: "Hôm nay 5pm",
  location: "Ga Yokohama",
  is_urgent: false
}
When: parse qua newRequestSchema
Then: success = true, data trả về đúng shape
```

### TC-4.1.2 — Category enum: tất cả 5 giá trị hợp lệ

```
Given: category lần lượt = "pickup", "borrow", "childcare", "ride", "other"
When: parse
Then: tất cả 5 cases PASS
```

### TC-4.1.3 — Category enum: giá trị không hợp lệ bị reject

```
Given: category = "dropoff" (enum cũ, đã bị loại bỏ Sprint 3)
When: parse
Then: success = false, error chứa "category"
```

```
Given: category = "" (rỗng)
When: parse
Then: success = false
```

### TC-4.1.4 — Description: min length 5

```
Given: description = "abc" (4 chars)
When: parse
Then: success = false, error chứa "description"
```

```
Given: description = "abcde" (5 chars)
When: parse
Then: success = true
```

### TC-4.1.5 — Description: max length 200

```
Given: description = string 201 chars
When: parse
Then: success = false
```

```
Given: description = string 200 chars
When: parse
Then: success = true
```

### TC-4.1.6 — Description: chỉ whitespace bị reject

```
Given: description = "     " (5 spaces)
When: parse (với z.string().min(5).trim() nếu áp dụng, hoặc check ở canSubmit)
Then: canSubmit = false (description.trim().length === 0)
Note: Nếu Zod không strip whitespace thì test canSubmit logic riêng
```

### TC-4.1.7 — scheduled_at: không được rỗng

```
Given: scheduled_at = ""
When: parse
Then: success = false
```

### TC-4.1.8 — location: không được rỗng

```
Given: location = ""
When: parse
Then: success = false
```

### TC-4.1.9 — circle_id: phải là UUID hợp lệ

```
Given: circle_id = "not-a-uuid"
When: parse
Then: success = false
```

### TC-4.1.10 — is_urgent: mặc định false

```
Given: input không có is_urgent field
When: parse (nếu có default)
Then: is_urgent = false
```

---

## TC-4.2 — Unit: `canSubmit` Logic

**Phạm vi:** Unit test cho form component logic — `src/__tests__/schemas/new-request.test.ts` hoặc component test

**Công thức:** `canSubmit = !!cat && detail.trim().length > 0 && when.length > 0 && place.length > 0`

### TC-4.2.1 — Đủ 4 fields → canSubmit = true

```
Given: cat="pickup", detail="Đón con lúc 5pm", when="Hôm nay 5pm", place="Ga Yokohama"
Then: canSubmit = true
```

### TC-4.2.2 — Thiếu category → canSubmit = false

```
Given: cat=null, detail="...", when="...", place="..."
Then: canSubmit = false
```

### TC-4.2.3 — Thiếu description → canSubmit = false

```
Given: cat="pickup", detail="", when="...", place="..."
Then: canSubmit = false
```

### TC-4.2.4 — Description chỉ whitespace → canSubmit = false

```
Given: cat="pickup", detail="   ", when="...", place="..."
Then: canSubmit = false (vì detail.trim().length === 0)
```

### TC-4.2.5 — Thiếu scheduled_at → canSubmit = false

```
Given: cat="pickup", detail="...", when="", place="..."
Then: canSubmit = false
```

### TC-4.2.6 — Thiếu location → canSubmit = false

```
Given: cat="pickup", detail="...", when="...", place=""
Then: canSubmit = false
```

### TC-4.2.7 — is_urgent KHÔNG ảnh hưởng canSubmit

```
Given: đủ 4 fields, is_urgent = false (mặc định)
Then: canSubmit = true
Given: đủ 4 fields, is_urgent = true
Then: canSubmit = true
```

---

## TC-4.3 — Integration: `createRequest` Server Action

**Phạm vi:** Integration test — `src/__tests__/actions/create-request.test.ts`
**Mock:** Supabase client (tương tự convention Sprint 1-3)

### TC-4.3.1 — Happy path: tạo request thành công

```
Given: User A đã auth, là member của TEST_CIRCLE_ID
  input hợp lệ: { circle_id: TEST_CIRCLE_ID, category: "pickup", description: "Đón con", scheduled_at: "5pm", location: "Ga Yokohama", is_urgent: false }
When: createRequest(input)
Then:
  - success = true
  - data.request_id là UUID hợp lệ
  - DB: record mới trong aid_requests với status = "open"
```

### TC-4.3.2 — Auth guard: unauthenticated user bị reject

```
Given: không có session (user chưa login)
When: createRequest(input)
Then:
  - success = false
  - error = "Chưa đăng nhập" hoặc tương đương
  - code = "UNAUTHORIZED"
```

### TC-4.3.3 — Member check: user không trong vòng bị reject

```
Given: User C (outsider) đã auth nhưng không phải member của TEST_CIRCLE_ID
When: createRequest({ circle_id: TEST_CIRCLE_ID, ...valid input })
Then:
  - success = false
  - error chứa "không phải thành viên" hoặc tương đương
  - code = "NOT_MEMBER" hoặc "FORBIDDEN"
```

### TC-4.3.4 — Validation error: description quá ngắn

```
Given: User A đã auth, member của circle
  description = "abc" (< 5 chars)
When: createRequest(...)
Then:
  - success = false
  - code = "VALIDATION_ERROR"
```

### TC-4.3.5 — Duplicate prevention: double submit

```
Given: User A submit 2 lần với cùng input gần như đồng thời
When: 2 calls đến createRequest
Then: chỉ 1 record được tạo (idempotency hoặc button disable trên client)
Note: Test button disabled state ở TC-4.5.4
```

### TC-4.3.6 — is_urgent = true được lưu đúng

```
Given: User A, input hợp lệ với is_urgent = true
When: createRequest(input)
Then:
  - success = true
  - DB record: is_urgent = true
```

---

## TC-4.4 — RLS Boundaries: `aid_requests` Table

**Phạm vi:** RLS boundary tests (Supabase local dev hoặc mock RLS logic)

### TC-4.4.1 — Member của vòng READ được requests của vòng mình

```
Given: User B là member của TEST_CIRCLE_ID
When: SELECT * FROM aid_requests WHERE circle_id = TEST_CIRCLE_ID
Then: trả về tất cả open requests của TEST_CIRCLE_ID
```

### TC-4.4.2 — User ngoài vòng KHÔNG READ được requests của vòng khác

```
Given: User C KHÔNG phải member của TEST_CIRCLE_ID
When: SELECT * FROM aid_requests WHERE circle_id = TEST_CIRCLE_ID
Then: trả về 0 rows (RLS block)
```

### TC-4.4.3 — Member của vòng INSERT được (qua Server Action)

```
Given: User A là member của TEST_CIRCLE_ID
When: INSERT INTO aid_requests (circle_id = TEST_CIRCLE_ID, ...)
Then: INSERT thành công
```

### TC-4.4.4 — User ngoài vòng KHÔNG INSERT được

```
Given: User C KHÔNG phải member
When: INSERT INTO aid_requests (circle_id = TEST_CIRCLE_ID, ...)
Then: INSERT bị block bởi RLS (permission denied hoặc 0 rows affected)
```

### TC-4.4.5 — Requester UPDATE được request của mình (cancel/close)

```
Given: User A là requester của request R1
When: UPDATE aid_requests SET status = 'cancelled' WHERE id = R1
Then: UPDATE thành công
```

### TC-4.4.6 — Non-requester KHÔNG UPDATE được request của người khác

```
Given: User B là member nhưng KHÔNG phải requester của request R1 (do User A tạo)
When: UPDATE aid_requests SET status = 'cancelled' WHERE id = R1
Then: UPDATE bị block
```

---

## TC-4.5 — E2E Flow 2: New Request (FAB → Request Appear on Feed)

**Phạm vi:** E2E manual test + Playwright (Sprint 9) hoặc checklist manual Sprint 4
**Device targets:** Mobile Chrome (Android) + Mobile Safari (iOS)
**Precondition:** User A đã login, đang ở màn hình Home (`/home`)

### TC-4.5.1 — Happy path: từ FAB đến feed trong 30 giây

```
Given: User A đang ở Home, đã login, là member của circle có ≥1 member khác
When:
  1. Tap FAB (+)
  2. Form mở tại /new-request, pickup pre-selected
  3. Tap "Trông con" (đổi category)
  4. Nhập description: "Trông bé Minh lúc chiều nay"
  5. Nhập scheduled_at: "Hôm nay 3pm"
  6. Nhập location: "Ga Sakuragi-cho"
  7. Giữ is_urgent = "Không" (mặc định)
  8. Tap "Gửi nhờ giúp"
Then:
  - Timestamp toàn bộ flow ≤ 30 giây
  - Redirect về /home
  - Toast "Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay." hiện ra
  - Request mới xuất hiện đầu feed (realtime update từ Sprint 3)
Pass: tất cả steps ✓, time ≤ 30 giây
Fail: bất kỳ step nào fail hoặc time > 30 giây
```

### TC-4.5.2 — Category selection: tap đổi category, selected state cập nhật

```
Given: Form mở (pickup pre-selected)
When: Tap "Trông con" (childcare)
Then: 
  - "Trông con" tile có class fc-cat-tile--selected (coral border)
  - "Đón con" không còn selected
```

### TC-4.5.3 — Submit button disabled state

```
Given: Form mới mở (chỉ pickup pre-selected, 3 fields kia rỗng)
Then: Submit button disabled, không thể tap
When: Điền description, scheduled_at, location
Then: Submit button enabled
```

### TC-4.5.4 — Button disabled during submit (prevent double submit)

```
Given: Form đủ fields, user tap "Gửi nhờ giúp"
When: Request đang được gửi (loading state)
Then:
  - Button hiển thị loading state (spinner hoặc text "Đang gửi...")
  - Button disabled (tap thêm không tạo thêm request)
```

### TC-4.5.5 — Error path: network error

```
Given: Form đủ fields
When: Network offline, tap submit
Then:
  - Toast error: "Gửi không được. Kiểm tra mạng và thử lại."
  - Form giữ nguyên tất cả data đã điền (không reset)
  - Submit button re-enabled
```

### TC-4.5.6 — Back navigation: tap back về Home

```
Given: Form đang mở, user chưa submit
When: Tap back button (hoặc browser back)
Then: Navigate về /home, không có request mới trên feed
```

### TC-4.5.7 — Urgent flag: chọn "Có" rồi "Không"

```
Given: Form mở
When: Tap "Có" (urgent)
Then: "Có" button = fc-btn--primary, "Không" button = fc-btn--secondary
When: Tap "Không"
Then: "Không" button = fc-btn--primary, "Có" button = fc-btn--secondary
```

### TC-4.5.8 — Description counter: N/200 cập nhật live

```
Given: Textarea description rỗng → counter hiển thị "0/200"
When: Nhập 50 chars
Then: Counter hiển thị "50/200"
When: Nhập đến 200 chars
Then: Không thể nhập thêm (maxLength=200 enforced)
```

---

## TC-4.6 — Pre-existing Failure Fix: `middleware.test.ts:154`

**Phạm vi:** Unit test fix — `src/__tests__/middleware.test.ts`
**Vấn đề gốc:** Test expect redirect đến `/circle` (cũ) nhưng middleware Sprint 3 đã update redirect target thành `/home`

### TC-4.6.1 — Redirect sau login → /home (không phải /circle)

```
Given: User đã authenticated
When: Access route protected, middleware runs
Then: Redirect target = "/home" (KHÔNG phải "/circle")
Test: middleware.test.ts:154 PASS
```

### TC-4.6.2 — Regression: các tests middleware.test.ts khác vẫn pass

```
Given: Fix line 154 (redirect target)
When: vitest run src/__tests__/middleware.test.ts
Then: TẤT CẢ tests trong file đó PASS (không chỉ line 154)
```

---

## TC-4.7 — Regression Check từ Sprint 1-3

Sau khi Sprint 4 code merge, verify các features cũ vẫn hoạt động:

| Feature | Check | Pass Criteria |
|---|---|---|
| Auth OTP flow | Login bằng email | OTP gửi được, verify thành công |
| Invite flow | Mở link `/join/[token]` | Join circle thành công |
| Circle Home feed | Load `/home` | Requests hiện đúng, realtime update |
| BottomNav | 3 tabs hiển thị | Navigate đúng giữa tabs |
| Middleware protection | Truy cập `/home` khi chưa login | Redirect về `/auth` |

**Command:** `vitest run` — tất cả tests phải PASS (bao gồm 149 tests từ Sprint 1-3 + tests mới Sprint 4)

---

## Pass/Fail Criteria Tổng Thể

| Criterion | Metric |
|---|---|
| Unit tests | 100% pass (`vitest run`) |
| Integration tests | 100% pass |
| RLS tests | 100% pass — không có RLS bypass |
| E2E Flow 2 (30-second test) | Time ≤ 30 giây trên mobile Chrome thật |
| middleware.test.ts:154 | PASS |
| TypeScript build | `npm run build` không có lỗi |
| Regression | Tất cả Sprint 1-3 tests vẫn PASS |
| Device compatibility | Mobile Chrome ✓ + Mobile Safari ✓ |

---

## Device Targets

| Device | Browser | Priority |
|---|---|---|
| Android phone (hoặc emulator) | Chrome mobile | PRIMARY |
| iPhone (hoặc iOS Simulator) | Safari mobile | PRIMARY |
| Desktop Chrome | Devtools mobile emulation | Secondary (không thay thế thật) |

Lưu ý: 30-second test **phải** chạy trên device thật hoặc emulator đúng OS — desktop emulation không đủ reliable để measure.

---

## Edge Cases Cần Chú Ý Đặc Biệt

| Edge Case | Lý do quan trọng |
|---|---|
| Category enum `ride` vs `dropoff` | Sprint 3 đã có bug này — verify enum trong Zod PHẢI khớp DB CHECK constraint |
| User submit khi session expire giữa chừng | Auth guard trong Server Action phải catch, trả UNAUTHORIZED |
| Description chỉ toàn whitespace | `detail.trim().length > 0` — không phải `detail.length > 0` |
| User navigate back rồi vào lại `/new-request` | State có thể giữ (React) — verify behavior, document nếu intentional |
| Circle với 0 members khác | Request vẫn được tạo thành công; thông báo sẽ không gửi đến ai (Sprint 5 handle) |

---

_Sprint 4 Test Plan | Tạo bởi Docs Steward Agent | 2026-05-17_
_Ref: sprint-4-spec.md | test-strategy.md | data-model.md_
