---
sprint: 3
type: test-plan
theme: Circle Home + Feed
date_planned: 2026-05-17
spec_ref: docs/04-operations/sprint-3-spec.md
test_strategy_ref: docs/03-technical/test-strategy.md
---

# Sprint 3 Test Plan — Circle Home + Feed

---

## Test Scope

Sprint 3 đưa vào: Circle Home page, Realtime feed, `RequestCard`, `TopHeader`, `BottomNav`, `FAB`, migration `user_discovery_settings`. Test plan phủ từ unit schema đến RLS boundary đến manual E2E.

---

## Test Data Setup

Trước khi chạy bất kỳ integration test nào, cần seed data sau trong local Supabase:

```
Circle A: "Vòng Edogawa - Kasai"
  - User Alpha: thành viên active (is_active = true)
  - User Beta:  thành viên active (is_active = true)
  - Aid Request R1: category='pickup', is_urgent=true, status='open', requester=Beta
  - Aid Request R2: category='borrow', is_urgent=false, status='open', requester=Beta
  - Aid Request R3: category='childcare', status='closed', requester=Beta  ← không được hiện

Circle B: "Vòng Osaka"
  - User Gamma: thành viên active (is_active = true)
  - Aid Request R4: status='open', requester=Gamma  ← không được hiện cho Alpha

User Delta: KHÔNG trong vòng nào  ← để test RLS rejection
```

---

## Unit Tests

### 1. Schema validation — `src/__tests__/schemas/requests.test.ts`

Nếu `src/lib/schemas/requests.ts` được tạo trong sprint này (để type-check display data):

**Test cases:**

| Test | Input | Expected |
|---|---|---|
| Valid aid_request category | `category: 'pickup'` | Pass |
| Invalid category | `category: 'shopping'` | Fail — invalid enum |
| Description quá ngắn | `description: 'ok'` (2 chars) | Fail — min 5 chars |
| is_urgent default | không có field | Default false |
| status hợp lệ | `status: 'open'` | Pass |
| status không hợp lệ | `status: 'active'` | Fail |

**Pass criteria:** Tất cả cases pass. Không có schema nào để hallucinate data.

---

### 2. Unit test — `RequestCard` rendering (nếu React Testing Library setup)

**Test: không có ledger/counter**

```
Given: RequestCard render với request bất kỳ
When:  inspect DOM
Then:  không tìm thấy text nào match regex /giúp \d+ lần|helped \d+|contribution|điểm|huy hiệu|badge/i
```

**Test: truncate description**

```
Given: req.description = "A".repeat(100)  (100 ký tự)
When:  RequestCard render
Then:  text trong DOM có length ≤ 83  (80 chars + "…")
```

**Test: UrgentPill chỉ hiện khi urgent**

```
Given: req.is_urgent = false
When:  RequestCard render
Then:  element với class "fc-pill--urgent" KHÔNG tồn tại trong DOM

Given: req.is_urgent = true
When:  RequestCard render
Then:  element với class "fc-pill--urgent" tồn tại, text = "[Gấp]"
```

---

## Integration Tests

### 3. RLS — `src/__tests__/actions/requests.test.ts`

File này là **bắt buộc**. Chạy với local Supabase (test environment).

#### 3.1 — `getCircleRequests` — Happy path

```
Given: User Alpha (thành viên Circle A) đã authenticated
When:  gọi getCircleRequests(circleId = Circle A)
Then:
  - success = true
  - data.length = 2  (R1 và R2 — chỉ status='open')
  - data[0].id = R1  (urgent trước)
  - data[1].id = R2
  - R3 (status='closed') KHÔNG có trong kết quả
  - Mỗi item có field requester_name (display_name của requester)
```

**Pass criteria:** Kết quả đúng thứ tự, closed request bị lọc ra.

#### 3.2 — `getCircleRequests` — RLS boundary: user ngoài vòng

```
Given: User Delta (không trong Circle A) authenticated
When:  gọi getCircleRequests(circleId = Circle A)
Then:
  - success = false
  - error message = 'Bạn không thuộc vòng tròn này.'
  - 'data' in result === false  (không có data leak)
```

**Pass criteria:** Explicit rejection, không leak data. Đây là test quan trọng nhất của sprint.

**Note:** Implementation trả `success=false` (explicit reject) thay vì `success=true` + empty array — behavior này an toàn hơn spec gốc vì explicit membership rejection xảy ra trước khi query DB (defense-in-depth pattern).

#### 3.3 — `getCircleRequests` — RLS boundary: cross-circle isolation

```
Given: User Alpha (thành viên Circle A, KHÔNG trong Circle B) authenticated
When:  gọi getCircleRequests(circleId = Circle B)
Then:
  - data.length = 0  (R4 của Circle B không visible)
```

#### 3.4 — `getCircleInfo` — Happy path

```
Given: User Alpha authenticated
When:  gọi getCircleInfo(circleId = Circle A)
Then:
  - success = true
  - data.name = "Vòng Edogawa - Kasai"
  - data.member_count = 2  (Alpha + Beta, cả 2 is_active = true)
```

#### 3.5 — `getCircleInfo` — Member count chỉ đếm active

```
Given: User Alpha authenticated
       Beta bị set is_active = false (simulate soft delete D-030)
When:  gọi getCircleInfo(circleId = Circle A)
Then:
  - data.member_count = 1  (chỉ Alpha)
```

**Pass criteria:** Soft deleted member không được đếm (D-028, D-030).

#### 3.6 — `getCircleRequests` — Unauthenticated

```
Given: Không có session (unauthenticated)
When:  gọi getCircleRequests(circleId = Circle A)
Then:
  - success = false
  - error = 'Chưa đăng nhập'
  - code = 'UNAUTHORIZED'
```

---

### 4. Migration — `user_discovery_settings`

#### 4.1 — Table tồn tại với schema đúng

```
Given: Migration 000006 đã apply
When:  inspect schema
Then:
  - Table user_discovery_settings tồn tại
  - Columns: user_id (uuid PK), is_visible (boolean, default false), radius_km (int, default 5), updated_at (timestamptz)
  - Constraint: radius_km IN (3, 5, 10)
  - FK: user_id references profiles(id) on delete cascade
```

#### 4.2 — RLS: user chỉ đọc settings của mình

```
Given: User Alpha authenticated
       Alpha có row trong user_discovery_settings
       Beta có row trong user_discovery_settings
When:  SELECT * FROM user_discovery_settings
Then:
  - Chỉ thấy row của Alpha (RLS apply)
  - Row của Beta KHÔNG visible
```

#### 4.3 — RLS: user không đọc settings của người khác

```
Given: User Alpha authenticated
When:  SELECT * FROM user_discovery_settings WHERE user_id = Beta.id
Then:  0 rows trả về
```

#### 4.4 — Default values đúng

```
Given: User mới insert vào user_discovery_settings
When:  chỉ cung cấp user_id
Then:
  - is_visible = false  (opt-in mặc định OFF — D-020)
  - radius_km = 5       (default D-031)
```

---

## E2E Flows — Manual Checklist

Playwright E2E đầy đủ sẽ build Sprint 9. Sprint 3 dùng manual checklist trên device thật.

**Target device:** Mobile Chrome (Android) + Mobile Safari (iOS). Không chấp nhận chỉ test desktop.

### Flow E2E-3A — Circle Home Load

```
Given: User đã đăng nhập (qua flow Sprint 1-2), là thành viên của 1 vòng, vòng có ≥1 open request

Step 1: Mở app → navigate /home
Then:
  - TopHeader hiện đúng tên vòng
  - Sub-title hiện "N gia đình" với N là số active members
  - Feed hiện request cards, urgent request ở đầu

Step 2: Inspect từng card
Then:
  - Mỗi card có: emoji category, title, description (truncated nếu >80 chars), scheduled_at, location, tên người đăng
  - KHÔNG có bất kỳ số đếm nào (số lần giúp, contribution score, v.v.)

Pass criteria: Tất cả steps pass mà không có bất kỳ console error nào
```

### Flow E2E-3B — Realtime Update

```
Given: User Alpha đang mở /home (tab 1 browser)
       User Beta đang ở màn hình đăng request (tab 2 hoặc device khác)

Step 1: Beta submit 1 request mới vào cùng vòng với Alpha

Then (quan sát tab của Alpha):
  - Trong vòng ≤ 3 giây, card của request mới xuất hiện ở đầu feed
  - Alpha KHÔNG cần refresh tay
  - KHÔNG có reload toàn bộ page

Pass criteria: Card xuất hiện tự động trong ≤ 3 giây
Metric: Nếu quá 3 giây → escalate (có thể Realtime subscription vấn đề)
```

### Flow E2E-3C — Empty State

```
Given: User là thành viên vòng chưa có open request nào

Step 1: Navigate /home
Then:
  - TopHeader hiện đúng
  - Không có request card nào
  - Text invitation-style hiện (không trống trơn)
  - FAB vẫn visible, có thể tap

Pass criteria: Không có crash, empty state thân thiện, FAB visible
```

### Flow E2E-3D — BottomNav Tabs

```
Given: User ở /home

Step 1: Inspect BottomNav
Then:
  - Thấy 3 tabs: "Vòng của tôi", "Nhờ giúp", "Hồ sơ"
  - Tab "Vòng của tôi" có trạng thái active (highlight)
  - KHÔNG có tab thứ 4 visible nào (Discovery slot ẩn)
  - KHÔNG có tooltip "Sắp có" hay bất kỳ hint về Discovery

Step 2: Tap "Nhờ giúp"
Then:
  - Navigate tới /requests/new (có thể 404 trong sprint này — OK)

Pass criteria: Discovery slot không visible, navigation hoạt động
```

### Flow E2E-3E — "Không lần này" Behavior

```
Given: User thấy 1 request card trong feed

Step 1: Tap "Không lần này"
Then:
  - KHÔNG có bất kỳ thông báo nào gửi đến requester (verify bằng cách check requester notification)
  - Card KHÔNG biến mất ngay lập tức (behavior quyết khi build — acceptable nếu card vẫn còn đó)
  - KHÔNG có DB insert nào vào bất kỳ table decline/skip tracking

Pass criteria: Không notify requester, không persist
```

### Flow E2E-3F — Reconnect sau Background (iOS-specific)

```
Given: User Alpha mở /home, Realtime subscription đang active (iOS Safari)

Step 1: Lock màn hình 30 giây → mở lại
Step 2: Beta đăng request mới trong thời gian lock màn hình

Then:
  - Sau khi Alpha unlock, trong ≤ 5 giây card mới xuất hiện

Pass criteria: Subscription reconnect thành công sau background
Note: Nếu fail → document bug, không block sprint nhưng flag cho Sprint 8 (PWA)
```

---

## Regression Check — Verify Sprint 1-2 vẫn hoạt động

Sau khi Sprint 3 code được merge, confirm các flow cũ không bị break:

| Flow | Check |
|---|---|
| Auth — email OTP | Login vẫn hoạt động, OTP verify đúng |
| Auth — invite gating | Email không trong invite bị block |
| Auth — rate limiting | 3 OTP requests / 10 min |
| Onboarding | Form create profile vẫn submit được |
| Invite — create link | Tạo invite link thành công |
| Invite — join via token | `/join/[token]` vẫn hoạt động (valid/expired/invalid states) |
| Middleware — route protection | `/home` redirect về `/auth` nếu chưa login |
| `npm run build` | Pass (no new TypeScript errors) |
| Vitest — 96 tests cũ | Tất cả 96 tests từ Sprint 1-2 vẫn pass |

---

## Acceptance Criteria — Pass/Fail Rõ Ràng

Không dùng "hoạt động bình thường". Metric cụ thể:

| Criterion | Pass | Fail |
|---|---|---|
| Realtime latency | Card mới xuất hiện ≤ 3 giây sau insert | > 3 giây hoặc cần refresh |
| RLS isolation | 0 requests leak sang user ngoài vòng | Bất kỳ row nào visible cho non-member |
| Ledger-free | 0 counter/badge/số lần giúp trên bất kỳ card nào | Bất kỳ text nào match "X lần", "helped N", badge |
| Discovery slot | 0 visible Discovery UI element | Bất kỳ Discovery tab/button/text nào user thấy được |
| Build | `npm run build` exit code 0 | Exit code ≠ 0 hoặc TypeScript error |
| Test suite | 96 (cũ) + tests mới, tất cả pass | Bất kỳ test nào fail |
| Mobile render | Không có horizontal scroll, layout đúng | Layout vỡ trên viewport 375px |
| "Không lần này" | 0 DB write, 0 notification gửi | Bất kỳ DB write hay notify nào |

---

## Checklist Reviewer (gửi kèm khi Reviewer audit)

- [ ] Kiểm tra DOM của BottomNav: Discovery slot có `aria-hidden="true"` và không visible
- [ ] Kiểm tra `RequestCard`: grep cho `count`, `times`, `helped`, `badge`, `contribution` trong component — phải 0 kết quả
- [ ] Kiểm tra `getCircleRequests`: query có `status = 'open'` filter không
- [ ] Kiểm tra Realtime cleanup: `useEffect` return có gọi `channel.unsubscribe()` không
- [ ] Kiểm tra "Không lần này" handler: không có Server Action call nào trong `onDecline`
- [ ] Kiểm tra migration: `is_visible` default = `false` (opt-in, không phải opt-out)
- [ ] RLS test 3.2 pass: user ngoài vòng → `success=false`, error='Bạn không thuộc vòng tròn này.', không có field `data`

---

*Tạo bởi Docs Steward Agent | 2026-05-17*
*Nguồn: `docs/04-operations/sprint-3-spec.md` | `docs/03-technical/test-strategy.md` | `docs/02-design/screen-specs/home-screen.md` | `docs/03-technical/data-model.md` (RLS policies) | `docs/00-foundation/constitution.md` (Nguyên tắc 2, 3)*
