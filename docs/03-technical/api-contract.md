---
title: API Contract — Server Actions & Edge Functions
phase: Phase 4
last_updated: 2026-05-18
decision_refs: ADR-008 (Server Actions), ADR-003 (auth), ADR-004 (notifications)
---

# API Contract

> FAMICON dùng Next.js Server Actions cho mutations, Server Components cho reads. Không có REST API layer riêng.

---

## Conventions

### File structure

```
app/
  actions/
    auth.ts          -- sign-in, sign-out, verify-otp
    requests.ts      -- create, cancel, close request
    offers.ts        -- create offer, accept offer
    invites.ts       -- create invite, accept invite
    profiles.ts      -- update profile, upload avatar
    discovery.ts     -- update discovery settings
```

### Error format

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### Auth guard pattern

```typescript
'use server';
async function guardedAction() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Chưa đăng nhập', code: 'UNAUTHORIZED' };
  // ...
}
```

---

## Auth Actions

### `signInWithEmail(email: string)`

```typescript
// Gửi OTP đến email
// Kiểm tra email có trong invite list hoặc đã là member
input:  { email: string }
output: ActionResult<{ sent: true }>
errors:
  - 'Email này chưa được mời.' (email không trong invite và không phải member)
  - 'Quá nhiều yêu cầu. Thử lại sau.' (rate limit: 3 req/email/10min)
```

### `verifyOtp(email: string, token: string)`

```typescript
// Verify 6-digit OTP
// Nếu thành công + user mới: tạo profile rỗng, return needs_onboarding: true
input:  { email: string, token: string }
output: ActionResult<{ needs_onboarding: boolean }>
errors:
  - 'Mã không đúng. Còn [N] lần thử.'
  - 'Vui lòng yêu cầu mã mới.' (hết 3 lần thử)
```

### `signOut()`

```typescript
input:  void
output: ActionResult<void>
// Clear session cookie, redirect to /auth
```

---

## Profile Actions

### `createProfile(data: ProfileInput)`

```typescript
// Onboarding lần đầu — tạo profile sau OTP verify
input: {
  display_name: string    // required, min 2 chars
  avatar_emoji?: string   // default '👨‍👩‍👧'
  kids_desc?: string
  location?: string
}
output: ActionResult<{ profile_id: string }>
// Sau khi tạo: activate pending invite, add vào circle_members
```

### `updateProfile(data: Partial<ProfileInput>)`

```typescript
input: {
  display_name?: string
  avatar_emoji?: string
  kids_desc?: string
  location?: string
  help_tags?: string[]
  line_user_id?: string
}
output: ActionResult<{ updated: true }>
```

### `uploadAvatar(formData: FormData)`

```typescript
// Upload ảnh avatar (optional)
// FormData key: 'file' (image/jpeg | image/png | image/webp, max 2MB)
input:  FormData
output: ActionResult<{ avatar_url: string }>
errors:
  - 'File quá lớn. Tối đa 2MB.'
  - 'Định dạng không hợp lệ.'
```

---

## Request Actions

### `createRequest(data: NewRequestInput)`

```typescript
input: {
  circle_id:    string    // user's circle
  category:     'pickup' | 'borrow' | 'childcare' | 'ride' | 'other'
  description:  string    // min 5 chars
  scheduled_at: string    // free text
  location:     string
  is_urgent:    boolean
}
output: ActionResult<{ request_id: string }>
// After insert: trigger notification to circle members
```

### `getRequestDetail(requestId: string)`

```typescript
// Fetch full detail for a single request + requester display name.
// Visible only to active circle members (RLS enforced).
// File: src/app/actions/requests.ts (Sprint 7)
input:  string (UUID)
output: ActionResult<RequestDetail>
// RequestDetail: id, circle_id, requester_id, category, description,
//   scheduled_at, location_text, is_urgent, status, created_at, requester_name
// NOTE: line_user_id of requester is intentionally excluded (privacy — Constitution P9)
errors:
  - 'Bạn cần đăng nhập.'
  - 'ID yêu cầu không hợp lệ.'
  - 'Yêu cầu không tồn tại hoặc bạn không có quyền xem.'
```

### `cancelRequest(requestId: string)`

```typescript
// Chỉ requester có thể cancel (open hoặc matched).
// D-033: nếu request đang matched → fire re-notify circle sau khi cancel.
// File: src/app/actions/requests.ts (Sprint 7 — updated)
input:  string (UUID)
output: ActionResult<{ cancelled: true }>
errors:
  - 'Bạn cần đăng nhập.'
  - 'Không thể huỷ yêu cầu này.'  (không phải requester hoặc không tồn tại)
  - 'Yêu cầu đã được huỷ rồi.'
  - 'Không thể huỷ yêu cầu đã đóng.'
```

### `closeRequest(requestId: string)`

```typescript
// Mark request là closed (fulfilled / no longer needed).
// Chỉ requester có thể close.
// File: src/app/actions/requests.ts (Sprint 7 — updated)
input:  string (UUID)
output: ActionResult<{ closed: true }>
errors:
  - 'Bạn cần đăng nhập.'
  - 'Không thể đóng yêu cầu này.'
  - 'Yêu cầu đã được đóng rồi.'
  - 'Không thể đóng yêu cầu đã huỷ.'
```

---

## Offer Actions

### `createOffer(requestId: string)`

```typescript
// Bấm "Tôi giúp được"
// Tạo help_offer + trả về LINE deeplink để hand-off (D-012).
// File: src/app/actions/offers.ts (Sprint 7)
// OQ-007: No matching/ranking logic — any active circle member may offer (MVP).
input:  string (UUID)
output: ActionResult<{
  offer_id: string
  line_handoff_url: string  // 'https://line.me/ti/p/~{lineId}' or fallback 'https://line.me/R/'
}>
// Privacy: line_user_id of requester used server-side only to build deeplink
//          — never returned in ActionResult (Constitution P9).
errors:
  - 'Bạn cần đăng nhập.'
  - 'ID yêu cầu không hợp lệ.'
  - 'Bạn đã đề nghị giúp request này rồi.'  (Postgres unique violation 23505)
  - 'Yêu cầu này đã được nhận rồi.'          (status = matched)
  - 'Yêu cầu đã đóng.'                       (status = cancelled | closed)
  - 'Bạn không thể đề nghị giúp yêu cầu của chính mình.'
  - 'Bạn không thuộc vòng tròn này.'
```

### `acceptOffer(offerId: string)`

```typescript
// Requester accept một offer → offer status → 'accepted', request status → 'matched'.
// Other pending offers for same request → 'declined' (batch, best-effort).
// Fire-and-forget: notify-circle Edge Function với type='helper_confirmed'.
// File: src/app/actions/offers.ts (Sprint 7)
input:  string (UUID)
output: ActionResult<{ accepted: true }>
errors:
  - 'Bạn cần đăng nhập.'
  - 'ID đề nghị không hợp lệ.'
  - 'Chỉ người nhờ mới có thể chấp nhận.'
  - 'Yêu cầu này đã được nhận rồi.'
  - 'Yêu cầu đã đóng hoặc bị huỷ.'
```

---

## Invite Actions

### `createInvite(email: string)`

```typescript
// Tạo invite link cho email
// Expire 7 ngày (D-024), schedule remind ngày 5
input:  { email: string }
output: ActionResult<{
  invite_id: string
  token: string
  invite_url: string    // https://famicon.app/join/[token]
  expires_at: string    // ISO 8601
}>
errors:
  - 'Email này đã được mời rồi.' (pending invite exists)
  - 'Email này đã là thành viên.' (already member)
```

### `acceptInvite(token: string)`

```typescript
// Gọi khi user mở link /join/[token]
// Kiểm tra token valid, add vào circle
// Gọi sau verifyOtp + createProfile
input:  { token: string }
output: ActionResult<{
  circle_id: string
  circle_name: string
  is_returning_member: boolean  -- D-026: re-invite giữ data
}>
errors:
  - 'Link mời đã hết hạn.' (expires_at < now)
  - 'Link mời không hợp lệ.'
```

### `revokeInvite(inviteId: string)`

```typescript
// Tạo link mới → tự động expire link cũ
input:  { inviteId: string }
output: ActionResult<{ revoked: true }>
```

---

## Notification Actions (Sprint 5)

### `savePushSubscription(input)`

```typescript
// File: src/app/actions/notifications.ts
input: {
  endpoint: string           // Web Push endpoint URL
  keys: {
    p256dh: string           // Public key (base64url)
    auth:   string           // Auth secret (base64url)
  }
}
output: ActionResult<{ saved: boolean }>
errors:
  - 'Bạn cần đăng nhập.'          (UNAUTHORIZED)
  - 'Thông tin subscription không hợp lệ.'  (Zod validation)
  - 'Không thể lưu subscription. Vui lòng thử lại.'  (DB error)

// Behavior: upserts into push_subscriptions on (user_id, endpoint)
// Column mapping: keys.p256dh → p256dh, keys.auth → auth_key
```

### `saveLINEUserId(input)`

```typescript
// File: src/app/actions/notifications.ts
input: { lineUserId: string }  // or plain string
output: ActionResult<{ saved: boolean }>
errors:
  - 'Bạn cần đăng nhập.'       (UNAUTHORIZED)
  - 'LINE user ID không hợp lệ.'        (Zod validation)
  - 'Không thể lưu LINE ID. Vui lòng thử lại.'  (DB error)

// Behavior: updates profiles.line_user_id for the authenticated user
// line_user_id stored ONLY in profiles table (Constitution)
```

---

## LINE Webhook (Sprint 5)

### `POST /api/line/webhook`

```typescript
// File: src/app/api/line/webhook/route.ts
// Always returns HTTP 200 (LINE requirement)
// Verifies X-Line-Signature with HMAC-SHA256(LINE_CHANNEL_SECRET, body)
// Handles: follow event → calls handleFollowEvent(lineUserId)
// Ignores: all other event types silently
// Graceful: returns 200 if LINE_CHANNEL_SECRET not configured (dev mode)
```

---

## Discovery Actions (Sprint 11)

### `updateDiscoverySettings(data)`

```typescript
input: {
  is_visible: boolean
  radius_km: 3 | 5 | 10
}
output: ActionResult<{ updated: true }>
```

### `getDiscoveryFamilies()`

```typescript
// Trả về danh sách gia đình trong radius (Sprint 11)
// RLS: chỉ trả về families có is_visible = true và trong radius
output: ActionResult<DiscoveryFamily[]>
```

---

## Realtime Subscriptions (client-side)

Không phải Server Actions — subscribe trực tiếp từ Supabase client.

### Circle request feed

```typescript
supabase
  .channel('circle-requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'aid_requests',
    filter: `circle_id=eq.${circleId}`,
  }, handler)
  .subscribe();
```

### Notification feed

```typescript
supabase
  .channel('user-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',   // Sprint 5
    filter: `user_id=eq.${userId}`,
  }, handler)
  .subscribe();
```

---

## Edge Functions

Dùng Supabase Edge Functions (Deno) cho background tasks:

| Function | Trigger | Mục đích |
|---|---|---|
| `notify-circle` | `aid_requests` INSERT | Gửi Web Push + LINE fallback |
| `remind-invite` | Cron daily | Nhắc invite sắp expire (ngày 5 — D-024) |
| `expire-invites` | Cron daily | Mark invite `expired` khi quá 7 ngày |

### `notify-circle` Edge Function

```typescript
// supabase/functions/notify-circle/index.ts
// Trigger: POST from createRequest Server Action after successful DB insert
// Payload: { record: { id, circle_id, requester_id, category, description, is_urgent } }
//
// Logic per member (excludes requester):
//   1. Quiet hours check (22:00–07:00 JST) → skip non-urgent, log 'skipped_quiet_hours'
//   2. Rate limit check (≥5 non-urgent sent today) → skip, log 'skipped_rate_limit'
//   3. Web Push → if ok: log 'sent'; if 410/400: remove subscription + fallback
//   4. LINE fallback if push failed/absent AND member.line_user_id is set
//   5. Log every attempt to notification_logs
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY,
//           VAPID_PRIVATE_KEY, VAPID_SUBJECT, LINE_CHANNEL_ACCESS_TOKEN (optional)
// Graceful: if VAPID keys missing → skip Web Push; if LINE token missing → skip LINE

// Notification payload (no PII):
{
  title: is_urgent ? '🆘 Yêu cầu gấp trong vòng' : 'Yêu cầu mới trong vòng',
  body:  `Vòng tròn có yêu cầu mới: ${categoryLabel(category)}.`,
  url:   `/requests/${request_id}`,
  tag:   `request-${request_id}`,
}
```

### `remind-invite` Edge Function

```typescript
// supabase/functions/remind-invite/index.ts
// Trigger: Cron daily (recommended: "0 9 * * *" UTC = ~18:00 JST)
// Logic:
//   1. Query circle_invites WHERE status='pending' AND expires_at BETWEEN now()+2d AND now()+3d
//   2. For each invite: send Web Push to invited_by with payload:
//      { title: 'Link mời sắp hết hạn', body: '...2 ngày...', url: '/invite', tag: `invite-remind-${id}` }
//   3. Log to notification_logs (request_id = null for invite_reminder type)
// Env vars: same as notify-circle minus LINE token (LINE fallback not implemented for invite reminders)
```
