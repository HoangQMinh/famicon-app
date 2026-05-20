---
title: Coding Conventions — Vòng Tròn Tương Trợ
phase: Phase 3
last_updated: 2026-05-16
---

# Coding Conventions

> Rules cho AI codegen và human review. Ngắn gọn — chỉ ghi những gì không hiển nhiên.

---

## File Structure

```
famicon/
  app/
    (auth)/           -- route group: auth pages (không có layout chính)
      auth/page.tsx
      join/[token]/page.tsx
    (app)/            -- route group: app pages (có BottomNav layout)
      circle/page.tsx
      requests/[id]/page.tsx
      new-request/page.tsx
      profile/page.tsx
      members/page.tsx
      notifications/page.tsx
    actions/          -- tất cả Server Actions
    api/              -- Edge API routes (LINE webhook, push send)
    layout.tsx        -- root layout
  components/
    ui/               -- atomic components (Button, Card, Avatar...)
    features/         -- feature components (RequestCard, MemberRow...)
  lib/
    schemas/          -- Zod schemas
    utils/            -- pure utility functions
    supabase/         -- Supabase client helpers
  public/
    icons/            -- PWA icons
    sw.js             -- Service Worker
  supabase/
    migrations/       -- SQL migrations (numbered)
    functions/        -- Edge Functions
    seed.sql
```

---

## TypeScript

- Strict mode bật (`"strict": true` trong tsconfig)
- Không dùng `any` — dùng `unknown` + narrowing
- Không `as` typecast để bypass type errors
- Props interface đặt cùng file với component

```typescript
// Good
interface RequestCardProps {
  request: AidRequest;
  onHelp: () => void;
}

// Avoid
const data = response as AnyType;  // ❌
```

---

## Components

### Server vs Client

- Default: Server Component (không có `'use client'`)
- Thêm `'use client'` chỉ khi: useState, useEffect, event handlers, browser APIs

```typescript
// Server Component (default)
export default async function CircleHome() {
  const requests = await fetchRequests();
  return <RequestFeed requests={requests} />;
}

// Client Component (khi cần interactivity)
'use client';
export function RequestFeed({ requests }: Props) {
  const [list, setList] = useState(requests);
  // ...
}
```

### Naming

- Components: PascalCase (`RequestCard`, `BottomNav`)
- Server Actions: camelCase (`createRequest`, `updateProfile`)
- Utils: camelCase (`formatRelativeTime`, `categoryLabel`)
- DB types: PascalCase (`AidRequest`, `Profile`, `Circle`)

---

## CSS / Styling

Dùng CSS classes từ `components.css` + `colors_and_type.css` (design system):

```tsx
// Good — dùng design system classes
<button className="fc-btn fc-btn--primary">Gửi</button>
<div className="fc-card">...</div>

// Avoid — inline styles trừ layout đặc biệt
<button style={{ backgroundColor: '#FF8966' }}>...</button>  // ❌
```

Inline style chỉ cho: layout values động (width, height, transform), margin/padding đơn giản không có class tương ứng.

---

## Server Actions

```typescript
'use server';

// 1. Guard auth đầu tiên
// 2. Validate input với Zod
// 3. RLS handle authorization (không check manually trong code)
// 4. Return ActionResult<T>

export async function createRequest(data: unknown): Promise<ActionResult<{ request_id: string }>> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Chưa đăng nhập' };

  const parsed = newRequestSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: 'Dữ liệu không hợp lệ' };

  const { data: row, error } = await supabase
    .from('aid_requests')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) return { success: false, error: 'Không thể tạo yêu cầu' };
  return { success: true, data: { request_id: row.id } };
}
```

---

## Database

### Migrations

Đặt tên: `YYYYMMDD_description.sql`

```
supabase/migrations/
  20260516_initial_schema.sql
  20260523_add_discovery_settings.sql
```

Mỗi migration: up only (không có down migration trong MVP — tốn thời gian maintain).

### Queries

- Luôn dùng Supabase query builder (không raw SQL trong app code)
- Select chỉ columns cần thiết (không `select *` trong production code)
- Luôn handle error từ Supabase

```typescript
// Good
const { data, error } = await supabase
  .from('aid_requests')
  .select('id, description, category, is_urgent, created_at')
  .eq('circle_id', circleId)
  .eq('status', 'open')
  .order('created_at', { ascending: false })
  .limit(20);

if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
```

---

## Error Handling

- Server Actions: trả về `ActionResult` (không throw ra ngoài)
- Server Components: throw để Next.js Error Boundary catch
- Client Components: catch error từ Server Action, hiển thị inline error

```typescript
// Client Component
const result = await createRequest(data);
if (!result.success) {
  setError(result.error); // hiển thị inline, không toast
  return;
}
// success path
```

---

## Comments

Viết comment chỉ khi WHY không hiển nhiên. Không comment WHAT.

```typescript
// ❌ Không cần
// Check if user is authenticated
if (!user) return unauthorized;

// ✅ Cần — WHY không hiển nhiên
// Supabase RLS returns empty array (not 403) when unauthorized
// Nên cần check length thay vì check error
if (data.length === 0 && !isFirstLoad) return notInCircle;
```

---

## Git

- Branch: `feat/sprint-N-description`, `fix/short-description`
- Commit message: `feat: add new request form`, `fix: OTP countdown reset on resend`
- Không commit `.env` files (`.gitignore` đã có)
- PR: cần Reviewer Agent approve trước merge (D-016)

---

## Không làm

- Ledger columns (`help_count`, `karma_score`) — forbidden (D-004)
- `console.log` trong production code
- `any` type
- `as` typecast để bypass type errors
- Hard delete rows (D-030)
- Public routes cho data đã được circle-isolated
