/**
 * Unit tests for isQuietHoursJST — quiet hours logic for notification suppression.
 *
 * WHY: Quiet hours (22:00–07:00 JST) is a Constitution requirement (Nguyên tắc 4).
 * A bug here means either:
 *   (a) non-urgent notifications waking family members at 2am — trust destroyed, or
 *   (b) notifications silenced during the day — aid requests missed.
 *
 * Both outcomes are unacceptable for the target audience.
 *
 * JST = UTC+9. Quiet window in JST: 22:00–07:00.
 * Equivalent UTC window: 13:00 UTC (22:00 JST start) → 22:00 UTC (07:00 JST end).
 *
 * Boundary conditions tested explicitly:
 *   22:00 JST = 13:00 UTC — first quiet minute
 *   07:00 JST = 22:00 UTC — first non-quiet minute after quiet period
 */

import { describe, it, expect } from 'vitest';
import { isQuietHoursJST } from '@/lib/notifications/helpers';

describe('isQuietHoursJST', () => {
  // -------------------------------------------------------------------------
  // Within quiet window (should return true)
  // -------------------------------------------------------------------------

  it('returns true at 23:00 JST (14:00 UTC) — deep in quiet window', () => {
    // 23:00 JST = 14:00 UTC
    const time = new Date('2026-05-17T14:00:00Z');
    expect(isQuietHoursJST(time)).toBe(true);
  });

  it('returns true at 02:00 JST (17:00 UTC) — middle of the night', () => {
    // 02:00 JST = 17:00 UTC (previous day in JST terms, early morning)
    const time = new Date('2026-05-17T17:00:00Z');
    expect(isQuietHoursJST(time)).toBe(true);
  });

  it('returns true at 06:59 JST (21:59 UTC) — one minute before quiet ends', () => {
    // WHY: Verify the 07:00 boundary is exclusive (< 7, not <= 7)
    const time = new Date('2026-05-17T21:59:00Z');
    expect(isQuietHoursJST(time)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Boundary: start of quiet hours
  // -------------------------------------------------------------------------

  it('returns true at exactly 22:00 JST (13:00 UTC) — quiet hours start boundary', () => {
    // WHY: The boundary must be inclusive — 22:00 JST IS quiet hours.
    // >= 22 in the condition means 22:00 is included.
    const time = new Date('2026-05-17T13:00:00Z'); // 22:00 JST
    expect(isQuietHoursJST(time)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Boundary: end of quiet hours
  // -------------------------------------------------------------------------

  it('returns false at exactly 07:00 JST (22:00 UTC) — quiet hours end boundary', () => {
    // WHY: 07:00 JST is the first allowed minute — NOT quiet anymore.
    // < 7 in the condition means jstHour=7 falls outside the quiet window.
    const time = new Date('2026-05-16T22:00:00Z'); // 07:00 JST next day
    expect(isQuietHoursJST(time)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Outside quiet window (should return false)
  // -------------------------------------------------------------------------

  it('returns false at 09:00 JST (00:00 UTC) — mid-morning, active hours', () => {
    // 09:00 JST = 00:00 UTC
    const time = new Date('2026-05-17T00:00:00Z');
    expect(isQuietHoursJST(time)).toBe(false);
  });

  it('returns false at 12:00 JST (03:00 UTC) — noon', () => {
    const time = new Date('2026-05-17T03:00:00Z');
    expect(isQuietHoursJST(time)).toBe(false);
  });

  it('returns false at 21:59 JST (12:59 UTC) — one minute before quiet starts', () => {
    // WHY: 21:59 JST should NOT be quiet. jstHour=21 is < 22.
    const time = new Date('2026-05-17T12:59:00Z');
    expect(isQuietHoursJST(time)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Urgent bypass
  // -------------------------------------------------------------------------

  it('returns false for urgent request even at 23:00 JST (urgent bypasses quiet hours)', () => {
    // WHY CRITICAL: A family emergency at 2am must still get through.
    // Constitution Nguyên tắc 4: urgent bypass is non-negotiable.
    const time = new Date('2026-05-17T14:00:00Z'); // 23:00 JST
    expect(isQuietHoursJST(time, { isUrgent: true })).toBe(false);
  });

  it('returns false for urgent request at 02:00 JST (middle of night)', () => {
    const time = new Date('2026-05-17T17:00:00Z'); // 02:00 JST
    expect(isQuietHoursJST(time, { isUrgent: true })).toBe(false);
  });

  it('non-urgent during active hours is not affected by isUrgent flag', () => {
    // WHY: isUrgent=false during active hours should still return false (not quiet)
    const time = new Date('2026-05-17T00:00:00Z'); // 09:00 JST
    expect(isQuietHoursJST(time, { isUrgent: false })).toBe(false);
  });
});
