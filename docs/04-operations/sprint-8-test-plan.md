---
title: Sprint 8 Test Plan — Profile + Members
sprint: 8
phase: Phase 4 — Build MVP
created: 2026-05-19
ref: sprint-8-spec.md
---

# Sprint 8 Test Plan — Profile + Members

## Scope

Test plan cho Sprint 8: Profile page, Edit Profile (form + avatar upload), HelpTagsPicker, Members page, MemberRow, InviteCTA, BottomNav wiring, notification_logs migration fix.

**Không include** trong sprint này: Settings screen, chat icon LINE handoff, notification preferences.

---

## Test Data Setup

Trước khi chạy bất kỳ test nào, cần seed data sau:

```sql
-- User A: circle member đầy đủ thông tin
-- User B: circle member cùng vòng với A, có help_tags
-- User C: không có trong vòng nào (để test RLS isolation)
-- Circle X: có User A và User B là active members
-- Profiles: A có avatar_url, B chỉ có avatar_emoji, C có profile nhưng không có circle

-- Seed format (reference):
-- profiles: id, display_name, avatar_emoji, avatar_url, location, kids_desc, help_tags
-- circles: id, name, created_by = A
-- circle_members: circle_id = X, user_id = A, is_active = true
-- circle_members: circle_id = X, user_id = B, is_active = true
```

Với tests unit (mock Supabase client), seed data được inject qua mock return values — không cần real DB.

Với tests RLS (integration, real Supabase local), chạy `supabase db reset` + seed.sql trước.

---

## 1. Schema Unit Tests

**File:** `src/__tests__/schemas/profiles-update.test.ts`

### TC-S8.1 — profileUpdateSchema

| # | Test case | Input | Expected |
|---|---|---|---|
| 1 | Full valid update | `{ display_name: 'Lan Anh', location: 'Edogawa', kids_desc: 'Bé 3 tuổi', help_tags: ['pickup', 'childcare'] }` | Parse success |
| 2 | Partial update — chỉ display_name | `{ display_name: 'Lan Anh' }` | Parse success |
| 3 | Partial update — chỉ help_tags | `{ help_tags: ['other'] }` | Parse success |
| 4 | display_name quá ngắn (1 char) | `{ display_name: 'A' }` | Parse fail: "Tên phải có ít nhất 2 ký tự" |
| 5 | help_tags chứa giá trị không hợp lệ | `{ help_tags: ['pickup', 'cooking'] }` | Parse fail (invalid enum) |
| 6 | help_tags = [] (empty array) | `{ help_tags: [] }` | Parse success (0 tags là hợp lệ) |
| 7 | help_tags = tất cả 5 loại | `{ help_tags: ['pickup', 'childcare', 'ride', 'meal', 'other'] }` | Parse success |
| 8 | Payload rỗng `{}` | `{}` | Parse success (partial — action sẽ reject sau) |

### TC-S8.2 — avatarUploadSchema

| # | Test case | Input | Expected |
|---|---|---|---|
| 1 | Valid JPEG, 1MB | `{ file_size: 1024*1024, file_type: 'image/jpeg' }` | Parse success |
| 2 | Valid PNG, nhỏ | `{ file_size: 500, file_type: 'image/png' }` | Parse success |
| 3 | Valid WebP | `{ file_size: 800000, file_type: 'image/webp' }` | Parse success |
| 4 | Valid GIF | `{ file_size: 1000, file_type: 'image/gif' }` | Parse success |
| 5 | File quá lớn (2MB + 1 byte) | `{ file_size: 2*1024*1024 + 1, file_type: 'image/jpeg' }` | Parse fail |
| 6 | Invalid type (PDF) | `{ file_size: 100, file_type: 'application/pdf' }` | Parse fail |
| 7 | Invalid type (text) | `{ file_size: 100, file_type: 'text/plain' }` | Parse fail |
| 8 | Đúng 2MB (boundary) | `{ file_size: 2*1024*1024, file_type: 'image/jpeg' }` | Parse success |

### TC-S8.3 — membersQuerySchema

| # | Test case | Input | Expected |
|---|---|---|---|
| 1 | Valid UUID | `{ circleId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }` | Parse success |
| 2 | Non-UUID string | `{ circleId: 'not-a-uuid' }` | Parse fail |
| 3 | Empty string | `{ circleId: '' }` | Parse fail |

---

## 2. Action Unit Tests (Mocked Supabase)

### TC-A8.1 — `getMyProfile()`

**File:** `src/__tests__/actions/profiles-update.test.ts`

| # | Test case | Mock setup | Expected |
|---|---|---|---|
| 1 | Happy path | auth.getUser() → User A; profiles.select → full profile row | `{ success: true, data: { id, display_name, avatar_emoji, avatar_url, location, kids_desc, help_tags } }` |
| 2 | Unauthenticated | auth.getUser() → null | `{ success: false, error: 'Bạn cần đăng nhập.' }` |
| 3 | Profile không tìm thấy | auth.getUser() → User A; profiles.select → null | `{ success: false, error: 'Không tìm thấy hồ sơ. Vui lòng thử lại.' }` |
| 4 | Response không chứa line_user_id | auth.getUser() → User A; profiles row có line_user_id | Verify: `data.line_user_id === undefined` |

### TC-A8.2 — `updateProfile()`

| # | Test case | Mock setup | Expected |
|---|---|---|---|
| 1 | Happy path — display_name | auth → User A; profiles.update → success | `{ success: true, data: { updated: true } }` |
| 2 | Happy path — help_tags | auth → User A; data = `{ help_tags: ['pickup', 'meal'] }` | `{ success: true, data: { updated: true } }` |
| 3 | Unauthenticated | auth → null | `{ success: false, error: 'Bạn cần đăng nhập.' }` |
| 4 | Empty payload | auth → User A; data = `{}` | `{ success: false, error: 'Không có thông tin nào được cập nhật.' }` |
| 5 | DB update fail | auth → User A; profiles.update → error | `{ success: false, error: 'Không thể cập nhật hồ sơ. Vui lòng thử lại.' }` |

### TC-A8.3 — `uploadAvatar()`

| # | Test case | Mock setup | Expected |
|---|---|---|---|
| 1 | Happy path | auth → User A; storage.upload → success; getPublicUrl → URL; profiles.update → success | `{ success: true, data: { avatar_url: 'https://...' } }` |
| 2 | Unauthenticated | auth → null | `{ success: false, error: 'Bạn cần đăng nhập.' }` |
| 3 | File quá lớn | File mock: size = 3MB | `{ success: false, error: 'File quá lớn. Vui lòng chọn ảnh dưới 2MB.' }` |
| 4 | Invalid file type | File mock: type = 'application/pdf' | `{ success: false, error: 'Định dạng file không được hỗ trợ.' }` |
| 5 | Storage upload fail | auth → User A; storage.upload → error | `{ success: false, error: 'Không thể tải ảnh lên. Vui lòng thử lại.' }` |
| 6 | Upload path đúng | auth → User A; storage.upload called | Verify: upload path = `'{user.id}/avatar.webp'`, không phải path khác |
| 7 | upsert: true | storage.upload called | Verify: option `{ upsert: true }` được pass (overwrite cũ) |

### TC-A8.4 — `getCircleMembers()`

**File:** `src/__tests__/actions/members.test.ts`

| # | Test case | Mock setup | Expected |
|---|---|---|---|
| 1 | Happy path | auth → User A; circle_members+profiles → [A, B]; circles.name → "Vòng Edogawa" | `{ success: true, data: { members: [A, B], circle_name: 'Vòng Edogawa' } }` |
| 2 | Empty circle | auth → User A; circle_members → [A only] | `{ success: true, data: { members: [A], circle_name: '...' } }` |
| 3 | Unauthenticated | auth → null | `{ success: false, error: 'Bạn cần đăng nhập.' }` |
| 4 | User không phải member | auth → User C; RLS returns no rows | `{ success: false, error: 'Bạn không phải thành viên của vòng này.' }` |
| 5 | Response không chứa line_user_id | profiles rows có line_user_id | Verify: không có `line_user_id` trong bất kỳ member object nào trong response |
| 6 | Order by joined_at ASC | [B joined sau A] | Verify: A trước B trong array |
| 7 | is_active filter | có 1 inactive member | Verify: inactive member không có trong response |

---

## 3. RLS Integration Tests

**File:** `src/__tests__/rls/profiles.test.ts`

Chạy với Supabase local instance. Dùng service-role client để seed data; dùng anon client + `setSession(jwt)` để test từng user perspective.

### TC-RLS8.1 — profiles SELECT

| # | Test case | Given | When | Then |
|---|---|---|---|---|
| 1 | User xem profile của mình | User A authenticated; profile_A exists | SELECT profiles WHERE id = A.id | Returns 1 row |
| 2 | User xem profile của member cùng vòng | User A và User B cùng Circle X; profile_B exists | A authenticated; SELECT profiles WHERE id = B.id | Returns 1 row |
| 3 | User xem profile của người không cùng vòng | User A trong Circle X; User C không có circle | A authenticated; SELECT profiles WHERE id = C.id | Returns 0 rows (RLS enforced) |
| 4 | Unauthenticated không xem được profile | No auth | SELECT profiles | Returns 0 rows |

### TC-RLS8.2 — profiles UPDATE

| # | Test case | Given | When | Then |
|---|---|---|---|---|
| 1 | User update profile của mình | User A authenticated | UPDATE profiles SET display_name = 'New' WHERE id = A.id | rowCount = 1, success |
| 2 | User update profile của người khác | User A authenticated | UPDATE profiles SET display_name = 'Hacked' WHERE id = B.id | rowCount = 0 (RLS blocked) |
| 3 | User update help_tags của mình | User A authenticated | UPDATE profiles SET help_tags = '{pickup}' WHERE id = A.id | rowCount = 1, success |

### TC-RLS8.3 — circle_members SELECT (members list)

| # | Test case | Given | When | Then |
|---|---|---|---|---|
| 1 | Member xem danh sách circle của mình | User A trong Circle X | SELECT circle_members WHERE circle_id = X | Returns rows (A và B) |
| 2 | User không trong circle không xem được | User C không trong Circle X | SELECT circle_members WHERE circle_id = X | Returns 0 rows |

---

## 4. Notification Migration Regression Tests

**File:** `src/__tests__/actions/notification-type-fix.test.ts`

Mục đích: verify migration `20260519000001` đã fix CHECK constraint đúng.

| # | Test case | When | Then |
|---|---|---|---|
| 1 | INSERT type = 'join_request' | INSERT INTO notification_logs (type = 'join_request', ...) | Success, no constraint error |
| 2 | INSERT type = 'new_member' | INSERT INTO notification_logs (type = 'new_member', ...) | Success, no constraint error |
| 3 | INSERT type = 'new_request' | INSERT INTO notification_logs (type = 'new_request', ...) | Success (pre-existing type) |
| 4 | INSERT type = 'helper_confirmed' | INSERT INTO notification_logs (type = 'helper_confirmed', ...) | Success (pre-existing type) |
| 5 | INSERT type = 'invalid_xyz' | INSERT INTO notification_logs (type = 'invalid_xyz', ...) | Constraint error (23514) |

---

## 5. Component Tests

**File:** `src/__tests__/components/help-tags-picker.test.tsx`

Note: Nếu React Testing Library chưa được install trong Sprint 8, skip phần này và note trong Completion Report — defer sang Sprint 9.

| # | Test case | When | Then |
|---|---|---|---|
| 1 | Render 5 chip options | Render `<HelpTagsPicker value={[]} onChange={fn} />` | 5 chips hiển thị: "Đón con", "Trông con", "Chở đi", "Nấu ăn", "Khác" |
| 2 | Tap chip toggle ON | value = []; tap "Đón con" | onChange called với `['pickup']` |
| 3 | Tap chip toggle OFF | value = ['pickup']; tap "Đón con" | onChange called với `[]` |
| 4 | Multi-select 2 chips | tap "Đón con" + tap "Nấu ăn" | onChange called với `['pickup', 'meal']` |
| 5 | Selected chip có style khác | value = ['childcare'] | chip "Trông con" có class `fc-pill--selected` |

---

## 6. E2E Flow Tests (Manual — trên device thật)

Chạy thủ công sau khi Reviewer APPROVED và deploy lên Vercel preview.

**Target devices:** Mobile Chrome (Android) + Mobile Safari (iOS)

### E2E-8.1 — View Profile

**Given:** User đã đăng nhập, có profile đầy đủ
**Steps:**
1. Tap tab "Hồ sơ" trên BottomNav
2. Profile screen load

**Expected:**
- Avatar hiển thị (emoji hoặc ảnh)
- Tên, location, kids_desc hiển thị đúng
- help_tags chips hiển thị đúng
- Không có số lần giúp, không có badge
- BottomNav tab "Hồ sơ" active

### E2E-8.2 — Edit Profile

**Given:** User đang ở Profile screen
**Steps:**
1. Tap "Chỉnh sửa hồ sơ"
2. Sửa tên → "Nguyễn Test Edit"
3. Chọn help_tags: "Đón con" + "Trông con"
4. Tap Save

**Expected:**
- Modal đóng
- Profile screen hiển thị tên mới "Nguyễn Test Edit"
- 2 chips "Đón con" và "Trông con" hiển thị trong section "Có thể giúp"
- Reload page → data vẫn đúng (đã persist vào DB)

### E2E-8.3 — Avatar Upload

**Given:** User đang ở Edit Profile modal
**Steps:**
1. Tap "Đổi ảnh"
2. Chọn ảnh từ camera roll (JPEG, < 2MB)
3. Preview ảnh hiển thị
4. Tap Save

**Expected:**
- Avatar mới hiển thị trên Profile screen (không còn emoji)
- Reload page → avatar mới vẫn hiển thị

**Edge case — File quá lớn:**
1. Chọn ảnh > 2MB
2. Expected: toast lỗi "File quá lớn. Vui lòng chọn ảnh dưới 2MB."

### E2E-8.4 — View Members

**Given:** User đang ở Profile screen; vòng có ≥2 members
**Steps:**
1. Tap row "Thành viên vòng tròn"
2. Members screen load

**Expected:**
- Header: "Thành viên" + "N gia đình"
- InviteCTA dashed button ở đầu
- MemberRow cho từng member: avatar, tên, location, help_tags chips
- Không có contribution count trên bất kỳ row nào
- Back button → navigate về Profile

### E2E-8.5 — InviteCTA Flow

**Given:** User đang ở Members screen
**Steps:**
1. Tap "Mời thành viên mới" (InviteCTA)

**Expected:**
- Navigate sang `/invite` page (Sprint 2 invite flow)
- Invite flow hoạt động bình thường (regression check)

---

## 7. Regression Checks (từ Sprint trước)

Verify các features trước vẫn hoạt động sau Sprint 8:

| Feature | Check | Pass condition |
|---|---|---|
| Auth flow | Login bằng Email OTP | Login thành công, redirect `/home` |
| Onboarding | `/onboarding` → tạo profile | Profile tạo OK |
| Circle Home | `/home` hiển thị request list | Feed load, realtime hoạt động |
| New Request | FAB → tạo request | Request xuất hiện trên feed |
| Request Detail | Tap request → `/requests/[id]` | Detail load, "Tôi giúp được" hoạt động |
| BottomNav Home tab | Tap "Vòng của tôi" | Navigate `/home` |
| BottomNav Request tab | Tap "Nhờ giúp" | Navigate `/new-request` |
| Push notification | Subscribe flow | savePushSubscription action không bị break |

---

## Pass/Fail Criteria

Không dùng "hoạt động bình thường" — dùng criteria cụ thể:

| Criterion | Pass | Fail |
|---|---|---|
| Profile load time | < 1.5 giây trên 4G mobile | ≥ 1.5 giây liên tục trong 3 lần test |
| Edit profile save time | < 1 giây (không có avatar upload) | ≥ 1 giây |
| Avatar upload time | < 3 giây cho ảnh < 1MB | ≥ 3 giây |
| Members list load | < 1.5 giây với ≤ 20 members | ≥ 1.5 giây |
| Schema validation errors | 0 TypeScript errors khi `tsc --noEmit` | Bất kỳ type error nào |
| Vitest unit tests | 100% pass (0 fail mới) | Bất kỳ test mới nào fail |
| RLS violations | 0 unauthorized rows returned | Bất kỳ unauthorized data nào |
| `line_user_id` leak | Không có trong bất kỳ response nào | Có trong response |

---

## Devices Target

| Device | Browser | Priority |
|---|---|---|
| Android (Chrome mobile) | Chrome latest | Primary |
| iPhone (Safari iOS) | Safari latest | Primary |
| Desktop Chrome | Chrome latest | Secondary (responsive check) |

---

## Notes cho Reviewer

1. **RLS `profiles_select_same_circle`** — policy này critical vì Members screen dựa trên nó. Nếu policy không đúng, user có thể thấy profiles của người ngoài vòng. Cần double-check SQL condition.

2. **`uploadAvatar` path hardcoding** — path phải là `{user.id}/avatar.webp` không phải giá trị từ client. Verify trong Server Action rằng `user.id` lấy từ `auth.getUser()` trên server, không phải từ request body.

3. **`getCircleMembers` không return `line_user_id`** — cần explicit check rằng SELECT query không include `line_user_id` column.

4. **`notification_logs` migration** — Verify tên constraint hiện tại trước khi DROP. Nếu tên constraint khác `notification_logs_type_check`, migration cần cập nhật.

5. **Component tests** — Nếu React Testing Library chưa có, skip TC-5.x và note rõ trong Completion Report. Không block Reviewer approval nếu lý do hợp lệ.

---

*Tạo: 2026-05-19 | Sprint 8 — Phase 4 Build MVP*
*Ref: sprint-8-spec.md | profile-screen.md | members-screen.md | test-strategy.md | constitution.md*
