---
adr: ADR-008
title: State Management — Server Components + minimal client state
status: ACCEPTED
date: 2026-05-16
---

# ADR-008 — State Management

## Context

Next.js 14 App Router cho phép Server Components làm phần lớn data fetching. Cần quyết dùng thư viện state management client nào (Redux, Zustand, Jotai, hay không dùng gì).

## Decision

**Server Components làm default. Client state chỉ dùng `useState` / `useReducer` built-in React. Không có global state library.**

### Phân tách Server vs Client

| Data | Server Component | Client Component |
|---|---|---|
| Circle info, member list | ✅ fetch trên server | — |
| Request feed (initial load) | ✅ fetch trên server | — |
| Request feed (realtime updates) | — | ✅ Supabase Realtime |
| Form state (new request) | — | ✅ useState |
| Auth state | — | ✅ Supabase Auth context |
| OTP countdown | — | ✅ useState + useEffect |
| Toast notifications | — | ✅ useState (top-level) |

### Data fetching pattern

```typescript
// Server Component (không cần useState, không cần useEffect)
export default async function CircleHome() {
  const supabase = createServerClient();
  const { data: requests } = await supabase
    .from('aid_requests')
    .select('*, profiles(*)')
    .eq('circle_id', circleId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  return <RequestFeed initialRequests={requests} />;
}

// Client Component (realtime updates)
'use client';
function RequestFeed({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  useRealtimeRequests(circleId, setRequests); // custom hook
  return <>{requests.map(r => <RequestCard req={r} />)}</>;
}
```

### Mutations — Server Actions

```typescript
'use server';
export async function createRequest(formData: FormData) {
  const supabase = createServerClient();
  // validate, insert, trigger notification
  revalidatePath('/circle');
}
```

## Consequences

**Tốt:**
- Không thêm dependency
- Server Components giảm JS bundle client
- Data luôn fresh từ server (không stale cache phức tạp)
- AI codegen dễ hơn với pattern đơn giản

**Rủi ro:**
- Khi app phức tạp hơn (Sprint 8+), có thể cần Zustand cho cross-component state
- Sẽ migrate khi có pain point thực sự, không anticipate trước

## Toast / notification state

Dùng `createContext` + `useState` tại root layout cho toast. Không cần Zustand cho use case này.
