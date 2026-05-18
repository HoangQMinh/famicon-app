/**
 * Rate limiter behavior tests for signInWithEmail.
 *
 * WHY: The rate limiter uses a module-level Map that is NOT exported.
 * Testing through the public signInWithEmail function is the correct approach —
 * it tests the observable contract (what the caller experiences) rather than
 * internal state, which could change without breaking behavior.
 *
 * Strategy:
 *  - Mock @/lib/supabase/server-admin to return allowed=true from isEmailAllowed
 *  - Mock @/lib/supabase/server to return a fake supabase client
 *  - Mock next/navigation (redirect) to avoid Next.js runtime dependency
 *  - Each test file runs in an isolated module instance (vitest isolate:true),
 *    so the rate limit Map resets between test FILES. Within a file, order matters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — declared before any dynamic imports so vi.mock hoisting works
// ---------------------------------------------------------------------------

// Mock next/navigation so redirect() does not throw in test env
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock next/headers (used by createClient via cookies())
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock the Supabase SSR server client — signInWithOtp always succeeds here
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOtp: vi.fn(async () => ({ error: null })),
    },
  })),
}));

// Mock the admin client so isEmailAllowed uses our controlled data
vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      // maybeSingle returns a pending invite → email is allowed
      maybeSingle: vi.fn(async () => ({ data: { id: 'invite-1' }, error: null })),
    })),
    auth: {
      admin: {
        getUserByEmail: vi.fn(async () => ({ data: null, error: { message: 'not found' } })),
      },
    },
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('signInWithEmail — rate limiter behavior', () => {
  // IMPORTANT: each describe block re-imports the module fresh because
  // vitest's module isolation resets the Map per FILE, not per test.
  // Within this file, we must use a UNIQUE email per "window" to isolate tests.

  it('rejects invalid email before hitting rate limiter', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    const result = await signInWithEmail('not-an-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email không hợp lệ');
    }
  });

  it('allows 1st OTP request for a new email', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    const result = await signInWithEmail('rate1@example.com');
    expect(result.success).toBe(true);
  });

  it('allows 2nd OTP request within the window', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    // Pre-fill 1st request
    await signInWithEmail('rate2@example.com');
    const result = await signInWithEmail('rate2@example.com');
    expect(result.success).toBe(true);
  });

  it('allows 3rd OTP request within the window (boundary — exactly at limit)', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    await signInWithEmail('rate3@example.com');
    await signInWithEmail('rate3@example.com');
    const result = await signInWithEmail('rate3@example.com');
    // 3rd request = count goes from 2 → 3, which equals RATE_LIMIT_MAX
    // isRateLimited checks `entry.count >= RATE_LIMIT_MAX` BEFORE incrementing,
    // so the 3rd call sees count=2 (< 3) and allows it, then sets count=3.
    expect(result.success).toBe(true);
  });

  it('blocks 4th OTP request within the window — rate limited', async () => {
    /**
     * WHY THIS IS THE CRITICAL TEST:
     * RATE_LIMIT_MAX = 3. On the 4th call, entry.count is 3 (>= 3) → blocked.
     * This protects against OTP enumeration / spam without Redis.
     */
    const { signInWithEmail } = await import('@/app/actions/auth');
    await signInWithEmail('rate4@example.com');
    await signInWithEmail('rate4@example.com');
    await signInWithEmail('rate4@example.com');
    const result = await signInWithEmail('rate4@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.'
      );
    }
  });

  it('each email has an independent rate limit counter', async () => {
    /**
     * WHY: Verify the Map is keyed by email, not shared globally.
     * If one user hits the limit, others must not be affected.
     */
    const { signInWithEmail } = await import('@/app/actions/auth');
    // Exhaust limit for emailA
    await signInWithEmail('emailA@example.com');
    await signInWithEmail('emailA@example.com');
    await signInWithEmail('emailA@example.com');
    await signInWithEmail('emailA@example.com'); // 4th → blocked

    // emailB should still be on its first request
    const resultB = await signInWithEmail('emailB@example.com');
    expect(resultB.success).toBe(true);
  });

  it('accepts FormData as input (alternative call signature)', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    const formData = new FormData();
    formData.append('email', 'formdata@example.com');
    const result = await signInWithEmail(formData);
    expect(result.success).toBe(true);
  });

  it('rejects FormData with missing email field', async () => {
    const { signInWithEmail } = await import('@/app/actions/auth');
    const formData = new FormData();
    // No 'email' field appended
    const result = await signInWithEmail(formData);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rate window reset — simulated via fake timers
// ---------------------------------------------------------------------------

describe('signInWithEmail — rate window reset after 10 minutes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests again after the 10-minute window expires', async () => {
    /**
     * WHY: The window reset is the escape hatch for legitimate users who hit
     * the limit. Without this test, a bug could leave users permanently locked
     * out in the same process lifetime.
     *
     * Uses a unique email to avoid cross-test state contamination.
     */
    const { signInWithEmail } = await import('@/app/actions/auth');
    const email = 'resettest@example.com';

    // Exhaust 3 allowed requests, then trigger the block
    await signInWithEmail(email);
    await signInWithEmail(email);
    await signInWithEmail(email);
    const blocked = await signInWithEmail(email);
    expect(blocked.success).toBe(false);

    // Advance time past the 10-minute window
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);

    // Next request should open a new window and succeed
    const afterReset = await signInWithEmail(email);
    expect(afterReset.success).toBe(true);
  });

  it('does not reset window before 10 minutes are up', async () => {
    /**
     * WHY: Boundary test — the window must be strictly > 10 minutes, not >=.
     * A premature reset would weaken the rate-limit protection.
     */
    const { signInWithEmail } = await import('@/app/actions/auth');
    const email = 'noreset@example.com';

    await signInWithEmail(email);
    await signInWithEmail(email);
    await signInWithEmail(email);
    await signInWithEmail(email); // blocked

    // Advance time to just before the window expires
    vi.advanceTimersByTime(10 * 60 * 1000 - 1);

    const stillBlocked = await signInWithEmail(email);
    expect(stillBlocked.success).toBe(false);
  });
});
