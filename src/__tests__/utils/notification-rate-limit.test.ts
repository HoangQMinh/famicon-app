/**
 * Unit tests for isRateLimited — daily notification rate limit logic.
 *
 * WHY: Rate limiting (max 5 non-urgent per user per day) is a Constitution
 * requirement (Nguyên tắc 4). If this logic is broken, users could be spammed
 * with notifications — a trust-destroying experience for the target audience
 * of Japanese families.
 *
 * Test strategy: inject a mock RateLimitDb so we control the count returned
 * without needing a real Supabase connection. Pure function — no side effects.
 */

import { describe, it, expect, vi } from 'vitest';
import { isRateLimited } from '@/lib/notifications/helpers';
import type { RateLimitDb } from '@/lib/notifications/helpers';

// ---------------------------------------------------------------------------
// Helper: create a mock RateLimitDb that returns a fixed count
// ---------------------------------------------------------------------------

function makeMockDb(count: number): RateLimitDb {
  return {
    countTodaySent: vi.fn().mockResolvedValue(count),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isRateLimited', () => {
  const userId = 'user-alice';

  it('returns false when user has 0 notifications today', async () => {
    const db = makeMockDb(0);
    const result = await isRateLimited(userId, 'new_request', db);
    expect(result).toBe(false);
  });

  it('returns false when user has 4 non-urgent notifications today (below limit)', async () => {
    // WHY: 4 is the last count under the limit — boundary test
    const db = makeMockDb(4);
    const result = await isRateLimited(userId, 'new_request', db);
    expect(result).toBe(false);
  });

  it('returns true when user has exactly 5 non-urgent notifications today (at limit)', async () => {
    // WHY: 5 is the exact limit — must be blocked, not allowed
    const db = makeMockDb(5);
    const result = await isRateLimited(userId, 'new_request', db);
    expect(result).toBe(true);
  });

  it('returns true when user has more than 5 notifications today (above limit)', async () => {
    // WHY: Verify the check is >=5, not ==5
    const db = makeMockDb(10);
    const result = await isRateLimited(userId, 'new_request', db);
    expect(result).toBe(true);
  });

  it('returns false for urgent_request regardless of count (urgent bypasses rate limit)', async () => {
    // WHY CRITICAL: Urgent requests must ALWAYS go through — a family emergency
    // should never be silently dropped because the user hit the daily limit.
    // Constitution Nguyên tắc 4: urgent bypass is non-negotiable.
    const db = makeMockDb(100);
    const result = await isRateLimited(userId, 'urgent_request', db);
    expect(result).toBe(false);
  });

  it('does not call DB when type is urgent_request (short-circuit)', async () => {
    // WHY: Avoid unnecessary DB round-trip for urgent notifications
    const db = makeMockDb(0);
    await isRateLimited(userId, 'urgent_request', db);
    expect(db.countTodaySent).not.toHaveBeenCalled();
  });

  it('calls DB with the correct userId when checking rate limit', async () => {
    const db = makeMockDb(0);
    await isRateLimited(userId, 'new_request', db);
    expect(db.countTodaySent).toHaveBeenCalledWith(userId);
  });

  it('each user has an independent rate limit counter', async () => {
    // WHY: The rate limit is per-user. Bob hitting the limit must not affect Carol.
    const dbBob = makeMockDb(5);   // Bob at limit
    const dbCarol = makeMockDb(2); // Carol not at limit

    const bobLimited = await isRateLimited('user-bob', 'new_request', dbBob);
    const carolLimited = await isRateLimited('user-carol', 'new_request', dbCarol);

    expect(bobLimited).toBe(true);
    expect(carolLimited).toBe(false);
  });
});
