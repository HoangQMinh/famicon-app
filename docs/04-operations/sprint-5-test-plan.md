---
title: Sprint 5 — Test Plan (Notifications)
sprint: 5
phase: Phase 4
created: 2026-05-17
spec_ref: docs/04-operations/sprint-5-spec.md
strategy_ref: docs/03-technical/test-strategy.md
---

# Sprint 5 — Test Plan: Notifications

## Scope

Sprint 5 build notification layer: Web Push primary, LINE fallback, Service Worker push handler, `savePushSubscription` Server Action, `notify-circle` Edge Function, `remind-invite` cron, và `notification_logs` table.

Test plan này cover:
- Unit tests: schema validation, rate limit logic, quiet hours logic, utility functions
- Integration tests: Server Action behavior, RLS boundaries, Edge Function logic (với mocks)
- E2E tests: Web Push receive flow (Android Chrome)
- Manual device tests: iOS LINE fallback (không thể automate fully)
- Regression check: Sprint 1-4 features vẫn hoạt động

---

## Test Data Setup

Trước khi chạy tests, cần seed data sau:

```typescript
// tests/setup-sprint5.ts
export async function seedNotificationTestData() {
  // Circle với 3 members: Alice (requester), Bob (push subscriber), Carol (LINE only)
  const { circleId } = await seedTestCircle();

  // Bob: có push subscription
  await serviceClient.from('push_subscriptions').insert({
    user_id: bobUserId,
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-bob',
    p256dh: 'test-p256dh-bob',
    auth_key: 'test-auth-bob',
  });

  // Carol: LINE only (no push subscription, has line_user_id)
  await serviceClient.from('profiles')
    .update({ line_user_id: 'Utest_carol_line_id' })
    .eq('id', carolUserId);

  return { circleId, aliceUserId, bobUserId, carolUserId };
}
```

---

## 1. Unit Tests

### 1.1 Zod Schema — Push Subscription

**File:** `src/__tests__/schemas/push-subscription.test.ts`

```typescript
describe('pushSubscriptionSchema', () => {
  test('accepts valid subscription object', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: {
        p256dh: 'BNV7QEe...',
        auth: 'auth-value',
      },
    });
    expect(result.success).toBe(true);
  });

  test('rejects missing endpoint', () => {
    const result = pushSubscriptionSchema.safeParse({
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing keys.p256dh', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://example.com',
      keys: { auth: 'def' },
    });
    expect(result.success).toBe(false);
  });
});
```

**Pass criteria:** 3/3 tests pass.

---

### 1.2 Rate Limit Logic

**File:** `src/__tests__/utils/notification-rate-limit.test.ts`

```typescript
describe('isRateLimited', () => {
  test('returns false when user has 0 notifications today', async () => {
    // Mock: notification_logs returns [] for userId
    const result = await isRateLimited(userId, 'new_request', mockDb);
    expect(result).toBe(false);
  });

  test('returns false when user has 4 non-urgent notifications today', async () => {
    // Mock: 4 sent entries in notification_logs
    const result = await isRateLimited(userId, 'new_request', mockDb);
    expect(result).toBe(false);
  });

  test('returns true when user has 5 non-urgent notifications today', async () => {
    // Mock: 5 sent entries in notification_logs
    const result = await isRateLimited(userId, 'new_request', mockDb);
    expect(result).toBe(true);
  });

  test('returns false for urgent_request regardless of count', async () => {
    // Mock: 10 sent entries in notification_logs
    const result = await isRateLimited(userId, 'urgent_request', mockDb);
    expect(result).toBe(false); // urgent bypasses rate limit
  });
});
```

**Pass criteria:** 4/4 tests pass.

---

### 1.3 Quiet Hours Logic

**File:** `src/__tests__/utils/notification-quiet-hours.test.ts`

```typescript
describe('isQuietHours', () => {
  test('returns true at 23:00 JST (22:00 UTC+9)', () => {
    const time = new Date('2026-05-17T14:00:00Z'); // 23:00 JST
    expect(isQuietHours(time)).toBe(true);
  });

  test('returns true at 02:00 JST', () => {
    const time = new Date('2026-05-17T17:00:00Z'); // 02:00 JST
    expect(isQuietHours(time)).toBe(true);
  });

  test('returns false at 09:00 JST', () => {
    const time = new Date('2026-05-17T00:00:00Z'); // 09:00 JST
    expect(isQuietHours(time)).toBe(false);
  });

  test('urgent_request bypasses quiet hours', () => {
    const time = new Date('2026-05-17T14:00:00Z'); // 23:00 JST
    expect(isQuietHours(time, { isUrgent: true })).toBe(false);
  });

  test('boundary: 22:00 JST = quiet hours start', () => {
    const time = new Date('2026-05-17T13:00:00Z'); // 22:00 JST
    expect(isQuietHours(time)).toBe(true);
  });

  test('boundary: 07:00 JST = quiet hours end', () => {
    const time = new Date('2026-05-16T22:00:00Z'); // 07:00 JST
    expect(isQuietHours(time)).toBe(false);
  });
});
```

**Pass criteria:** 6/6 tests pass.

---

### 1.4 LINE Message Formatter

**File:** `src/__tests__/utils/line-message.test.ts`

```typescript
describe('formatLineMessage', () => {
  test('formats normal request', () => {
    const msg = formatLineMessage({
      id: 'req-123',
      is_urgent: false,
      category: 'pickup',
      description: 'Cần đón con lúc 15:30',
      requester_name: 'Chị Linh',
    });
    expect(msg).toContain('[FAMICON]');
    expect(msg).toContain('Chị Linh');
    expect(msg).not.toContain('🆘');
    expect(msg).toContain('https://famicon.app/requests/req-123');
  });

  test('formats urgent request with 🆘 tag', () => {
    const msg = formatLineMessage({
      id: 'req-456',
      is_urgent: true,
      category: 'childcare',
      description: 'Cần trông con gấp',
      requester_name: 'Anh Nam',
    });
    expect(msg).toContain('[FAMICON 🆘 GẤP]');
  });

  test('truncates description to 80 chars', () => {
    const longDesc = 'A'.repeat(120);
    const msg = formatLineMessage({
      id: 'req-789',
      is_urgent: false,
      category: 'other',
      description: longDesc,
      requester_name: 'Test',
    });
    const descPart = msg.split('"')[1]; // extract between quotes
    expect(descPart?.length).toBeLessThanOrEqual(80);
  });
});
```

**Pass criteria:** 3/3 tests pass.

---

## 2. Integration Tests

### 2.1 `savePushSubscription` — Server Action

**File:** `src/__tests__/actions/push-subscription.test.ts`

**Test data:** 1 authenticated user, local Supabase running.

```typescript
describe('savePushSubscription', () => {
  test('inserts new subscription for authenticated user', async () => {
    const result = await savePushSubscription({
      endpoint: 'https://fcm.googleapis.com/test-1',
      keys: { p256dh: 'p256dh-1', auth: 'auth-1' },
    });

    expect(result.success).toBe(true);

    const { data } = await serviceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', testUserId)
      .single();
    expect(data?.endpoint).toBe('https://fcm.googleapis.com/test-1');
    expect(data?.p256dh).toBe('p256dh-1');
    expect(data?.auth_key).toBe('auth-1');
  });

  test('upserts — same endpoint does not create duplicate row', async () => {
    // Insert first time
    await savePushSubscription({
      endpoint: 'https://fcm.googleapis.com/test-dup',
      keys: { p256dh: 'p256dh-v1', auth: 'auth-v1' },
    });

    // Insert same endpoint again (e.g., after permission re-grant)
    await savePushSubscription({
      endpoint: 'https://fcm.googleapis.com/test-dup',
      keys: { p256dh: 'p256dh-v2', auth: 'auth-v2' },
    });

    const { data } = await serviceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', testUserId)
      .eq('endpoint', 'https://fcm.googleapis.com/test-dup');
    expect(data).toHaveLength(1); // exactly 1 row — upsert worked
    expect(data?.[0].p256dh).toBe('p256dh-v2'); // updated to latest
  });

  test('returns UNAUTHORIZED when not authenticated', async () => {
    // Call without auth context
    const result = await savePushSubscriptionUnauthenticated({
      endpoint: 'https://example.com',
      keys: { p256dh: 'x', auth: 'y' },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Chưa đăng nhập');
  });

  test('rejects invalid subscription (missing endpoint)', async () => {
    const result = await savePushSubscription({
      endpoint: '',
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });
});
```

**Pass criteria:** 4/4 tests pass. No duplicate rows. Upsert works correctly.

---

### 2.2 `push_subscriptions` RLS Boundaries

**File:** `src/__tests__/rls/push-subscriptions.test.ts`

**Test data:** 2 users (Alice, Bob), each with 1 push subscription.

```typescript
describe('push_subscriptions RLS', () => {
  test('user can read own subscription', async () => {
    const { data, error } = await aliceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', aliceUserId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  test('user CANNOT read subscription of another user', async () => {
    const { data } = await aliceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', bobUserId);
    expect(data).toHaveLength(0); // RLS returns empty, not error
  });

  test('user CANNOT insert subscription for another user', async () => {
    const { error } = await aliceClient
      .from('push_subscriptions')
      .insert({
        user_id: bobUserId, // trying to insert for Bob
        endpoint: 'https://evil.com',
        p256dh: 'x',
        auth_key: 'y',
      });
    expect(error).not.toBeNull(); // RLS violation
  });

  test('user can delete own subscription', async () => {
    const { error } = await aliceClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', aliceUserId);
    expect(error).toBeNull();
  });

  test('user CANNOT delete subscription of another user', async () => {
    const { error } = await aliceClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', bobUserId);
    // Supabase RLS: delete with no matching rows (silent) or error
    // Either way, Bob's subscription should still exist after:
    const { data } = await serviceClient
      .from('push_subscriptions')
      .select()
      .eq('user_id', bobUserId);
    expect(data).toHaveLength(1); // Bob's subscription untouched
  });
});
```

**Pass criteria:** 5/5 tests pass. RLS isolation confirmed.

---

### 2.3 `notify-circle` Edge Function Logic

**File:** `src/__tests__/functions/notify-circle.test.ts`

Test gọi function logic trực tiếp (unit-style với mock web-push và mock LINE client).

**Test data:** Circle với 3 members: Alice (requester), Bob (Web Push subscriber), Carol (LINE only).

```typescript
describe('notify-circle function logic', () => {
  test('notifies all members except requester when new request created', async () => {
    const mockPush = vi.fn().mockResolvedValue({ success: true });
    const mockLine = vi.fn().mockResolvedValue({ success: true });

    await notifyCircle({
      circleId,
      requestId: 'req-new',
      requesterId: aliceUserId,  // Alice is requester → should NOT be notified
      isUrgent: false,
    }, { pushFn: mockPush, lineFn: mockLine });

    // Alice (requester) should NOT be notified
    const aliceCalls = mockPush.mock.calls.filter(c => c[0].userId === aliceUserId);
    expect(aliceCalls).toHaveLength(0);

    // Bob should receive push
    const bobCalls = mockPush.mock.calls.filter(c => c[0].userId === bobUserId);
    expect(bobCalls).toHaveLength(1);

    // Carol should receive LINE (no push subscription)
    const carolLineCalls = mockLine.mock.calls.filter(c => c[0] === carolLineId);
    expect(carolLineCalls).toHaveLength(1);
  });

  test('falls back to LINE when Web Push returns 410 Gone', async () => {
    const mockPush = vi.fn().mockRejectedValue({ statusCode: 410 });
    const mockLine = vi.fn().mockResolvedValue({ success: true });

    await notifyCircle({
      circleId,
      requestId: 'req-push-fail',
      requesterId: aliceUserId,
      isUrgent: false,
    }, { pushFn: mockPush, lineFn: mockLine });

    // Bob: push failed → LINE fallback (if Bob had line_user_id)
    // This test verifies fallback logic — seed Bob with line_user_id for this case
    expect(mockLine).toHaveBeenCalled();
  });

  test('logs each attempt to notification_logs', async () => {
    const mockPush = vi.fn().mockResolvedValue({ success: true });
    const mockLine = vi.fn();

    await notifyCircle({
      circleId,
      requestId: 'req-log-test',
      requesterId: aliceUserId,
      isUrgent: false,
    }, { pushFn: mockPush, lineFn: mockLine });

    const { data: logs } = await serviceClient
      .from('notification_logs')
      .select()
      .eq('request_id', 'req-log-test');

    // At least one log entry per notified member
    expect(logs?.length).toBeGreaterThanOrEqual(1);
    expect(logs?.[0].status).toBe('sent');
    expect(logs?.[0].channel).toBe('web_push');
  });

  test('skips notification during quiet hours for non-urgent request', async () => {
    const mockPush = vi.fn();
    vi.setSystemTime(new Date('2026-05-17T14:00:00Z')); // 23:00 JST

    await notifyCircle({
      circleId,
      requestId: 'req-quiet',
      requesterId: aliceUserId,
      isUrgent: false,
    }, { pushFn: mockPush, lineFn: vi.fn() });

    expect(mockPush).not.toHaveBeenCalled();

    // Verify skipped log entry
    const { data: logs } = await serviceClient
      .from('notification_logs')
      .select()
      .eq('request_id', 'req-quiet');
    expect(logs?.[0].status).toBe('skipped_quiet_hours');

    vi.useRealTimers();
  });

  test('sends urgent request even during quiet hours', async () => {
    const mockPush = vi.fn().mockResolvedValue({ success: true });
    vi.setSystemTime(new Date('2026-05-17T14:00:00Z')); // 23:00 JST

    await notifyCircle({
      circleId,
      requestId: 'req-urgent-quiet',
      requesterId: aliceUserId,
      isUrgent: true,  // urgent bypasses quiet hours
    }, { pushFn: mockPush, lineFn: vi.fn() });

    expect(mockPush).toHaveBeenCalled();
    vi.useRealTimers();
  });

  test('skips member who has exceeded daily rate limit (5 non-urgent today)', async () => {
    // Seed 5 notification_logs entries for Bob today (non-urgent)
    await seedNotificationLogs(bobUserId, 5, 'new_request');

    const mockPush = vi.fn();

    await notifyCircle({
      circleId,
      requestId: 'req-rate-limited',
      requesterId: aliceUserId,
      isUrgent: false,
    }, { pushFn: mockPush, lineFn: vi.fn() });

    const bobCalls = mockPush.mock.calls.filter(c => c[0].userId === bobUserId);
    expect(bobCalls).toHaveLength(0); // Bob rate limited

    // Log entry should show skipped_rate_limit
    const { data: logs } = await serviceClient
      .from('notification_logs')
      .select()
      .eq('user_id', bobUserId)
      .eq('request_id', 'req-rate-limited');
    expect(logs?.[0].status).toBe('skipped_rate_limit');
  });
});
```

**Pass criteria:** 6/6 tests pass.

---

### 2.4 `notification_logs` RLS

**File:** `src/__tests__/rls/notification-logs.test.ts`

```typescript
describe('notification_logs RLS', () => {
  test('user can read own notification logs', async () => {
    // Seed log for Alice
    await serviceClient.from('notification_logs').insert({
      user_id: aliceUserId,
      type: 'new_request',
      channel: 'web_push',
      status: 'sent',
    });

    const { data } = await aliceClient
      .from('notification_logs')
      .select()
      .eq('user_id', aliceUserId);
    expect(data?.length).toBeGreaterThan(0);
  });

  test('user CANNOT read notification logs of another user', async () => {
    // Seed log for Bob
    await serviceClient.from('notification_logs').insert({
      user_id: bobUserId,
      type: 'new_request',
      channel: 'web_push',
      status: 'sent',
    });

    const { data } = await aliceClient
      .from('notification_logs')
      .select()
      .eq('user_id', bobUserId);
    expect(data).toHaveLength(0); // RLS blocks
  });

  test('user CANNOT insert into notification_logs (service role only)', async () => {
    const { error } = await aliceClient
      .from('notification_logs')
      .insert({
        user_id: aliceUserId,
        type: 'new_request',
        channel: 'web_push',
        status: 'sent',
      });
    expect(error).not.toBeNull(); // No user-level insert policy
  });
});
```

**Pass criteria:** 3/3 tests pass.

---

### 2.5 `remind-invite` Cron Logic

**File:** `src/__tests__/functions/remind-invite.test.ts`

```typescript
describe('remind-invite function', () => {
  test('sends reminder for invite expiring in 2 days (day 5)', async () => {
    // Seed invite created 5 days ago (expires_at = 2 days from now)
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient.from('circle_invites').insert({
      circle_id: testCircleId,
      invited_by: aliceUserId,
      email: 'pending@example.com',
      token: 'test-remind-token',
      status: 'pending',
      expires_at: expiresAt,
    });

    const mockPush = vi.fn().mockResolvedValue({ success: true });
    await runRemindInvite({ pushFn: mockPush, now: new Date() });

    // Alice (invited_by) should receive reminder
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: aliceUserId,
        type: 'invite_reminder',
      })
    );
  });

  test('does NOT send reminder for invite expiring in 5 days (too early)', async () => {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient.from('circle_invites').insert({
      circle_id: testCircleId,
      invited_by: aliceUserId,
      email: 'early@example.com',
      token: 'test-early-token',
      status: 'pending',
      expires_at: expiresAt,
    });

    const mockPush = vi.fn();
    await runRemindInvite({ pushFn: mockPush, now: new Date() });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test('does NOT send reminder for already expired invites', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient.from('circle_invites').insert({
      circle_id: testCircleId,
      invited_by: aliceUserId,
      email: 'expired@example.com',
      token: 'test-expired-token',
      status: 'pending',
      expires_at: expiresAt,
    });

    const mockPush = vi.fn();
    await runRemindInvite({ pushFn: mockPush, now: new Date() });

    // Expired invite should not trigger reminder
    const calls = mockPush.mock.calls.filter(c =>
      c[0].type === 'invite_reminder'
    );
    expect(calls).toHaveLength(0);
  });
});
```

**Pass criteria:** 3/3 tests pass.

---

## 3. E2E Tests

### 3.1 Web Push Receive Flow — Android Chrome

**File:** `tests/e2e/05-notifications.spec.ts`

**Target:** Mobile Chrome (Pixel 7 device profile)

**Note:** Web Push trong Playwright test environment cần mock `PushManager` vì không có real push server trong CI. Test thực tế trên device thật là manual step trong Definition of Done.

```typescript
// tests/e2e/05-notifications.spec.ts
test('notification permission prompt appears after login on Chrome', async ({ page, context }) => {
  // Grant notification permission
  await context.grantPermissions(['notifications']);

  // Login as test user
  await loginTestUser(page, 'bob@example.com');

  // Navigate to home — permission prompt should appear on first visit
  await page.goto('/home');
  const prompt = page.locator('[data-testid="notification-permission-prompt"]');
  await expect(prompt).toBeVisible();
});

test('tapping "Bật thông báo" triggers browser permission dialog', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);
  await loginTestUser(page, 'bob@example.com');
  await page.goto('/home');

  // Click the enable button
  await page.click('[data-testid="enable-notifications-btn"]');

  // After permission granted, prompt should disappear
  const prompt = page.locator('[data-testid="notification-permission-prompt"]');
  await expect(prompt).not.toBeVisible({ timeout: 3000 });
});

test('notification click navigates to correct request URL', async ({ page, context }) => {
  // This test simulates SW notification click via page.evaluate
  await loginTestUser(page, 'bob@example.com');
  await page.goto('/home');

  // Simulate notification click (SW notificationclick event)
  await page.evaluate((requestId) => {
    // Trigger SW notification click simulation
    window.postMessage({ type: 'test-notification-click', url: `/requests/${requestId}` }, '*');
  }, 'test-request-id');

  await expect(page).toHaveURL(/\/requests\/test-request-id/);
});
```

**Given / When / Then format:**

**Flow 1: Permission prompt**
- Given: Bob đã login, chưa grant notification permission, chưa dismiss prompt
- When: Bob mở `/home` lần đầu
- Then: Permission prompt hiển thị với nút "Bật thông báo" và "Để sau"

**Flow 2: Subscribe flow**
- Given: Bob thấy permission prompt
- When: Bob bấm "Bật thông báo" và browser grant permission
- Then: Prompt ẩn đi, subscription được lưu vào `push_subscriptions` table

**Flow 3: Notification click navigation**
- Given: Bob nhận Web Push notification với URL `/requests/req-123`
- When: Bob tap vào notification
- Then: App mở đúng trang `/requests/req-123`

**Pass criteria:**
- All Playwright tests pass trên `mobile-chrome` project
- `push_subscriptions` có row cho test user sau khi subscribe

---

### 3.2 iOS LINE Connect Flow — Manual Test

**Không thể automate đầy đủ** (cần LINE app và device thật). Test manually theo checklist:

| Step | Action | Expected |
|---|---|---|
| 1 | Mở app trên iOS Safari (không Add to Home Screen) | Hiển thị iOS install guide |
| 2 | Bấm "Bỏ qua" | Guide ẩn, hiện `LINEConnectCard` ở home |
| 3 | Bấm "Kết nối LINE" | Hướng dẫn add LINE Official Account hiển thị |
| 4 | Follow LINE Official Account của FAMICON | Webhook nhận `follow` event, lưu `line_user_id` vào `profiles` |
| 5 | Tạo aid request từ device khác (Android) | Carol nhận LINE message ≤30 giây |
| 6 | LINE message format: `[FAMICON] [tên] cần [category]...` | Format đúng theo template |
| 7 | Bấm link trong LINE message | Mở đúng `/requests/{id}` trên browser |

**Pass criteria:**
- LINE message nhận được trong ≤30 giây sau khi request tạo
- Message format đúng: no emoji nếu non-urgent, có 🆘 nếu urgent
- Link trong message dẫn đúng tới request

---

## 4. Edge Cases

| # | Scenario | Expected behavior |
|---|---|---|
| EC-5.1 | User không grant permission (dismiss prompt) | App hoạt động bình thường, không spam thêm prompt. Prompt chỉ hiện 1 lần |
| EC-5.2 | Push subscription bị 410 Gone (expired) | Auto-delete subscription row, ghi `failed` vào logs, fallback LINE nếu có |
| EC-5.3 | User không có push subscription VÀ không có `line_user_id` | Skip silently, log `skipped_rate_limit` hoặc `skipped_quiet_hours` tùy case — không error |
| EC-5.4 | 2 requests tạo cùng lúc (concurrent) | Cả 2 đều notify, không duplicate nhờ `tag` trong notification |
| EC-5.5 | LINE API trả 429 (rate limit) | Log `failed`, không throw, tiếp tục các member khác |
| EC-5.6 | `savePushSubscription` gọi khi offline | Server Action fail gracefully, client retry khi online |
| EC-5.7 | User unsubscribe khỏi Web Push qua browser | Endpoint trả 410 khi push → auto-delete row, fallback LINE |
| EC-5.8 | Member tạo request nhưng không có member khác trong vòng | `notify-circle` chạy xong mà không call push/LINE — không error |
| EC-5.9 | `remind-invite` chạy khi không có invite nào sắp expire | Function returns early, không có action, không error |

---

## 5. RLS Boundaries Summary

| Table | Test case | Expected |
|---|---|---|
| `push_subscriptions` | User A đọc subscription của User B | Trả empty array (không phải error) |
| `push_subscriptions` | User A insert subscription cho User B | RLS violation error |
| `push_subscriptions` | User A delete subscription của User B | Thao tác silent nhưng row của B không bị xóa |
| `notification_logs` | User A đọc logs của User B | Trả empty array |
| `notification_logs` | User A tự insert vào notification_logs | RLS violation error (chỉ service role được insert) |

---

## 6. Regression Check — Sprint 1-4 Features

Verify các feature từ sprint trước vẫn hoạt động sau khi thêm notification layer:

| Feature | Test | Pass criteria |
|---|---|---|
| Auth (Sprint 1) | Email OTP login flow | Login thành công, session valid |
| Onboarding (Sprint 2) | Tạo profile + join circle | Profile tạo xong, redirect đúng |
| Invite (Sprint 2) | Tạo invite link, join via link | Token valid, user join circle |
| Circle Home + Realtime (Sprint 3) | Tạo request → hiện trên feed ngay | Realtime update không bị break bởi notification SW |
| New Request (Sprint 4) | Post request form → submit | Request tạo xong, `createRequest` action vẫn call `notify-circle` đúng |
| New Request → Notification (Sprint 4+5 integration) | Tạo request → verify notification trigger | `notify-circle` được gọi sau `createRequest` insert |

---

## 7. Pass/Fail Criteria

### Tổng thể

| Tier | Target | Đo bằng |
|---|---|---|
| Unit tests | 100% pass (16 tests) | `vitest run` |
| Integration tests (Server Action + RLS) | 100% pass (15 tests) | `vitest run` với local Supabase |
| Integration tests (Edge Function logic) | 100% pass (9 tests) | `vitest run` với mocks |
| E2E Playwright (automated) | 3/3 pass trên mobile-chrome | `playwright test` |
| Manual device test (iOS LINE) | Pass checklist 7 steps | Founder test thực tế |
| Regression | 100% Sprint 1-4 features vẫn pass | Subset của E2E flows |

### Performance

| Metric | Threshold | Đo bằng |
|---|---|---|
| Web Push latency (Android) | ≤5 giây từ request tạo đến notification nhận | Manual test với stopwatch |
| LINE message latency (iOS) | ≤30 giây từ request tạo đến LINE message nhận | Manual test |
| `savePushSubscription` response time | ≤500ms | Playwright trace hoặc Network tab |
| `notify-circle` execution time | ≤3 giây cho vòng 10 members | Edge Function logs |

### Không chấp nhận (blocking merge)

- Bất kỳ RLS test nào fail
- Requester nhận notification về request của chính mình
- `notification_logs` không ghi attempt nào
- Rate limit không hoạt động (user nhận >5 non-urgent/ngày)
- Web Push không work trên Android Chrome (device thật)

---

## 8. Device Targets

| Device | Browser | Priority | Test type |
|---|---|---|---|
| Android (Pixel 7 profile) | Chrome | PRIMARY | Automated Playwright + manual |
| iPhone 14 | Safari (không Add to Home Screen) | PRIMARY | Manual (LINE flow) |
| iPhone 14 | Safari (Add to Home Screen) | SECONDARY | Manual (Web Push verify) |
| Desktop Chrome | Chrome | SECONDARY | Automated Playwright (fallback) |

---

## 9. Test Environment Setup

```bash
# 1. Start local Supabase
supabase start

# 2. Apply Sprint 5 migration
supabase db reset  # chỉ dùng trong dev — không bao giờ trên production

# 3. Seed test data
npx ts-node tests/setup-sprint5.ts

# 4. Set env vars cho test
NEXT_PUBLIC_VAPID_PUBLIC_KEY=test-vapid-public
VAPID_PRIVATE_KEY=test-vapid-private
VAPID_SUBJECT=mailto:test@example.com
LINE_CHANNEL_ACCESS_TOKEN=test-line-token

# 5. Run unit + integration tests
npx vitest run --coverage

# 6. Run E2E tests
npx playwright test tests/e2e/05-notifications.spec.ts
```

---

*Tạo bởi Docs Steward | 2026-05-17*
*Spec reference: docs/04-operations/sprint-5-spec.md*
*Strategy reference: docs/03-technical/test-strategy.md*
