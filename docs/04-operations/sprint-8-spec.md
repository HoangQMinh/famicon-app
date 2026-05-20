---
title: Sprint 8 Spec — Profile + Members
sprint: 8
phase: Phase 4 — Build MVP
created: 2026-05-19
status: DRAFT
---

# Sprint 8 — Profile + Members

## Goal

User có thể xem và chỉnh sửa hồ sơ của mình (avatar, tên, mô tả con, khu vực, khả năng giúp); xem danh sách thành viên trong vòng — để các thành viên biết nhau và biết ai có thể giúp gì.

## Dependencies

- Sprint 7 ✅ — `help_offers`, `aid_requests` complete, `updateProfile` action đã có tại `src/app/actions/profiles.ts`
- Sprint 0 ✅ — Supabase Storage bucket `avatars` đã setup
- Sprint 2 ✅ — `createProfile` / `updateProfile` Server Actions đã có
- Sprint 3 ✅ — `BottomNav` đã có, `TopHeader` đã có
- **Side-finding từ Sprint 7:** `notification_logs` CHECK constraint thiếu type `'join_request'` (D-038) — cần migration fix trong sprint này

Không có OQ nào deadline Sprint 8 — không bị block bởi open questions.

## Out of Scope

- Settings screen (notification preferences, ngôn ngữ, đăng xuất) — chưa spec, defer sang Sprint 9+
- Tap chat icon trên MemberRow → LINE handoff — OQ-007 còn OPEN về cách lấy LINE ID của member khác; sprint này render icon nhưng **disabled / no-op** với tooltip "Kết nối qua LINE sắp ra mắt"
- Notification settings per-type toggle — defer sang Sprint 9 (sau Polish)
- "Vòng sẽ hoạt động tốt hơn khi có thêm thành viên" tooltip trên InviteCTA — optional, chỉ implement nếu còn thời gian

## Tasks

### @schema

1. **Migration: fix `notification_logs` CHECK constraint** — Tạo migration mới `20260519000001_fix_notification_logs_type_check.sql`:
   ```sql
   ALTER TABLE notification_logs
     DROP CONSTRAINT IF EXISTS notification_logs_type_check;
   ALTER TABLE notification_logs
     ADD CONSTRAINT notification_logs_type_check
     CHECK (type IN ('new_request', 'urgent_request', 'helper_confirmed', 'join_request', 'new_member'));
   ```
   Verify: type `'join_request'` và `'new_member'` (từ D-038, Sprint 6) đã được thêm đúng. Confirm migration idempotent (DROP CONSTRAINT IF EXISTS trước khi ADD).

2. **Verify `profiles` RLS policies** — Đảm bảo 3 policies cần thiết cho sprint này đã tồn tại:
   - `profiles_select_same_circle`: user chỉ SELECT được profiles của members cùng vòng
   - `profiles_update_self`: user chỉ UPDATE được profile của mình (`auth.uid() = id`)
   - `profiles_select_self`: user SELECT được profile của mình (kể cả khi chưa có circle)

   Nếu thiếu policy nào → tạo migration bổ sung.

3. **Verify Supabase Storage RLS** — Bucket `avatars` cần có policy:
   - INSERT/UPDATE: `auth.uid()::text = (storage.foldername(name))[1]` (chỉ upload vào folder của mình)
   - SELECT: public (hoặc circle-member-only nếu đã setup)
   
   Không tạo bucket mới. Chỉ verify và document policy hiện tại.

### @backend

1. **`uploadAvatar(file: File)`** — Thêm vào `src/app/actions/profiles.ts`:
   - Auth guard → lấy `user.id`
   - Validate: file type phải là `image/jpeg`, `image/png`, `image/webp`, hoặc `image/gif` — reject nếu không hợp lệ
   - Validate: file size ≤ 2MB — trả error thân thiện nếu vượt
   - Upload path: `{user.id}/avatar.webp` (overwrite — chỉ 1 avatar/user)
   - Dùng `supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })`
   - Sau khi upload: lấy public URL bằng `getPublicUrl(path)`
   - UPDATE `profiles.avatar_url = publicUrl`
   - Return: `ActionResult<{ avatar_url: string }>`
   - Errors: `'Bạn cần đăng nhập.'`, `'File quá lớn. Vui lòng chọn ảnh dưới 2MB.'`, `'Định dạng file không được hỗ trợ.'`, `'Không thể tải ảnh lên. Vui lòng thử lại.'`

2. **`getMyProfile()`** — Thêm vào `src/app/actions/profiles.ts`:
   - Auth guard
   - SELECT `profiles` WHERE `id = user.id` — dùng anon client (RLS `profiles_select_self`)
   - Return: `ActionResult<ProfileData>` — bao gồm: `id`, `display_name`, `avatar_emoji`, `avatar_url`, `location`, `kids_desc`, `help_tags`
   - Error nếu không tìm thấy: `'Không tìm thấy hồ sơ. Vui lòng thử lại.'`

3. **`getCircleMembers(circleId: string)`** — Thêm vào file mới `src/app/actions/members.ts`:
   - Auth guard
   - Verify user là active member của `circleId` (RLS enforce nhưng verify thêm explicit)
   - SELECT `circle_members` JOIN `profiles` WHERE `circle_id = circleId AND is_active = true`
   - Return: `ActionResult<{ members: MemberProfile[]; circle_name: string }>`
   - `MemberProfile`: `{ id, display_name, avatar_emoji, avatar_url, location, kids_desc, help_tags }`
   - **Không return `line_user_id`** của bất kỳ member nào (privacy — Constitution Nguyên tắc 9)
   - Order: `joined_at ASC` (thứ tự join)
   - Error: `'Bạn không phải thành viên của vòng này.'`

4. **Zod schemas** — Thêm vào `src/lib/schemas/profiles.ts`:
   - `profileUpdateSchema` — đã có, **verify** có include `help_tags: z.array(z.string()).optional()` không — nếu chưa có, thêm vào
   - `avatarUploadSchema` — `{ file_size: z.number().max(2 * 1024 * 1024), file_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']) }` — dùng để validate metadata trước khi upload
   - `membersQuerySchema` — `{ circleId: z.string().uuid() }`

5. **Update `profileUpdateSchema`** — Đảm bảo `help_tags` field có trong schema:
   ```typescript
   help_tags: z.array(z.enum(['pickup', 'childcare', 'ride', 'meal', 'other'])).optional()
   ```
   5 loại aid align với `aid_requests.category` CHECK constraint.

### @frontend

1. **`src/app/(app)/profile/page.tsx`** — Server Component:
   - Gọi `getMyProfile()`
   - Nếu error → render `ProfileError` (text + retry button)
   - Loading: `loading.tsx` skeleton
   - Render `ProfileClient` với profile data + circleId
   - `circleId` lấy từ active membership của user (query `circle_members` WHERE `user_id = user.id AND is_active = true LIMIT 1`)

2. **`src/app/(app)/profile/loading.tsx`** — Skeleton:
   - Avatar placeholder (circle, 64px xám)
   - 3 text lines xám trong fc-card
   - 2 row buttons placeholder (Thành viên, Cài đặt)

3. **`src/app/(app)/profile/error.tsx`** — Error boundary:
   - Text: "Không tải được hồ sơ. Kiểm tra mạng và thử lại."
   - Button "Thử lại" (secondary)
   - BottomNav vẫn render

4. **`src/components/features/profile-client.tsx`** — Client Component:
   - Props: `{ profile: ProfileData; circleId: string }`
   - States:
     - `loaded`: render đầy đủ theo profile-screen.md
     - `incomplete` (display_name có nhưng kids_desc hoặc help_tags rỗng): hiện prompt nhỏ + button Edit dạng primary
   - Sections: Avatar + name + location | Con cái (kids_desc) | Có thể giúp (help_tags chips)
   - Button "Chỉnh sửa hồ sơ" → mở `EditProfileModal` (xem mục 6)
   - Row "Thành viên vòng tròn" → navigate `/circles/[circleId]/members`
   - Row "Cài đặt" → `console.log('settings TBD')` với visual state disabled (opacity 0.5) — chưa implement
   - BottomNav active = "profile"
   - **Không hiện** số lần đã giúp, số lần được giúp, bất kỳ counter nào (Constitution Nguyên tắc 2)
   - **Không hiện** badge admin hay founder (Constitution Nguyên tắc 7)

5. **`src/components/features/edit-profile-modal.tsx`** — Client Component (Modal/Sheet):
   - Trigger: Button "Chỉnh sửa hồ sơ" trên profile
   - Form fields:
     - **Avatar:** Button "Đổi ảnh" → input[type=file, accept="image/*"] → preview local → gọi `uploadAvatar` khi submit
     - **Tên hiển thị** (`display_name`): text input, required, min 2 chars
     - **Khu vực / Ga** (`location`): text input, optional
     - **Mô tả con** (`kids_desc`): textarea, optional, placeholder "Ví dụ: Bé gái 3 tuổi, bé trai 6 tuổi"
     - **Có thể giúp** (`help_tags`): HelpTagsPicker component (xem mục 7)
   - Submit: gọi `updateProfile(data)` — nếu cần upload avatar thì gọi `uploadAvatar` trước, lấy URL, rồi `updateProfile`
   - Sau save thành công: đóng modal, trigger reload profile data (revalidatePath hoặc router.refresh)
   - Error toast nếu submit fail
   - Cancel: đóng modal, không save

6. **`src/components/features/help-tags-picker.tsx`** — Client Component:
   - Props: `{ value: string[]; onChange: (tags: string[]) => void }`
   - 5 chip options: `'pickup'` → "Đón con", `'childcare'` → "Trông con", `'ride'` → "Chở đi", `'meal'` → "Nấu ăn", `'other'` → "Khác"
   - Multi-select: tap để toggle, selected = `fc-pill--selected` style
   - Không có minimum selection (0 tags = OK)
   - Không có maximum

7. **`src/app/(app)/circles/[id]/members/page.tsx`** — Server Component:
   - Gọi `getCircleMembers(params.id)`
   - Loading: `loading.tsx` skeleton (3-4 MemberRow placeholders)
   - Error state: text + retry button
   - Render `MembersClient` với members data

8. **`src/components/features/members-client.tsx`** — Client Component:
   - Props: `{ members: MemberProfile[]; circleId: string; currentUserId: string }`
   - Layout: TopHeader ("Thành viên", sub = "{N} gia đình", onBack → router.back)
   - InviteCTA dashed button ở đầu list → navigate `/invite`
   - [members.map] `MemberRow` cho mỗi member
   - Empty state (chỉ mình bạn): text "Vòng của bạn chưa có thành viên nào khác. Mời bạn bè và gia đình Việt xung quanh nhé!"
   - Không có BottomNav (screen này navigate từ Profile, exit = back)
   - **Không có row đặc biệt** cho admin hay founder (Constitution Nguyên tắc 7)

9. **`src/components/features/member-row.tsx`** — Client Component:
   - Props: `{ member: MemberProfile; isCurrentUser?: boolean }`
   - Layout: Avatar (emoji hoặc image) | name + location + kids_desc + help_tags chips | Chat icon (IconMsgCircle)
   - Chat icon: tap → no-op trong Sprint 8 (OQ-007 OPEN) — render nhưng disabled, `aria-disabled="true"`, `title="Kết nối qua LINE sắp ra mắt"`
   - `help_tags` chips: dùng lại `fc-pill` component
   - Avatar: nếu `avatar_url` có → render `<img>` với fallback emoji, nếu không → emoji trong `fc-avatar` circle
   - **Không hiện** contribution count, số lần giúp (Constitution Nguyên tắc 2)

10. **`src/components/features/invite-cta.tsx`** — Client Component:
    - Props: `{ onClick: () => void }`
    - Style: `fc-invite` (dashed border button)
    - Content: IconUserPlus + "Mời thành viên mới"
    - Tap → gọi `onClick` prop

11. **Wire BottomNav tab "Hồ sơ"** — Update `src/components/layout/bottom-nav.tsx`:
    - Tab "Hồ sơ" (hiện có placeholder): wire → `router.push('/profile')`
    - Verify active state khi ở `/profile` route: `active === 'profile'` → tab style active

12. **`src/middleware.ts`** — Đảm bảo routes mới được protect:
    - `/profile` → protected (đã có trong pattern)
    - `/circles/[id]/members` → protected (thêm nếu chưa có)

13. **`src/app/globals.css`** — Styles mới cho Sprint 8:
    - `.fc-avatar--lg` nếu chưa có (64px avatar)
    - `.fc-invite` — dashed border button
    - `.fc-pill--selected` — selected state cho HelpTagsPicker
    - Edit modal / bottom sheet styles
    - Avatar upload preview styles

### @tester

1. **`src/__tests__/schemas/profiles-update.test.ts`** — Unit tests:
   - `profileUpdateSchema`: valid payload với tất cả fields, partial update (chỉ display_name), empty payload rejected
   - `profileUpdateSchema` với `help_tags`: valid array `['pickup', 'childcare']`, invalid tag bị reject
   - `avatarUploadSchema`: valid (size ≤ 2MB, type = jpeg), size > 2MB rejected, invalid type rejected
   - `membersQuerySchema`: valid UUID, non-UUID rejected

2. **`src/__tests__/actions/profiles-update.test.ts`** — Action unit tests:
   - `getMyProfile` happy path: return profile data với tất cả fields
   - `getMyProfile` unauthenticated: return UNAUTHORIZED
   - `getMyProfile` not found: return error
   - `updateProfile` happy path: return `{ updated: true }`
   - `updateProfile` unauthenticated: return UNAUTHORIZED
   - `updateProfile` empty payload: return error "Không có thông tin nào được cập nhật."
   - `updateProfile` với `help_tags = ['pickup', 'other']`: success, array saved
   - `uploadAvatar` happy path: storage upload called, avatar_url updated, return `{ avatar_url }`
   - `uploadAvatar` file too large (> 2MB): return error "File quá lớn..."
   - `uploadAvatar` invalid file type: return error "Định dạng file không được hỗ trợ."
   - `uploadAvatar` unauthenticated: return UNAUTHORIZED

3. **`src/__tests__/actions/members.test.ts`** — Action unit tests:
   - `getCircleMembers` happy path: return members array với circle_name
   - `getCircleMembers` empty circle (chỉ mình user): return empty array `{ members: [], circle_name }`
   - `getCircleMembers` unauthenticated: return UNAUTHORIZED
   - `getCircleMembers` user không phải member: return error "Bạn không phải thành viên của vòng này."
   - `getCircleMembers` không include `line_user_id` trong bất kỳ member nào
   - `getCircleMembers` order by `joined_at ASC`: verify thứ tự

4. **`src/__tests__/rls/profiles.test.ts`** — RLS integration tests:
   - User SELECT profile của mình: trả về 1 row
   - User SELECT profile của member cùng vòng: trả về 1 row
   - User SELECT profile của người không cùng vòng: trả về 0 rows (RLS enforced)
   - User UPDATE profile của mình: success
   - User UPDATE profile của người khác: rejected bởi RLS

5. **`src/__tests__/actions/notification-type-fix.test.ts`** — Regression test:
   - Verify migration đã thêm `'join_request'` vào CHECK constraint
   - INSERT notification_log với type = `'join_request'`: không bị constraint error
   - INSERT notification_log với type = `'new_member'`: không bị constraint error
   - INSERT notification_log với type = `'invalid_type'`: bị rejected

## Exit Criteria

- [ ] `/profile` load được, hiển thị đúng: avatar, tên, location, kids_desc, help_tags chips theo profile-screen.md
- [ ] "Chỉnh sửa hồ sơ" → form mở → edit → save → profile screen hiển thị data mới (không cần manual refresh)
- [ ] Avatar upload: chọn ảnh → preview local → save → avatar mới hiển thị trên profile
- [ ] `help_tags` picker: multi-select 5 loại, save đúng vào DB, chips hiện đúng trên profile
- [ ] `/circles/[id]/members` load được, hiển thị danh sách members đúng theo members-screen.md
- [ ] MemberRow hiển thị: avatar, tên, location, kids_desc, help_tags chips — **không có** contribution count
- [ ] InviteCTA dashed button hiện ở đầu list, tap → navigate `/invite`
- [ ] BottomNav tab "Hồ sơ" active khi đang ở `/profile`; tap → navigate `/profile` từ Home/Requests
- [ ] `notification_logs` CHECK constraint fix: type `'join_request'` và `'new_member'` không bị reject
- [ ] RLS enforced: user không thể xem profile của người không cùng vòng
- [ ] `line_user_id` của member khác không xuất hiện trong bất kỳ response nào của `getCircleMembers`
- [ ] Profile page: **không có** badge admin/founder (Constitution Nguyên tắc 7)
- [ ] Profile page: **không có** số lần giúp/được giúp (Constitution Nguyên tắc 2)
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

## Open Questions Liên Quan

### OQ-007 — Chat icon → LINE handoff từ Members screen

**Status:** OPEN — liên quan đến cách lấy `line_user_id` của member khác để build LINE deeplink.

**Assumption dùng cho Sprint 8:** Chat icon trên MemberRow render nhưng disabled với tooltip "Kết nối qua LINE sắp ra mắt". Không có logic deeplink nào được build trong Sprint 8. LINE handoff từ Members screen là Phase 5 scope.

**Flag cho Master Agent:** OQ-007 cần quyết trước khi build LINE handoff từ Members screen. Sprint 8 không bị block.

## Forbidden Patterns Checklist

- [ ] Không tạo cột hoặc field tracking "số lần giúp" / "số lần được giúp" (Constitution Nguyên tắc 2)
- [ ] Không hiện contribution count, achievement count, hoặc bất kỳ counter activity nào trên profile hay member row (Constitution Nguyên tắc 2)
- [ ] Không có badge hay visual indicator phân biệt admin / founder / regular member (Constitution Nguyên tắc 7)
- [ ] Không return `line_user_id` của member khác trong `getCircleMembers` response (Constitution Nguyên tắc 9)
- [ ] Không build in-app chat (Constitution Forbidden UX)
- [ ] Không có public profile URL accessible ngoài vòng (Constitution Nguyên tắc 9)
- [ ] Không dùng `any` TypeScript để bypass type errors (coding-conventions.md)
- [ ] Không tạo ranking hay sorting by contribution trong members list (D-004)

## File Paths Cần Đọc

- `docs/02-design/screen-specs/profile-screen.md` — layout, elements, states, behaviors
- `docs/02-design/screen-specs/members-screen.md` — layout, elements, states, invite flow
- `docs/03-technical/data-model.md` — profiles table, circle_members, RLS policies
- `docs/03-technical/api-contract.md` — profiles section, conventions
- `docs/03-technical/coding-conventions.md` — file structure, TypeScript rules
- `docs/00-foundation/constitution.md` — Nguyên tắc 2, 7, 9; Forbidden UX
- `docs/00-foundation/decision-log.md` — D-004, D-028, D-030, D-038
- `famicon/src/app/actions/profiles.ts` — updateProfile, createProfile (đã có)
- `famicon/src/lib/types.ts` — ActionResult<T>, AidRequestWithProfile (để follow pattern)
- `famicon/src/lib/schemas/profiles.ts` — profileCreateSchema, profileUpdateSchema (để extend)
- `famicon/src/components/layout/bottom-nav.tsx` — để wire tab Profile
- `famicon/src/components/layout/top-header.tsx` — để dùng đúng props
- `famicon/src/app/(app)/home/page.tsx` — xem pattern Server Component + BottomNav
- `famicon/src/app/(app)/requests/[id]/page.tsx` — xem pattern loading/error boundary

## Sub-agent Breakdown

| Agent | Tasks | Notes |
|---|---|---|
| @schema | 1-3 (migration fix, verify RLS policies, verify Storage) | Tạo migration file, không modify existing data |
| @backend | 1-5 (uploadAvatar, getMyProfile, getCircleMembers, Zod schemas) | Viết Server Actions + Zod schemas |
| @frontend | 1-13 (profile page + edit modal + members page + wire BottomNav) | Viết React components, wiring |
| @tester | 1-5 (schema tests, action tests, RLS tests, regression test) | Unit tests + RLS tests, không cần E2E |

**Dependency order:** @schema → @backend → @frontend → @tester

## Risks + Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Avatar upload: Supabase Storage RLS chưa đúng — user upload được vào folder của người khác | Security breach, ảnh bị overwrite | @schema verify Storage policy trước; uploadAvatar path luôn dùng `user.id` hardcoded từ server, không trust client input |
| `help_tags` DB column là `text[]` nhưng app dùng 5 enum values cụ thể — mismatch nếu có dữ liệu cũ không thuộc enum | Validation error khi render chips | Frontend: render bất kỳ string nào từ DB (không strict enum), chỉ strict enum khi write (Zod) |
| Edit profile modal + avatar upload trong cùng 1 submit — 2 async operations có thể fail ở bước giữa | avatar_url không được update nếu `updateProfile` fail sau `uploadAvatar` | Implement: uploadAvatar TRƯỚC, lấy URL, rồi pass URL vào updateProfile payload. Nếu uploadAvatar fail → không gọi updateProfile. Nếu updateProfile fail → avatar đã upload nhưng profile không đổi (acceptable, user thấy ảnh vẫn cũ, retry sẽ overwrite upload) |
| `notification_logs` migration — DROP CONSTRAINT trên production table có data | Có thể fail nếu constraint name khác nhau giữa local và production | Dùng `IF EXISTS` — nếu không có constraint này thì migration vẫn pass. Verify tên constraint bằng `\d notification_logs` trước khi deploy |

## Definition of Done

- [x] Tất cả exit criteria met
- [x] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [x] Reviewer Agent APPROVED ✅
- [x] Tests pass CI (vitest run, lint, typecheck)
- [x] Deploy preview Vercel thành công
- [x] Founder test trên device thật (mobile Chrome + Safari iOS) — không có blocking bug

---

*Tạo: 2026-05-19 | Sprint 8 — Phase 4 Build MVP*
*Nguồn: sprint-plan-phase4.md Sprint 7 section | profile-screen.md | members-screen.md | api-contract.md | data-model.md | constitution.md | decision-log.md D-004, D-028, D-030, D-038 | PROJECT_STATE.md Sprint 7 notes*
