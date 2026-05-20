---
title: Notification Strategy — Vòng Tròn Tương Trợ
phase: Phase 3
last_updated: 2026-05-16
decision_refs: D-011 (Web Push + LINE), ADR-004
---

# Notification Strategy

> Chi tiết implementation của ADR-004. Đọc ADR-004 trước.

---

## Architecture

```
Server Action / DB trigger
        ↓
Supabase Edge Function: notify-circle
        ↓
    ┌───┴───┐
    │       │
Web Push  LINE Messaging API
(primary) (fallback)
```

---

## Web Push Setup

### VAPID Keys

```bash
# Generate once, store in .env
npx web-push generate-vapid-keys
```

### Permission request (Onboarding)

```typescript
async function requestPushPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  await savePushSubscription(subscription); // Server Action
  return true;
}
```

### Service Worker push handler

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url },
      tag: data.tag || 'default', // prevent duplicate
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

## LINE Messaging API Setup

### Config

```
LINE Messaging API channel (free):
- 200 free messages/tháng
- Webhook: https://famicon.app/api/line/webhook
```

### Khi nào dùng LINE fallback

1. User có `line_user_id` trong profile (opt-in)
2. Web Push subscription không tồn tại hoặc fail (410 Gone / 400 Bad Request)

### Template LINE message

```typescript
function formatLineMessage(request: AidRequest, requester: Profile): string {
  const urgentTag = request.is_urgent ? '[FAMICON 🆘 GẤP]\n' : '[FAMICON]\n';
  const category = categoryLabel(request.category);
  const desc = request.description.slice(0, 80);

  return `${urgentTag}${requester.display_name} cần ${category}:\n"${desc}"\n\n→ Xem và giúp: https://famicon.app/requests/${request.id}`;
}
```

---

## Rate Limiting

### Per-user limit

Max 5 push notifications / user / ngày (tránh spam):

```sql
-- Tracked trong notifications table (Sprint 5)
select count(*) from notifications
where user_id = $1
  and created_at > now() - interval '24 hours'
  and sent = true
```

### Urgent override

Request với `is_urgent = true` bypass daily limit (không đếm vào 5/ngày).

---

## Notification Preferences (Sprint 6)

User có thể tắt theo loại:

```typescript
// user_notification_preferences table (Sprint 6)
{
  user_id: string
  type: 'new_request' | 'urgent_request' | 'helper_confirmed' | 'invite_reminder' | 'new_member'
  enabled: boolean
}
```

Default: tất cả enabled.

---

## iOS Onboarding Flow

iOS Safari không hỗ trợ Web Push trừ khi Add to Home Screen:

```
Onboarding Step 3 of 3:
  "Để nhận thông báo khi có yêu cầu mới,
   hãy thêm FAMICON vào màn hình chính."

  [Hướng dẫn: Safari → Share → Add to Home Screen]

  [Bỏ qua (sẽ nhận qua LINE)]
  [Đã thêm rồi → request permission]
```

---

## Monitoring

- Log mỗi push attempt (success / fail / fallback) vào `notification_logs` table
- Alert khi fail rate > 30% / ngày
- LINE usage monitor (tránh vượt 200 messages/tháng free tier)
