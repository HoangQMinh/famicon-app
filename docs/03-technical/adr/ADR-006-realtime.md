---
adr: ADR-006
title: Realtime — Supabase Realtime cho live feed
status: ACCEPTED
date: 2026-05-16
---

# ADR-006 — Realtime

## Context

Circle Home cần cập nhật khi có request mới mà không cần user refresh tay. Cần quyết dùng polling hay realtime subscription.

## Decision

**Supabase Realtime (Postgres Changes) cho Circle Home feed.**

```typescript
// Subscribe to new requests in user's circle
const channel = supabase
  .channel('circle-requests')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'aid_requests',
      filter: `circle_id=eq.${circleId}`,
    },
    (payload) => {
      // Prepend new request to list
      setRequests(prev => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

## Scope của Realtime

| Feature | Realtime | Polling / Manual refresh |
|---|---|---|
| Request mới trong vòng | ✅ Realtime | — |
| Help offer mới | ✅ Realtime (cho requester) | — |
| Member join/leave | — | Refresh khi vào Members screen |
| Notification in-app | ✅ Realtime | — |

## Không dùng Realtime cho

- Chat (không build in-app chat — D-012)
- Discovery feed (Sprint 11, quyết sau)
- Leaderboard / counter (không có — D-004)

## Consequences

**Tốt:**
- Supabase Realtime free tier: 200 concurrent connections — đủ cho MVP
- Đơn giản: không cần Socket.io, Pusher, hay Ably
- RLS tự động apply cho Realtime subscriptions

**Rủi ro:**
- Supabase Realtime dùng Websocket — cần connection thường xuyên
- Mobile browser có thể kill Websocket khi background — fallback: re-subscribe khi app focus lại
- Free tier 200 connections — monitor khi có >50 concurrent active users

## Reconnection strategy

```typescript
// Re-subscribe khi app come back to foreground
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    channel.subscribe(); // Supabase tự reconnect nếu đã subscribe
  }
});
```
