---
adr: ADR-010
title: Testing Strategy — Vitest + Playwright
status: ACCEPTED
date: 2026-05-16
---

# ADR-010 — Testing Strategy

## Context

Solo founder với AI-augmented workflow. Testing phải đủ để catch regressions mà không overhead quá nhiều thời gian maintain tests.

## Decision

**Unit/Integration: Vitest. E2E: Playwright. Không dùng Jest (Vitest nhanh hơn, ESM native).**

### Test pyramid

```
E2E (Playwright) — happy paths only (3-5 critical flows)
    ↑
Integration (Vitest + Supabase local) — Server Actions + RLS
    ↑
Unit (Vitest) — pure functions, schema validation, utilities
```

### Unit tests (Vitest)

Target: pure functions và Zod schemas.

```typescript
// lib/schemas/__tests__/request.test.ts
import { newRequestSchema } from '../request';

test('rejects empty description', () => {
  const result = newRequestSchema.safeParse({ description: '' });
  expect(result.success).toBe(false);
});
```

### Integration tests (Vitest + Supabase local)

Target: Server Actions + RLS policies.

```typescript
// app/actions/__tests__/create-request.test.ts
test('member can create request in their circle', async () => {
  // seed test circle + member
  // call createRequest Server Action
  // assert DB row created
  // assert non-member cannot read via RLS
});
```

Dùng `supabase start` (Docker) cho local test DB. Không mock DB (D-010 — integration over mocks).

### E2E tests (Playwright)

5 critical flows cần pass trước mỗi release:

1. Auth flow: nhập email → OTP → vào Circle Home
2. New request: điền form → submit → xuất hiện trên feed
3. Help offer: member bấm "Tôi giúp được" → hand-off link LINE
4. Invite: tạo link → copy → simulate join (URL open)
5. Profile: edit profile → lưu → hiển thị đúng

### Coverage target

| Layer | Target |
|---|---|
| Unit (Zod schemas + utils) | 80%+ |
| Integration (Server Actions) | Happy path + auth boundary |
| E2E | 5 critical flows — must pass |

Không target 100% coverage — tốn thời gian, ít ROI.

## CI

GitHub Actions chạy:
1. `vitest run` — unit + integration
2. `playwright test` — E2E (trên preview deploy Vercel)

Fail CI = block merge to main.

## Consequences

**Tốt:**
- Vitest nhanh hơn Jest ~2-5x, setup đơn giản hơn
- Playwright test real browser — không mock fetch/DOM
- Supabase local (`supabase start`) cho integration test không cần cloud

**Rủi ro:**
- Supabase local yêu cầu Docker — CI cần Docker setup
- E2E chậm (~30-60s/test) — chỉ chạy 5 flows để giữ CI <5 phút
