---
title: Test Strategy — Vòng Tròn Tương Trợ
phase: Phase 3
last_updated: 2026-05-16
decision_refs: ADR-010
---

# Test Strategy

> Chi tiết thực thi của ADR-010. Đọc ADR-010 trước.

---

## Setup

### Packages

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",
    "supabase": "^1.0.0"
  }
}
```

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'app/actions/**'],
      thresholds: { lines: 70 },
    },
  },
});
```

### Local Supabase

```bash
# Start local Supabase (Docker required)
supabase start

# Run migrations + seed
supabase db reset

# Stop
supabase stop
```

---

## Unit Tests

### Zod schema validation

```typescript
// tests/unit/schemas/request.test.ts
import { newRequestSchema } from '@/lib/schemas/request';

describe('newRequestSchema', () => {
  test('accepts valid request', () => {
    const result = newRequestSchema.safeParse({
      category: 'pickup',
      description: 'Cần đón bé lúc 15:30',
      scheduled_at: 'Hôm nay lúc 15:30',
      location: 'Trường Minato Sho',
      is_urgent: false,
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty description', () => {
    const result = newRequestSchema.safeParse({ description: '' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid category', () => {
    const result = newRequestSchema.safeParse({ category: 'invalid' });
    expect(result.success).toBe(false);
  });
});
```

### Utility functions

```typescript
// tests/unit/utils/time.test.ts
import { formatRelativeTime } from '@/lib/utils/time';

test('formats minutes ago', () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 phút trước');
});

test('formats today with time', () => {
  const todayAt10 = new Date();
  todayAt10.setHours(10, 30, 0, 0);
  expect(formatRelativeTime(todayAt10)).toMatch(/Hôm nay lúc 10:30/);
});
```

---

## Integration Tests (Server Actions + RLS)

### Setup

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js';

export const serviceClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function seedTestCircle() {
  // Insert circle, 2 members, return ids
}

export async function cleanupTest(circleId: string) {
  await serviceClient.from('circles').delete().eq('id', circleId);
}
```

### RLS boundary tests

```typescript
// tests/integration/rls/requests.test.ts
describe('aid_requests RLS', () => {
  let circleId: string;
  let memberClient: SupabaseClient;
  let outsiderClient: SupabaseClient;

  beforeEach(async () => {
    ({ circleId, memberClient, outsiderClient } = await seedScenario());
  });

  afterEach(async () => cleanupTest(circleId));

  test('member can read requests in their circle', async () => {
    const { data, error } = await memberClient
      .from('aid_requests')
      .select()
      .eq('circle_id', circleId);
    expect(error).toBeNull();
    expect(data).toHaveLength(greaterThan(0));
  });

  test('outsider cannot read requests', async () => {
    const { data } = await outsiderClient
      .from('aid_requests')
      .select()
      .eq('circle_id', circleId);
    expect(data).toHaveLength(0); // RLS returns empty, not error
  });

  test('member cannot update request of another member', async () => {
    // ...
  });
});
```

### Server Action tests

```typescript
// tests/integration/actions/create-request.test.ts
test('createRequest inserts and triggers notification', async () => {
  const result = await createRequest({
    circle_id: testCircleId,
    category: 'pickup',
    description: 'Test request',
    scheduled_at: 'Hôm nay',
    location: 'Yokohama',
    is_urgent: false,
  });

  expect(result.success).toBe(true);

  const { data } = await serviceClient
    .from('aid_requests')
    .select()
    .eq('id', result.data.request_id)
    .single();
  expect(data.status).toBe('open');
});
```

---

## E2E Tests (Playwright)

### Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
```

### 5 Critical flows

```typescript
// tests/e2e/01-auth.spec.ts
test('auth flow: email → OTP → circle home', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[type=email]', 'test@example.com');
  await page.click('button:has-text("Gửi mã xác nhận")');
  // Intercept OTP from test email / Supabase local
  await page.fill('.otp-input-0', '1');
  // ... fill all 6 digits
  await page.click('button:has-text("Xác nhận")');
  await expect(page).toHaveURL('/circle');
});

// tests/e2e/02-new-request.spec.ts
test('new request: form → submit → appears on feed', async ({ page }) => {
  // Login as test user
  // Navigate to new request
  // Fill 5 fields
  // Submit
  // Verify request appears on home feed
});

// tests/e2e/03-help-offer.spec.ts
test('help offer: tap "Tôi giúp được" → LINE handoff', async ({ page }) => { ... });

// tests/e2e/04-invite.spec.ts
test('invite: create link → open link → onboarding', async ({ page }) => { ... });

// tests/e2e/05-profile-edit.spec.ts
test('profile: edit name → save → display correct', async ({ page }) => { ... });
```

---

## CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: supabase start
      - run: supabase db reset
      - run: npx vitest run --coverage

  e2e:
    runs-on: ubuntu-latest
    needs: unit-integration
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test
    env:
      PLAYWRIGHT_BASE_URL: ${{ secrets.VERCEL_PREVIEW_URL }}
```

---

## What NOT to test

- Framework internals (Next.js, Supabase)
- Simple UI rendering (color, layout — thay đổi thường xuyên)
- Happy paths đã covered bởi E2E
- Mocking DB để test Server Actions (integration test với real DB tốt hơn)
