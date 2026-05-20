---
adr: ADR-009
title: Form Handling — Server Actions + React Hook Form
status: ACCEPTED
date: 2026-05-16
---

# ADR-009 — Form Handling

## Context

App có các form: New Request (5 fields), Onboarding Profile (4 fields), Edit Profile, Auth email+OTP. Cần quyết validation library và submission pattern.

## Decision

**Server Actions cho submission. React Hook Form cho client-side UX (validation, dirty state). Zod cho schema validation.**

### Pattern

```typescript
// 1. Schema (shared server + client)
// lib/schemas/request.ts
import { z } from 'zod';

export const newRequestSchema = z.object({
  category: z.enum(['pickup', 'borrow', 'childcare', 'ride', 'other']),
  description: z.string().min(5, 'Mô tả tối thiểu 5 ký tự'),
  scheduled_at: z.string().min(1, 'Cần điền thời gian'),
  location: z.string().min(1, 'Cần điền địa điểm'),
  is_urgent: z.boolean(),
});

// 2. Client component với React Hook Form
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function NewRequestForm() {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(newRequestSchema),
  });

  async function onSubmit(data) {
    await createRequest(data); // Server Action
  }
}

// 3. Server Action
'use server';
export async function createRequest(data: NewRequestInput) {
  const parsed = newRequestSchema.safeParse(data);
  if (!parsed.success) throw new Error('Invalid data');
  // insert to DB
}
```

### Thư viện

| Package | Mục đích |
|---|---|
| `react-hook-form` | Client form state, dirty tracking, submit handling |
| `zod` | Schema validation (shared server/client) |
| `@hookform/resolvers` | Bridge zod → react-hook-form |

Không dùng: Formik (verbose hơn), Valibot (ecosystem nhỏ hơn).

## Field UX patterns

**New Request form — 5 fields:**
- Category: CategoryTile grid (not `<select>`) — pre-select "pickup"
- Description: `<textarea>`, auto-resize
- Scheduled at: free text `<input>`, placeholder: "Hôm nay lúc 15:30"
- Location: free text `<input>`
- Urgent: 2 buttons "Có, gấp" / "Không, từ từ được" — không phải toggle switch

**canSubmit:** `category && description.trim().length > 0 && scheduled_at && location`

## Error display

Inline error ngay dưới field (không dùng toast cho validation error):

```tsx
{errors.description && (
  <p className="fc-field__error">{errors.description.message}</p>
)}
```

## Consequences

**Tốt:**
- Zod schema tái dùng cho cả client và server validation
- React Hook Form giảm re-render so với uncontrolled forms
- Server Actions = no API endpoint cần viết riêng

**Rủi ro:**
- React Hook Form bundle size ~13KB — chấp nhận được
- Progressive enhancement: nếu JS disabled, form không submit — chấp nhận (PWA requires JS)
