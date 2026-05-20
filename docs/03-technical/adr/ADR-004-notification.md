---
adr: ADR-004
title: Notification Strategy — Web Push + LINE Fallback
status: ACCEPTED
date: 2026-05-16
decision_ref: D-011
---

# ADR-004 — Notification

## Context

Push notification là critical cho FAMICON — user cần biết ngay khi có request gấp. Vấn đề: iOS PWA không nhận Web Push trước khi "Add to Home Screen".

Quyết định D-011: Web Push API làm primary, LINE Messaging API làm fallback.

## Decision

### Layer 1 — Web Push (primary)

**Provider:** Vercel Edge Functions + Web Push (VAPID keys)

Flow:
1. Onboarding: request permission, lưu `PushSubscription` vào `push_subscriptions` table
2. Khi cần notify: Vercel Edge Function gọi web-push library
3. Browser nhận push → Service Worker hiển thị notification

```typescript
// Gửi push
import webpush from 'web-push';

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'Yêu cầu mới trong vòng',
  body: `${requester} cần đón con lúc 15:30`,
  url: `/requests/${requestId}`,
}));
```

### Layer 2 — LINE Messaging API (fallback)

**Trigger:** Khi Web Push fail (device offline, permission denied, iOS trước khi Add to Home Screen)

**Setup:**
- LINE Messaging API channel (free tier: 200 messages/tháng, đủ cho MVP)
- User opt-in LINE trong settings — nhập LINE user ID hoặc dùng LINE Login để lấy
- Store `line_user_id` trong `profiles` table

**Template LINE message:**
```
[FAMICON] Vòng [tên vòng]

Yêu cầu mới: [title]
Chi tiết: [desc truncated 80 chars]
→ Mở app: https://famicon.app/requests/[id]
```

### Triggers (theo loại)

| Event | Push title | Priority |
|---|---|---|
| New urgent request | `🆘 Yêu cầu gấp trong vòng` | High — notify tất cả member |
| New normal request | `Yêu cầu mới trong vòng` | Normal |
| Helper confirmed | `Có người giúp bạn rồi!` | Normal — chỉ notify asker |
| Invite about to expire | `Link mời sắp hết hạn` | Low — chỉ notify inviter |
| New member joined | `Thành viên mới` | Low — notify tất cả |

### Constitution compliance

Nguyên tắc 3 (yên tĩnh):
- Không gửi notification quá 3 lần/ngày/user (rate limit)
- Không gửi "vòng không active" (OQ-012 OPEN)
- Không gửi recap/weekly digest
- User có thể tắt notification per-type trong Settings

## Consequences

**Tốt:**
- Web Push free + reliable trên Android và iOS 16.4+ (Add to Home Screen)
- LINE fallback cover iOS user chưa Add to Home Screen
- Vercel Edge Functions = low latency, global

**Rủi ro:**
- LINE free tier 200 messages/tháng — cần upgrade khi >~50 active users
- iOS Web Push yêu cầu Add to Home Screen — onboarding friction
- User phải opt-in LINE riêng — 2-step setup

## Implementation order

Sprint 5: Web Push (Android + iOS 16.4+)
Sprint 5: LINE fallback opt-in flow
Sprint 6: Per-type notification settings
