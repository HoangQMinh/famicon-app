---
title: Sprint 7 Test Plan — Request Detail + Help Offer
sprint: 7
phase: Phase 4 — Build MVP
created: 2026-05-18
---

# Sprint 7 Test Plan — Request Detail + Help Offer

## Test Strategy

Sprint 7 tập trung vào 3 luồng chính cần được test kỹ: (1) xem detail request, (2) tạo offer và hand-off LINE, (3) accept offer và re-notify khi cancel. Mỗi luồng có happy path + edge cases. RLS boundaries cho `help_offers` là critical — user ngoài circle không được đọc hay tạo offer.

Layer tests:
- **Unit:** Zod schemas + pure Server Action logic (mock Supabase)
- **RLS integration:** Giả lập 2 users, verify isolation giữa circles
- **Component:** React component states (open / matched / expired / cancelled)
- **E2E (manual trên device):** Happy path end-to-end trên Chrome mobile + Safari iOS

---

## Test Data Setup

Cần seed data sau trước khi chạy tests:

```
Circle A: "Yokohama Circle"
  - User A (requester): profile với line_user_id = "U123456"
  - User B (helper): profile, circle member
  - User C (outsider): profile, KHÔNG phải circle member

Aid Request R1: circle_id = Circle A, requester_id = User A, status = 'open', category = 'pickup'
Aid Request R2: circle_id = Circle A, requester_id = User A, status = 'matched' (đã có offer)
Aid Request R3: circle_id = Circle A, requester_id = User A, status = 'cancelled'
```

Seed script: thêm vào `supabase/seed.sql` hoặc test setup file `src/__tests__/setup/sprint7.ts`.

---

## Unit Tests

### Schema Tests — `src/__tests__/schemas/offers.test.ts`

| Test ID | Mô tả | Input | Expected |
|---|---|---|---|
| S7-SCH-01 | `offerCreateSchema` valid | `{ requestId: "uuid-v4" }` | parse thành công |
| S7-SCH-02 | `offerCreateSchema` empty string | `{ requestId: "" }` | ZodError |
| S7-SCH-03 | `offerCreateSchema` non-UUID | `{ requestId: "not-uuid" }` | ZodError |
| S7-SCH-04 | `offerAcceptSchema` valid | `{ offerId: "uuid-v4" }` | parse thành công |
| S7-SCH-05 | `offerAcceptSchema` missing field | `{}` | ZodError |
| S7-SCH-06 | `requestDetailSchema` valid object | full RequestDetail object | parse thành công |
| S7-SCH-07 | `requestDetailSchema` missing required fields | object thiếu `category` | ZodError |

Pass/fail criteria: Tất cả 7 tests pass. Zero ZodError khi input hợp lệ.

### Action Tests — `src/__tests__/actions/offers.test.ts`

**Setup:** Mock Supabase client. Không gọi DB thật.

#### `createOffer`

| Test ID | Scenario | Setup | Expected |
|---|---|---|---|
| S7-ACT-01 | Happy path | User B authenticated, R1 open, không có offer trước đó | `{ success: true, data: { offer_id: "...", line_handoff_url: "https://line.me/ti/p/~U123456" } }` |
| S7-ACT-02 | Requester có line_user_id | User A có `line_user_id = "U123456"` | URL chứa `"U123456"` |
| S7-ACT-03 | Requester không có line_user_id | User A có `line_user_id = null` | URL fallback = `"https://line.me/R/"` |
| S7-ACT-04 | Duplicate offer | User B đã offer R1 trước đó | `{ success: false, error: "Bạn đã đề nghị giúp request này rồi." }` |
| S7-ACT-05 | Request không open | R2 status = 'matched' | `{ success: false, error: "Request đã được match rồi." }` |
| S7-ACT-06 | Unauthenticated | Không có session | `{ success: false, error: "Bạn chưa đăng nhập.", code: "UNAUTHORIZED" }` |
| S7-ACT-07 | Pre-filled message | Any valid request | `line_handoff_url` chứa encoded message text |

#### `acceptOffer`

| Test ID | Scenario | Setup | Expected |
|---|---|---|---|
| S7-ACT-08 | Happy path | User A (requester) accept offer của User B | `{ success: true, data: { accepted: true } }`, request status → `'matched'` |
| S7-ACT-09 | Other offers declined | R1 có 2 offers từ B và C, User A accept offer của B | Offer của C → `status = 'declined'` |
| S7-ACT-10 | Wrong user | User B (helper, không phải requester) gọi acceptOffer | `{ success: false, error: "Chỉ người nhờ mới có thể chấp nhận offer." }` |
| S7-ACT-11 | Notify helper | Accept thành công | Fire-and-forget notify stub được gọi 1 lần với type `'helper_confirmed'` |

#### `cancelRequest`

| Test ID | Scenario | Setup | Expected |
|---|---|---|---|
| S7-ACT-12 | Happy path open | User A cancel R1 (status open) | `{ success: true, data: { cancelled: true } }`, status → `'cancelled'` |
| S7-ACT-13 | Cancel khi matched — re-notify (D-033) | R2 status matched, User A cancel | Status → `'cancelled'`, re-notify stub gọi 1 lần |
| S7-ACT-14 | Wrong user | User B cancel request của User A | `{ success: false, error: "Không thể cancel request này." }` |

#### `getRequestDetail`

| Test ID | Scenario | Setup | Expected |
|---|---|---|---|
| S7-ACT-15 | Happy path | User B (circle member) fetch R1 | Object đầy đủ: id, category, description, scheduled_at, location, is_urgent, status, requester_name |
| S7-ACT-16 | Không có `line_user_id` trong response | R1 fetch | Response không chứa field `line_user_id` |
| S7-ACT-17 | Request không tồn tại | requestId random | `{ success: false, error: ... }` |
| S7-ACT-18 | User không trong circle | User C fetch R1 | `{ success: false, error: ... }` (RLS enforced ở action layer) |

Pass/fail criteria: Tất cả 18 action tests pass. Response shape đúng với ActionResult<T> type.

---

## RLS Integration Tests — `src/__tests__/rls/help-offers.test.ts`

Dùng Supabase client với JWT của từng user thật (local Supabase hoặc test project).

| Test ID | Test Case | User | Action | Expected |
|---|---|---|---|---|
| S7-RLS-01 | Helper đọc offer của mình | User B | SELECT help_offers WHERE helper_id = B.id | Returns 1 row |
| S7-RLS-02 | Helper không đọc offer của người khác | User B | SELECT help_offers WHERE helper_id = C.id | Returns 0 rows |
| S7-RLS-03 | Requester đọc tất cả offers cho request của mình | User A | SELECT help_offers WHERE request_id = R1.id | Returns tất cả offers |
| S7-RLS-04 | User ngoài circle không đọc được offer | User C | SELECT help_offers WHERE request_id = R1.id | Returns 0 rows |
| S7-RLS-05 | Circle member insert offer hợp lệ | User B | INSERT help_offers cho R1 | Success |
| S7-RLS-06 | User ngoài circle không insert được offer | User C | INSERT help_offers cho R1 | RLS rejected |
| S7-RLS-07 | Insert offer khi request không open | User B | INSERT help_offers cho R2 (matched) | RLS rejected (policy check `ar.status = 'open'`) |
| S7-RLS-08 | `aid_requests` RLS: outsider không đọc | User C | SELECT aid_requests WHERE circle_id = CircleA.id | Returns 0 rows |

Pass/fail criteria: Tất cả 8 RLS tests pass. Không có false positive (user ngoài circle truy cập được). Response time < 500ms mỗi query.

---

## Component Tests — `src/__tests__/components/request-detail.test.tsx`

Dùng React Testing Library.

| Test ID | State | Expected render | Interaction |
|---|---|---|---|
| S7-CMP-01 | `status = 'open'` | Button "Tôi giúp được — Nhắn tin" enabled, không disabled | — |
| S7-CMP-02 | `status = 'matched'` | Button disabled, text "Đã có người giúp" | — |
| S7-CMP-03 | `status = 'matched'` | Không render tên helper | — |
| S7-CMP-04 | `status = 'cancelled'` | Button disabled, text "Yêu cầu đã đóng" | — |
| S7-CMP-05 | `status = 'closed'` | Button disabled, text "Yêu cầu đã đóng" | — |
| S7-CMP-06 | `is_urgent = true` | UrgentPill render | — |
| S7-CMP-07 | `is_urgent = false` | UrgentPill không render | — |
| S7-CMP-08 | Tap "Tôi giúp được" | `createOffer` mock gọi 1 lần | Click button |
| S7-CMP-09 | Tap "Tôi giúp được" → success | `window.open` gọi với LINE URL | Click button, mock resolves |
| S7-CMP-10 | Tap "Tôi giúp được" → duplicate error | Toast error "Bạn đã đề nghị..." hiển thị | Click button, mock returns error |
| S7-CMP-11 | Tap "Không lần này" | `createOffer` KHÔNG được gọi | Click "Không lần này" |
| S7-CMP-12 | InfoBlock render đúng | 3 InfoBlocks: Thời gian, Địa điểm, Người nhờ | — |
| S7-CMP-13 | Desc không truncate | Full description render (không có "...") | — |
| S7-CMP-14 | Back button | `router.back()` gọi | Click back |

Pass/fail criteria: Tất cả 14 component tests pass. Không có warning PropTypes. Không có side effect leak (mock cleanup sau mỗi test).

---

## E2E Tests (Manual — Mobile Device)

### E2E Flow 3 — Help Offer (Happy Path)

**Device targets:** Mobile Chrome (Android) + Mobile Safari (iOS, Add to Home Screen)

**Given:** User B đã login, ở màn hình Circle Home, có ít nhất 1 request đang open của User A.

**Scenario 3.1 — Xem detail và offer giúp**

| Step | Action | Expected |
|---|---|---|
| 1 | Tap vào RequestCard trên Home | Navigate tới `/requests/[id]` |
| 2 | Màn hình load | Detail hiển thị: IconTile, category label, description đầy đủ (không truncate), Thời gian, Địa điểm, Người nhờ |
| 3 | Nếu request urgent | UrgentPill "Gấp" hiển thị |
| 4 | Tap "Tôi giúp được — Nhắn tin" | Toast "Đang chuyển sang LINE...", LINE app mở (hoặc LINE web) |
| 5 | Quay lại app | Không có crash, app vẫn ở trạng thái bình thường |

Pass: LINE mở được. Offer record tạo trong DB (verify trên Supabase Dashboard).

**Scenario 3.2 — Duplicate offer**

| Step | Action | Expected |
|---|---|---|
| 1 | Từ request đã offer ở Scenario 3.1 | — |
| 2 | Tap "Tôi giúp được — Nhắn tin" lần thứ 2 | Toast lỗi "Bạn đã đề nghị giúp request này rồi." — không mở LINE |

Pass: Không tạo record thứ hai trong DB. Toast lỗi hiển thị rõ ràng.

**Scenario 3.3 — Request đã matched**

| Step | Action | Expected |
|---|---|---|
| 1 | Mở request đã matched | Button "Đã có người giúp" disabled, không có tên helper |
| 2 | Không thể tap button | Không có phản hồi click |

Pass: Không thể submit offer. Không leak thông tin helper.

**Scenario 3.4 — "Không lần này"**

| Step | Action | Expected |
|---|---|---|
| 1 | Mở request detail | Button "Không lần này" hiển thị |
| 2 | Tap "Không lần này" | Card/button dismiss (local state), không gọi API |
| 3 | Refresh trang | Request vẫn hiển thị bình thường (dismiss không persist) |

Pass: Không có network request gọi sau khi tap "Không lần này". Verify bằng DevTools Network tab.

**Scenario 3.5 — Back navigation**

| Step | Action | Expected |
|---|---|---|
| 1 | Mở request detail | Header có back arrow |
| 2 | Tap back arrow | Navigate về Home, không có confirm dialog |
| 3 | Swipe back (iOS) | Navigate về Home |

Pass: Navigation fluent. Không có broken history state.

---

## Regression Check (Sprint 6 features)

Verify các features từ sprint trước vẫn hoạt động sau Sprint 7:

| Feature | Check | Pass condition |
|---|---|---|
| Circle Home feed | Request mới xuất hiện realtime | Feed update không cần refresh |
| New Request form | Tạo request mới | Submit success → redirect /home |
| Notifications | Web Push khi request mới | Notification xuất hiện (nếu đã grant permission) |
| Auth flow | Login/logout | Session persist qua page reload |
| Open Registration | `/register` flow | User không có invite vẫn register được |
| RequestCard navigation | Tap card → detail | Navigate tới `/requests/[id]` (sau khi Sprint 7 wire) |

Pass/fail criteria: Tất cả 6 regression checks pass. Không có broken existing flow.

---

## Acceptance Criteria — Sprint 7

### Performance

- Response time `getRequestDetail`: < 500ms (P95, local Supabase)
- `createOffer` end-to-end (từ tap button đến LINE mở): < 2 giây
- Page load `/requests/[id]`: < 1.5 giây trên 3G mobile (Lighthouse lab)

### Correctness

- Offer tạo đúng 1 record trong `help_offers` với `status = 'pending'`
- `acceptOffer` đúng: chỉ 1 offer `accepted`, các offer khác → `declined`, request → `matched`
- `cancelRequest` khi matched: re-notify gọi đúng 1 lần (D-033)
- LINE deeplink URL format đúng: `https://line.me/ti/p/~{lineId}` nếu có LINE ID

### Security / Constitution

- User ngoài circle: không đọc được request detail, không tạo được offer
- Không có `line_user_id` trong response của `getRequestDetail` (PII)
- Không hiển thị tên helper khi request matched (Nguyên tắc 3)
- Không hiện số người đã offer hay số lần request được giúp (Nguyên tắc 2)

### Error handling

- Duplicate offer: error message rõ ràng, không crash
- Unauthenticated: redirect /auth
- Network error khi load: error state + "Thử lại" button
- LINE không installed: fallback URL vẫn mở được (LINE web hoặc app store)

### Device targets

- Mobile Chrome (Android) — primary test
- Mobile Safari iOS (Add to Home Screen mode) — primary test
- Desktop Chrome — secondary (app responsive)

---

*Tạo: 2026-05-18 | Tham chiếu: sprint-7-spec.md | request-detail-screen.md | test-strategy.md | data-model.md*
