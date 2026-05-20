---
title: Sprint 5 — Notifications
sprint: 5
phase: Phase 4
week: Tuần 6
status: READY
created: 2026-05-17
decision_refs: D-011 (Web Push + LINE), D-024 (invite remind), D-034 (no inactivity notify), ADR-004
oq_resolved: OQ-012 → D-034
---

# Sprint 5 — Notifications

## Goal

Members trong vòng nhận được push notification khi có aid request mới. Android nhận qua Web Push; iOS chưa Add to Home Screen nhận qua LINE fallback. Notification opt-in flow tích hợp mượt vào trải nghiệm onboarding.

**Testable definition:** Android Chrome user tạo request → mọi member khác (trừ requester) nhận Web Push trong vòng 5 giây. iOS user với `line_user_id` nhận LINE message khi Web Push không available.

---

## Dependencies

| Điều kiện | Trạng thái |
|---|---|
| Sprint 4 — New Request | DONE ✅ |
| OQ-012 → D-034 (inactivity notification) | RESOLVED ✅ — KHÔNG gửi notification khi vòng không active 7 ngày |
| `push_subscriptions` table + RLS đã migrate | DONE ✅ (Sprint 0 migration) |
| `profiles.line_user_id` column | DONE ✅ (Sprint 0 schema) |
| Service Worker cơ bản (PWA Sprint 0) | DONE ✅ — cần extend trong Sprint 5 |

**D-034:** Không implement inactivity notification. OQ-012 đã resolved: người dùng mở app khi thực sự cần, không nudge nhân tạo.

---

## Features

### F5.1 — VAPID Setup + push_subscriptions table verify

**User Story:** Không có user story trực tiếp — infrastructure cho F5.2-F5.4.

**Tasks:**
- Generate VAPID keys (`npx web-push generate-vapid-keys`)
- Thêm vào `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Verify `push_subscriptions` table đã tồn tại từ Sprint 0 migration
- Verify RLS policy `push_self` (all operations chỉ owner) đã apply

**Notes:**
- VAPID keys generate 1 lần, lưu an toàn vào Vercel env (không commit vào git)
- `VAPID_SUBJECT` = `mailto:minhbk.2009@gmail.com`

---

### F5.2 — Service Worker: Push Handler + Notification Click

**User Story:** US#19 (dự kiến) — "Khi có request mới, tôi muốn nhận thông báo ngay để không bỏ lỡ."

**Tasks:**
- Extend `public/sw.js` — thêm `push` event handler
- Thêm `notificationclick` event handler (mở URL trong notification data)
- SW phải handle `tag` để deduplicate (tránh hiện 2 notification giống nhau)

**Service Worker push handler (theo notification-strategy.md):**

```javascript
// public/sw.js — thêm vào SW hiện tại
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url },
      tag: data.tag || 'default',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

### F5.3 — Permission Request Flow + iOS Onboarding

**User Story:** User muốn bật notification để nhận thông báo kịp thời.

**Tasks:**
- Tạo `NotificationPermissionPrompt` component (Client Component)
- Hiển thị sau onboarding hoàn tất (không interrupt onboarding flow)
- Permission request flow theo notification-strategy.md:
  1. Subscribe `PushManager`
  2. Gọi `savePushSubscription` Server Action
- iOS onboarding step: hướng dẫn Add to Home Screen
  - Text: `"Để nhận thông báo khi có yêu cầu mới, hãy thêm FAMICON vào màn hình chính."`
  - Hướng dẫn: Safari → Share → Add to Home Screen
  - Nút "Bỏ qua (sẽ nhận qua LINE)" và "Đã thêm rồi → request permission"
- Detect iOS Safari (không Add to Home Screen) → skip Web Push, hiện LINE opt-in thay thế

**Trang hiển thị permission prompt:**
- `/home` lần đầu sau onboarding (one-time, dismissible)
- Không blocking — user có thể bỏ qua

---

### F5.4 — Server Action: `savePushSubscription`

**File:** `src/app/actions/notifications.ts`

**Contract:**

```typescript
// Input: PushSubscription object từ browser
export async function savePushSubscription(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
): Promise<ActionResult<{ saved: boolean }>>

// Behavior:
// 1. Auth guard
// 2. Upsert vào push_subscriptions (user_id, endpoint — unique constraint)
// 3. Return { success: true, data: { saved: true } }
// Errors:
// - 'Chưa đăng nhập' (UNAUTHORIZED)
// - 'Không thể lưu subscription' (DB error)
```

**Column mapping:**
- `endpoint` → `endpoint`
- `keys.p256dh` → `p256dh`
- `keys.auth` → `auth_key` (không dùng `auth` vì là reserved word — xem data-model.md)

---

### F5.5 — Edge Function: `notify-circle`

**File:** `supabase/functions/notify-circle/index.ts`

**Trigger:** Database webhook trên `aid_requests` INSERT (hoặc gọi từ `createRequest` Server Action)

**Logic:**
1. Nhận `record` (new aid_request) từ payload
2. Lấy tất cả active members của `circle_id` (qua service role)
3. Bỏ qua `requester_id` — không notify chính người tạo request
4. Với mỗi member:
   a. Lấy `push_subscriptions` của member
   b. Gửi Web Push (web-push library)
   c. Nếu push fail (410 Gone / 400 Bad Request / no subscription) VÀ member có `line_user_id` → gửi LINE fallback
5. Log mỗi attempt vào `notification_logs` table (Sprint 5 — tạo mới)

**Notification types:**

| Loại | Title | Trigger |
|---|---|---|
| `new_request` | `"Yêu cầu mới trong vòng"` | aid_requests INSERT (is_urgent = false) |
| `urgent_request` | `"🆘 Yêu cầu gấp trong vòng"` | aid_requests INSERT (is_urgent = true) |
| `helper_confirmed` | `"Có người giúp bạn rồi!"` | help_offers accepted (Sprint 6) |
| `invite_reminder` | `"Link mời sắp hết hạn"` | remind-invite cron (D-024) |

Sprint 5 implement: `new_request`, `urgent_request`. `helper_confirmed` implement Sprint 6.

**Rate limit:** Max 5 notifications/user/ngày (exclude urgent). Query `notification_logs` trước khi gửi.

**Quiet hours:** Không gửi 22:00-7:00 JST trừ urgent request (theo Nguyên tắc 4 Constitution).

**Web Push payload format:**

```typescript
{
  title: is_urgent ? '🆘 Yêu cầu gấp trong vòng' : 'Yêu cầu mới trong vòng',
  body: `${requester_name} cần ${categoryLabel(category)}`,
  url: `/requests/${request_id}`,
  tag: `request-${request_id}`,  // deduplicate
}
```

**LINE fallback template (theo notification-strategy.md):**

```typescript
const urgentTag = is_urgent ? '[FAMICON 🆘 GẤP]\n' : '[FAMICON]\n';
const desc = description.slice(0, 80);
return `${urgentTag}${display_name} cần ${categoryLabel(category)}:\n"${desc}"\n\n→ Xem và giúp: https://famicon.app/requests/${id}`;
```

---

### F5.6 — LINE Messaging API Setup + Opt-in Flow

**Tasks:**
- Setup LINE Messaging API channel (free tier: 200 messages/tháng)
- Thêm env vars: `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
- LINE webhook endpoint: `src/app/api/line/webhook/route.ts`
- Server Action: `saveLINEUserId(lineUserId: string)` → update `profiles.line_user_id`
- UI opt-in: trong Settings page (placeholder Sprint 5 — full settings Sprint 7)
  - Component `LINEConnectCard` hiển thị ở `/home` khi user iOS và chưa có `line_user_id`

**LINE opt-in flow:**
1. User bấm "Kết nối LINE để nhận thông báo"
2. Hướng dẫn thủ công: gửi bất kỳ tin nhắn đến LINE Official Account của FAMICON
3. Bot LINE lưu `line_user_id` (webhook `follow` event)
4. UI update: `line_user_id` đã có → ẩn prompt

**Lưu ý:** LINE Login OAuth phức tạp — MVP dùng webhook follow event để lấy `line_user_id`. User phải add LINE Official Account trước.

---

### F5.7 — `notification_logs` Table (Migration)

Schema mới cần tạo trong Sprint 5:

```sql
create table notification_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  type         text not null
               check (type in ('new_request', 'urgent_request', 'helper_confirmed', 'invite_reminder', 'new_member')),
  channel      text not null check (channel in ('web_push', 'line')),
  status       text not null check (status in ('sent', 'failed', 'skipped_rate_limit', 'skipped_quiet_hours')),
  request_id   uuid references aid_requests(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index idx_notification_logs_user_date
  on notification_logs(user_id, created_at desc);

alter table notification_logs enable row level security;

-- User chỉ đọc notification_logs của mình
create policy "notification_logs_select_self" on notification_logs
  for select using (user_id = auth.uid());

-- Insert chỉ qua Edge Function (service role) — không có user-level insert
```

**Migration file:** `supabase/migrations/YYYYMMDD_sprint5_notification_logs.sql`

---

### F5.8 — Edge Function: `remind-invite` (Daily Cron)

**File:** `supabase/functions/remind-invite/index.ts`

**Trigger:** Cron daily (Supabase pg_cron hoặc Edge Function schedule)

**Logic (D-024):**
1. Query `circle_invites` có `status = 'pending'` và `expires_at BETWEEN now() + 2 days AND now() + 3 days` (tức là ngày thứ 5 tính từ created_at)
2. Với mỗi invite: gửi notification `invite_reminder` cho `invited_by`
3. Log vào `notification_logs`

**Notification payload:**
```typescript
{
  title: 'Link mời sắp hết hạn',
  body: 'Link mời bạn gửi sắp hết hạn trong 2 ngày. Hãy nhắc lại người được mời.',
  url: '/invite',
  tag: `invite-remind-${invite_id}`,
}
```

---

## Out of Scope

- Notification settings per-type (Sprint 7 — `user_notification_preferences` table)
- `helper_confirmed` notification (Sprint 6 — offer flow)
- `new_member` notification (Sprint 7)
- In-app notification center / notification list screen (Sprint 7/8)
- Push analytics dashboard
- LINE Login OAuth (chỉ webhook follow event trong MVP)
- Upgrading LINE free tier (200 msg/tháng đủ cho pilot ~10 gia đình)

---

## Acceptance Criteria

| # | Criteria | Testable? |
|---|---|---|
| AC-5.1 | Android Chrome user nhận Web Push ≤5 giây sau khi member khác tạo request | Có — E2E manual + automated |
| AC-5.2 | iOS Safari user (không Add to Home Screen, có `line_user_id`) nhận LINE message ≤30 giây | Có — manual test device thật |
| AC-5.3 | Requester không nhận notification về request của chính mình | Có — integration test |
| AC-5.4 | Notification click mở đúng `/requests/{id}` | Có — E2E |
| AC-5.5 | `push_subscriptions` RLS: user A không đọc subscription của user B | Có — integration test |
| AC-5.6 | Rate limit: user không nhận quá 5 notifications non-urgent/ngày | Có — integration test với mock |
| AC-5.7 | Quiet hours: không gửi non-urgent 22:00-7:00 JST | Có — unit test với mock time |
| AC-5.8 | `savePushSubscription` upsert đúng — endpoint trùng không tạo duplicate row | Có — integration test |
| AC-5.9 | `remind-invite` chạy: invite ngày 5 → notification gửi cho `invited_by` | Có — integration test |
| AC-5.10 | `notification_logs` ghi đúng: mỗi attempt đều có entry với status rõ ràng | Có — integration test |

---

## OQ Dependencies

| OQ | Status | Decision |
|---|---|---|
| OQ-012 — Push notification khi vòng không active 7 ngày? | RESOLVED | D-034: KHÔNG gửi — người dùng mở app khi thực sự cần |

Không có OQ nào blocking Sprint 5.

---

## Sub-agent Breakdown

### @schema

**Tasks:**
1. Tạo migration `notification_logs` table + RLS (F5.7)
2. Verify `push_subscriptions` table + RLS đã apply đúng từ Sprint 0

**Files cần đọc:**
- `docs/03-technical/data-model.md` — push_subscriptions schema + RLS
- `docs/03-technical/coding-conventions.md` — migration naming

**Files sẽ tạo:**
- `supabase/migrations/YYYYMMDD_sprint5_notification_logs.sql`

---

### @backend

**Tasks:**
1. `savePushSubscription` Server Action trong `src/app/actions/notifications.ts` (F5.4)
2. `saveLINEUserId` Server Action trong `src/app/actions/notifications.ts` (F5.6)
3. `notify-circle` Edge Function (F5.5)
4. `remind-invite` Edge Function (F5.8)
5. LINE webhook handler `src/app/api/line/webhook/route.ts` (F5.6)

**Files cần đọc:**
- `docs/03-technical/notification-strategy.md` — full spec
- `docs/03-technical/adr/ADR-004-notification.md` — architecture
- `docs/03-technical/api-contract.md` — conventions, ActionResult<T>
- `docs/03-technical/data-model.md` — push_subscriptions, notification_logs schema
- `docs/03-technical/coding-conventions.md` — Server Action pattern
- `docs/00-foundation/constitution.md` — Nguyên tắc 4 (quiet hours, no spam)

**Files sẽ tạo:**
- `src/app/actions/notifications.ts`
- `supabase/functions/notify-circle/index.ts`
- `supabase/functions/remind-invite/index.ts`
- `src/app/api/line/webhook/route.ts`

---

### @frontend

**Tasks:**
1. Extend `public/sw.js` — push handler + notificationclick (F5.2)
2. `NotificationPermissionPrompt` component (F5.3)
3. iOS Add to Home Screen onboarding guide (F5.3)
4. `LINEConnectCard` component — hiển thị ở home khi iOS + no `line_user_id` (F5.6)
5. Wire permission request vào app (post-onboarding, one-time)

**Files cần đọc:**
- `docs/03-technical/notification-strategy.md` — permission flow, iOS guide
- `docs/02-design/screen-specs/notification-screen.md` — screen specs
- `docs/03-technical/coding-conventions.md` — Client Component rules
- `docs/00-foundation/constitution.md` — Nguyên tắc 4 (không dark pattern)

**Files sẽ tạo/update:**
- `public/sw.js` — extend push handler
- `src/components/features/notification-permission-prompt.tsx`
- `src/components/features/ios-install-guide.tsx`
- `src/components/features/line-connect-card.tsx`
- `src/app/(app)/home/page.tsx` — thêm permission prompt logic

---

### @tester

**Tasks:**
1. Unit tests: `savePushSubscription` schema validation, rate limit logic, quiet hours logic
2. Integration tests: push_subscriptions RLS boundaries, `savePushSubscription` upsert
3. Integration tests: `notify-circle` logic (mock web-push, mock LINE API)
4. Integration tests: `notification_logs` insert + RLS
5. E2E: Web Push receive flow (Android Chrome — mobile emulation)

**Files cần đọc:**
- `docs/04-operations/sprint-5-test-plan.md` — test plan đầy đủ
- `docs/03-technical/test-strategy.md` — test conventions

---

## File Paths Relevant

```
docs/03-technical/notification-strategy.md
docs/03-technical/adr/ADR-004-notification.md
docs/03-technical/data-model.md
docs/03-technical/api-contract.md
docs/03-technical/coding-conventions.md
docs/00-foundation/constitution.md
docs/02-design/screen-specs/notification-screen.md
src/app/actions/requests.ts          -- createRequest (entry point trigger)
src/lib/types.ts                     -- ActionResult<T>
public/sw.js                         -- Service Worker hiện tại
supabase/migrations/                 -- sprint 0 push_subscriptions migration
```

---

## Forbidden Patterns Checklist (Sprint 5)

Từ `docs/00-foundation/constitution.md`:

- [ ] KHÔNG tạo column tracking "số lần nhận notification" hay "notification score"
- [ ] KHÔNG hiển thị badge/streak liên quan notification history
- [ ] KHÔNG gửi "inactivity reminder" hay "vòng chưa hoạt động" (D-034 đã resolved: cấm)
- [ ] KHÔNG gửi weekly digest hay recap notification
- [ ] KHÔNG dùng dark pattern urgency giả (notification giả tạo FOMO)
- [ ] KHÔNG lưu `line_user_id` vào bất kỳ table nào ngoài `profiles`
- [ ] KHÔNG notify người gửi khi ai đó decline — Sprint 5 chưa có decline flow nhưng thiết kế notification_logs phải tránh pattern này
- [ ] Quiet hours 22:00-7:00 JST bắt buộc cho non-urgent
- [ ] Rate limit 5 notifications/user/ngày cho non-urgent

---

## Technical Notes Quan Trọng

### VAPID Keys
- Generate một lần: `npx web-push generate-vapid-keys`
- Lưu vào Vercel env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public — expose được), `VAPID_PRIVATE_KEY` (private — KHÔNG expose)
- `VAPID_SUBJECT` = `mailto:minhbk.2009@gmail.com`
- KHÔNG commit keys vào git

### iOS Web Push
- iOS Safari < 16.4 KHÔNG hỗ trợ Web Push kể cả Add to Home Screen
- iOS Safari 16.4+ CHỈ support Web Push khi đã Add to Home Screen (PWA)
- Cho iOS chưa Add to Home Screen: fallback sang LINE là mandatory, không phải optional
- Detect: `navigator.standalone === false` trên iOS

### LINE Messaging API
- Free tier: 200 push messages/tháng (đủ cho pilot ~10 gia đình ~20 requests/tuần)
- Cần tạo LINE Official Account và Messaging API channel trước Sprint 5
- Webhook URL phải HTTPS — dùng Vercel preview URL trong dev, production URL khi deploy
- `line_user_id` lấy từ webhook `follow` event payload (`event.source.userId`)

### Service Worker Registration
- SW hiện tại từ Sprint 0 đã register — chỉ cần extend handlers
- SW scope phải cover toàn bộ app để nhận push khi app closed
- Test SW: Chrome DevTools → Application → Service Workers

### `notify-circle` Trigger
- Option 1: Database webhook (Supabase Webhooks) trên `aid_requests` INSERT → call Edge Function
- Option 2: Gọi trực tiếp từ `createRequest` Server Action sau khi insert thành công
- Recommend Option 2 cho Sprint 5 (simpler, easier to test, single flow)
- Option 1 dùng khi cần decouple (Sprint 9+ nếu cần)

---

## Risks + Mitigations

| Rủi ro | Khả năng | Tác động | Mitigation |
|---|---|---|---|
| iOS Web Push không hoạt động trên thiết bị thật (version cũ) | Cao | Trung bình | LINE fallback là bắt buộc; test với iOS 16.4+ |
| LINE webhook fail lúc deploy (URL mismatch) | Trung bình | Cao | Test webhook với ngrok hoặc Vercel preview URL trước |
| VAPID keys bị mất/rotate sau deploy | Thấp | Cao | Lưu cả public + private key vào password manager trước khi deploy |
| Rate limit quá thấp (5/ngày) với urgent requests | Thấp | Thấp | Urgent bypass rate limit — không phải vấn đề |
| `notification_logs` table chưa có từ Sprint 0 | Confirmed | Trung bình | @schema migrate trong Sprint 5 — không phải risk, là task đã biết |

---

## Dependencies (giữa tasks trong sprint)

```
F5.7 (@schema: migration notification_logs)
  → F5.5 (@backend: notify-circle — cần table để log)

F5.1 (VAPID setup)
  → F5.4 (@backend: savePushSubscription)
  → F5.5 (@backend: notify-circle — cần VAPID keys)
  → F5.3 (@frontend: permission flow — cần NEXT_PUBLIC_VAPID_PUBLIC_KEY)

F5.2 (@frontend: SW push handler)
  → F5.3 (@frontend: permission prompt — SW phải ready trước)
  → F5.5 (@backend: notify-circle — push chỉ work khi SW xử lý được)
```

**Thứ tự delegation:**
1. @schema (F5.7 migration)
2. @backend (F5.4, F5.5, F5.6, F5.8) — sau @schema done
3. @frontend (F5.2, F5.3, F5.6 UI) — có thể song song với @backend
4. @tester — sau @backend + @frontend done

---

## Definition of Done

- [ ] Tất cả Acceptance Criteria (AC-5.1 đến AC-5.10) met
- [ ] `notify-circle` Edge Function deployed và hoạt động trên staging
- [ ] Android Chrome user nhận Web Push — test trên device thật
- [ ] iOS user với `line_user_id` nhận LINE message — test trên device thật
- [ ] `push_subscriptions` RLS test pass
- [ ] `notification_logs` ghi đúng mọi attempt
- [ ] Rate limit + quiet hours unit tests pass
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅
- [ ] Deploy Vercel preview + founder test trên mobile Chrome + Safari iOS
- [ ] Không có blocking bug trên device thật

---

## Test Plan Reference

Xem: `docs/04-operations/sprint-5-test-plan.md`

---

*Tạo bởi Docs Steward | 2026-05-17*
*Nguồn: sprint-plan-phase4.md, notification-strategy.md, ADR-004, data-model.md, api-contract.md, constitution.md*
