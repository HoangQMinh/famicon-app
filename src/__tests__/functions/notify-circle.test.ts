/**
 * Integration tests for notify-circle function logic.
 *
 * WHY: notify-circle is the core notification dispatch function. Bugs here mean:
 *   - Requester notified of their own request (bad UX, Constitution violation)
 *   - Urgent request suppressed during quiet hours (family emergency missed)
 *   - Rate limit not enforced (spam, trust destroyed)
 *   - notification_logs not written (AC-5.10 violated, rate limit logic broken)
 *
 * Test approach: The Deno Edge Function imports Deno.env and Deno.serve which
 * are NOT available in Vitest's Node.js environment. We test the pure logic
 * functions extracted to @/lib/notifications/helpers instead, and use a
 * mock-based processNotifyCircle simulation for integration scenarios.
 *
 * The helpers (isQuietHoursJST, isRateLimited, formatLineMessage) are tested
 * separately in their own unit test files. This file tests the ORCHESTRATION
 * logic — how the function combines helpers, DB queries, and send calls.
 *
 * DI pattern: pushFn and lineFn are injected mocks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isQuietHoursJST, isRateLimited, formatLineMessage } from '@/lib/notifications/helpers';
import type { RateLimitDb } from '@/lib/notifications/helpers';

// ---------------------------------------------------------------------------
// Types (mirroring notify-circle/index.ts types for testing)
// ---------------------------------------------------------------------------

interface AidRequestRecord {
  id: string;
  circle_id: string;
  requester_id: string;
  category: string;
  description: string;
  is_urgent: boolean;
}

interface CircleMember {
  user_id: string;
  line_user_id: string | null;
  push_subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth_key: string;
  }>;
}

interface NotifyDeps {
  pushFn: (sub: { endpoint: string; p256dh: string; auth_key: string }, payload: object) => Promise<{ ok: boolean; expired: boolean }>;
  lineFn: (lineUserId: string, message: string) => Promise<{ ok: boolean }>;
  logFn:  (entry: object) => Promise<void>;
}

interface NotifyCircleArgs {
  record: AidRequestRecord;
  members: CircleMember[];
  isQuietHours: boolean;
  rateLimitedUserIds: string[];
}

// ---------------------------------------------------------------------------
// Test-only orchestration function
//
// This simulates the core loop of processNotifyCircle without any Deno.env
// dependency. It accepts members directly (no DB call) and delegates to injected
// pushFn/lineFn/logFn.
//
// WHY A SEPARATE FUNCTION: We cannot import processNotifyCircle from the Edge
// Function because it calls Deno.env and createClient with Deno env vars at
// import time. Extracting the loop logic here lets us test the orchestration
// contract without Deno.
// ---------------------------------------------------------------------------

async function runNotifyOrchestrator(
  args: NotifyCircleArgs,
  deps: NotifyDeps
): Promise<void> {
  const { record, members, isQuietHours, rateLimitedUserIds } = args;

  for (const member of members) {
    // Skip the requester — they should not be notified of their own request
    if (member.user_id === record.requester_id) continue;

    // Quiet hours: skip non-urgent during 22:00–07:00 JST
    if (!record.is_urgent && isQuietHours) {
      await deps.logFn({
        user_id:    member.user_id,
        type:       record.is_urgent ? 'urgent_request' : 'new_request',
        channel:    'web_push',
        status:     'skipped_quiet_hours',
        request_id: record.id,
      });
      continue;
    }

    // Rate limit: skip non-urgent if user exceeded 5/day
    if (!record.is_urgent && rateLimitedUserIds.includes(member.user_id)) {
      await deps.logFn({
        user_id:    member.user_id,
        type:       'new_request',
        channel:    'web_push',
        status:     'skipped_rate_limit',
        request_id: record.id,
      });
      continue;
    }

    let pushSucceeded = false;

    if (member.push_subscriptions.length > 0) {
      const pushPayload = {
        title: record.is_urgent ? '🆘 Yêu cầu gấp trong vòng' : 'Yêu cầu mới trong vòng',
        body:  `Vòng tròn có yêu cầu mới: ${record.category}.`,
        url:   `/requests/${record.id}`,
        tag:   `request-${record.id}`,
      };

      for (const sub of member.push_subscriptions) {
        const { ok, expired } = await deps.pushFn(sub, pushPayload);
        if (ok) {
          pushSucceeded = true;
          await deps.logFn({
            user_id:    member.user_id,
            type:       record.is_urgent ? 'urgent_request' : 'new_request',
            channel:    'web_push',
            status:     'sent',
            request_id: record.id,
          });
          break;
        }
        if (expired) {
          // In real function: delete stale subscription from DB. Here: just continue.
        }
      }

      if (!pushSucceeded) {
        await deps.logFn({
          user_id:    member.user_id,
          type:       record.is_urgent ? 'urgent_request' : 'new_request',
          channel:    'web_push',
          status:     'failed',
          request_id: record.id,
        });
      }
    }

    // LINE fallback: send if push failed/no subscription AND member has line_user_id
    if (!pushSucceeded && member.line_user_id) {
      const lineMessage = formatLineMessage({
        id:          record.id,
        is_urgent:   record.is_urgent,
        category:    record.category,
        description: record.description,
      });
      const { ok: lineOk } = await deps.lineFn(member.line_user_id, lineMessage);
      await deps.logFn({
        user_id:    member.user_id,
        type:       record.is_urgent ? 'urgent_request' : 'new_request',
        channel:    'line',
        status:     lineOk ? 'sent' : 'failed',
        request_id: record.id,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ALICE_USER_ID = 'alice-uuid-0001'; // requester
const BOB_USER_ID   = 'bob-uuid-0002';   // push subscriber
const CAROL_USER_ID = 'carol-uuid-0003'; // LINE only
const CAROL_LINE_ID = 'Ucarol_line_id';

const BASE_RECORD: AidRequestRecord = {
  id:           'req-test-001',
  circle_id:    'circle-001',
  requester_id: ALICE_USER_ID,
  category:     'pickup',
  description:  'Cần đón con lúc 15:30',
  is_urgent:    false,
};

const MEMBERS: CircleMember[] = [
  {
    user_id:  ALICE_USER_ID,
    line_user_id: null,
    push_subscriptions: [],
  },
  {
    user_id:  BOB_USER_ID,
    line_user_id: null,
    push_subscriptions: [
      { endpoint: 'https://fcm.googleapis.com/bob', p256dh: 'bob-p256dh', auth_key: 'bob-auth' },
    ],
  },
  {
    user_id:  CAROL_USER_ID,
    line_user_id: CAROL_LINE_ID,
    push_subscriptions: [], // Carol: LINE only
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('notify-circle orchestration logic', () => {
  let mockPush: ReturnType<typeof vi.fn>;
  let mockLine: ReturnType<typeof vi.fn>;
  let mockLog:  ReturnType<typeof vi.fn>;
  let deps:     NotifyDeps;

  beforeEach(() => {
    mockPush = vi.fn().mockResolvedValue({ ok: true, expired: false });
    mockLine = vi.fn().mockResolvedValue({ ok: true });
    mockLog  = vi.fn().mockResolvedValue(undefined);
    deps     = { pushFn: mockPush, lineFn: mockLine, logFn: mockLog };
  });

  // -------------------------------------------------------------------------
  // Critical: requester exclusion
  // -------------------------------------------------------------------------

  it('does NOT notify the requester (Alice) about her own request', async () => {
    // WHY CRITICAL: Receiving your own request notification is confusing and
    // potentially harmful — "Did I just get helped? No, I sent this myself."
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    const alicePushCalls = mockPush.mock.calls.filter(c =>
      MEMBERS[0].push_subscriptions.some(s => s.endpoint === (c[0] as { endpoint?: string }).endpoint)
    );
    // Alice has no subscriptions — but verify log has no entry for Alice as recipient
    const aliceLogs = mockLog.mock.calls.filter(c => (c[0] as { user_id: string }).user_id === ALICE_USER_ID);
    expect(aliceLogs).toHaveLength(0);
  });

  it('notifies Bob via Web Push (Bob has push subscription)', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    // pushFn should have been called for Bob's subscription
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://fcm.googleapis.com/bob' }),
      expect.objectContaining({ url: `/requests/${BASE_RECORD.id}` })
    );
  });

  it('notifies Carol via LINE (Carol has no push subscription but has line_user_id)', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    expect(mockLine).toHaveBeenCalledWith(
      CAROL_LINE_ID,
      expect.stringContaining('[FAMICON]')
    );
  });

  // -------------------------------------------------------------------------
  // Quiet hours suppression
  // -------------------------------------------------------------------------

  it('skips non-urgent notifications during quiet hours', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: true, rateLimitedUserIds: [] },
      deps
    );

    // No push or LINE calls should be made
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLine).not.toHaveBeenCalled();
  });

  it('logs skipped_quiet_hours status for each non-requester member during quiet hours', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: true, rateLimitedUserIds: [] },
      deps
    );

    const skippedLogs = mockLog.mock.calls.filter(
      c => (c[0] as { status: string }).status === 'skipped_quiet_hours'
    );
    // Bob and Carol should each have a skipped_quiet_hours log (Alice excluded as requester)
    expect(skippedLogs).toHaveLength(2);
  });

  it('sends urgent request even during quiet hours (urgent bypasses quiet hours)', async () => {
    // WHY CRITICAL: A family emergency at 2am MUST reach members.
    const urgentRecord = { ...BASE_RECORD, is_urgent: true };

    await runNotifyOrchestrator(
      { record: urgentRecord, members: MEMBERS, isQuietHours: true, rateLimitedUserIds: [] },
      deps
    );

    // Bob should receive push even during quiet hours
    expect(mockPush).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  it('skips Bob when he is rate limited (5 non-urgent today)', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [BOB_USER_ID] },
      deps
    );

    // Bob rate-limited: no push call for Bob
    expect(mockPush).not.toHaveBeenCalled();

    // Bob should have a skipped_rate_limit log
    const bobRateLogs = mockLog.mock.calls.filter(
      c => (c[0] as { user_id: string; status: string }).user_id === BOB_USER_ID &&
           (c[0] as { status: string }).status === 'skipped_rate_limit'
    );
    expect(bobRateLogs).toHaveLength(1);
  });

  it('sends urgent request to rate-limited user (urgent bypasses rate limit)', async () => {
    const urgentRecord = { ...BASE_RECORD, is_urgent: true };

    await runNotifyOrchestrator(
      { record: urgentRecord, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [BOB_USER_ID] },
      deps
    );

    // Bob rate-limited but request is urgent → push must go through
    expect(mockPush).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Notification logging
  // -------------------------------------------------------------------------

  it('logs each notification attempt to notification_logs', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    // At minimum: Bob (push sent) and Carol (line sent)
    expect(mockLog).toHaveBeenCalledTimes(2);
  });

  it('logs with correct request_id on each entry', async () => {
    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    mockLog.mock.calls.forEach(callArgs => {
      expect((callArgs[0] as { request_id: string }).request_id).toBe(BASE_RECORD.id);
    });
  });

  // -------------------------------------------------------------------------
  // LINE fallback when push fails (410 Gone)
  // -------------------------------------------------------------------------

  it('falls back to LINE when Web Push returns expired (410 Gone)', async () => {
    // WHY: Expired subscriptions (410) must trigger LINE fallback, not silent failure.
    const bobWithLine: CircleMember = {
      ...MEMBERS[1],
      line_user_id: 'Ubob_line_id', // Bob also has LINE
    };
    const membersWithBobLine = [MEMBERS[0], bobWithLine, MEMBERS[2]];

    mockPush.mockResolvedValue({ ok: false, expired: true }); // Push fails with 410

    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: membersWithBobLine, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    // Bob's push failed → LINE fallback triggered
    expect(mockLine).toHaveBeenCalledWith(
      'Ubob_line_id',
      expect.any(String)
    );
  });

  // -------------------------------------------------------------------------
  // Edge case: circle with only 1 member (the requester)
  // -------------------------------------------------------------------------

  it('does nothing when the only circle member is the requester', async () => {
    // WHY: A circle of 1 should not error. processNotifyCircle must handle
    // this gracefully — looping over 0 non-requester members and returning cleanly.
    const onlyAlice: CircleMember[] = [MEMBERS[0]]; // Only Alice (the requester)

    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: onlyAlice, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLine).not.toHaveBeenCalled();
    expect(mockLog).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Constitution compliance: notification payload must not contain PII
  // -------------------------------------------------------------------------

  it('push payload title does not contain PII (no requester name)', async () => {
    // WHY CONSTITUTION: Notification title must NOT contain the requester's name,
    // address, or station. The spec mandates generic titles.
    let capturedPayload: Record<string, unknown> | null = null;
    mockPush.mockImplementation((_sub, payload) => {
      capturedPayload = payload as Record<string, unknown>;
      return Promise.resolve({ ok: true, expired: false });
    });

    await runNotifyOrchestrator(
      { record: BASE_RECORD, members: MEMBERS, isQuietHours: false, rateLimitedUserIds: [] },
      deps
    );

    expect(capturedPayload).not.toBeNull();
    // Title must be generic — no personal name
    expect(capturedPayload!['title']).not.toContain('Alice');
    expect(capturedPayload!['title']).toMatch(/Yêu cầu/); // Generic title
  });
});

// ---------------------------------------------------------------------------
// Quiet hours helper — integration with isQuietHoursJST
// ---------------------------------------------------------------------------

describe('quiet hours integration with isQuietHoursJST', () => {
  it('23:00 JST (14:00 UTC) is classified as quiet hours', () => {
    const quietTime = new Date('2026-05-17T14:00:00Z');
    expect(isQuietHoursJST(quietTime)).toBe(true);
  });

  it('09:00 JST (00:00 UTC) is classified as active hours', () => {
    const activeTime = new Date('2026-05-17T00:00:00Z');
    expect(isQuietHoursJST(activeTime)).toBe(false);
  });

  it('urgent bypasses quiet hours determination', () => {
    const quietTime = new Date('2026-05-17T14:00:00Z');
    expect(isQuietHoursJST(quietTime, { isUrgent: true })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rate limit helper — integration with isRateLimited
// ---------------------------------------------------------------------------

describe('rate limit integration', () => {
  it('isRateLimited returns false when DB count is 4 (under limit)', async () => {
    const db: RateLimitDb = { countTodaySent: vi.fn().mockResolvedValue(4) };
    expect(await isRateLimited('user-bob', 'new_request', db)).toBe(false);
  });

  it('isRateLimited returns true when DB count is 5 (at limit)', async () => {
    const db: RateLimitDb = { countTodaySent: vi.fn().mockResolvedValue(5) };
    expect(await isRateLimited('user-bob', 'new_request', db)).toBe(true);
  });

  it('isRateLimited returns false for urgent regardless of count', async () => {
    const db: RateLimitDb = { countTodaySent: vi.fn().mockResolvedValue(100) };
    expect(await isRateLimited('user-bob', 'urgent_request', db)).toBe(false);
  });
});
