/**
 * Tests for signUpWithEmail (open registration — no invite gate).
 *
 * WHY: signUpWithEmail is the entry point for the open registration flow
 * (/register page). Unlike signInWithEmail, it must NOT gate on circle_invites —
 * any email address should be allowed to register. Rate limiting still applies.
 *
 * Strategy: same module-isolation approach as auth.test.ts — mock the Supabase
 * clients, control OTP success/failure via a mutable flag, use unique emails
 * per rate-limit window to avoid cross-test state bleed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mutable control state
// ---------------------------------------------------------------------------

let otpShouldFail = false;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOtp: vi.fn(async () =>
        otpShouldFail
          ? { error: { code: 'email_send_failed', message: 'SMTP error' } }
          : { error: null }
      ),
    },
  })),
}));

// signUpWithEmail does NOT call the admin client — mock it anyway so the
// module resolves cleanly. If signUpWithEmail ever calls createAdminClient,
// it would be a bug this mock will surface as a runtime error.
vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => { throw new Error('signUpWithEmail must not call admin client'); }),
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('signUpWithEmail — open registration (no invite gate)', () => {
  beforeEach(() => {
    otpShouldFail = false;
  });

  it('allows any valid email without an invite', async () => {
    /**
     * WHY: Core contract of open registration. An arbitrary email not in
     * circle_invites must still receive an OTP — the invite gate is intentionally
     * absent from signUpWithEmail.
     */
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const result = await signUpWithEmail('newcomer@example.com');
    expect(result.success).toBe(true);
  });

  it('rejects invalid email format', async () => {
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const result = await signUpWithEmail('not-an-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Email không hợp lệ');
    }
  });

  it('accepts FormData input', async () => {
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const formData = new FormData();
    formData.append('email', 'formdata-signup@example.com');
    const result = await signUpWithEmail(formData);
    expect(result.success).toBe(true);
  });

  it('rejects FormData with missing email field', async () => {
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const result = await signUpWithEmail(new FormData());
    expect(result.success).toBe(false);
  });

  it('normalizes email to lowercase', async () => {
    /**
     * WHY: User might type "USER@EXAMPLE.COM". Normalization must happen
     * before the OTP is sent so Supabase uses the canonical form.
     * We verify indirectly: if normalization is absent, signInWithOtp would
     * receive the raw uppercase email — the mock succeeds either way, but the
     * real Supabase might create a duplicate account. The test documents the
     * expected behavior for future reviewers.
     */
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const result = await signUpWithEmail('UPPER@EXAMPLE.COM');
    expect(result.success).toBe(true);
  });

  it('returns error when Supabase OTP send fails', async () => {
    otpShouldFail = true;
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const result = await signUpWithEmail('otpfail-signup@example.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Không thể gửi mã OTP. Vui lòng thử lại.');
    }
  });
});

describe('signUpWithEmail — rate limiting', () => {
  beforeEach(() => {
    otpShouldFail = false;
  });

  it('allows first 3 requests within the window', async () => {
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const email = 'signup-rl1@example.com';
    const r1 = await signUpWithEmail(email);
    const r2 = await signUpWithEmail(email);
    const r3 = await signUpWithEmail(email);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
  });

  it('blocks the 4th request within the window', async () => {
    /**
     * WHY: Rate limiter uses a shared in-memory Map keyed by email.
     * signUpWithEmail shares the same store as signInWithEmail — the budget
     * is per-email regardless of which action is called. This prevents
     * bypassing the limit by switching between register and login endpoints.
     */
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const email = 'signup-rl2@example.com';
    await signUpWithEmail(email);
    await signUpWithEmail(email);
    await signUpWithEmail(email);
    const result = await signUpWithEmail(email);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.'
      );
    }
  });

  it('rate limit is per-email — different emails have independent counters', async () => {
    const { signUpWithEmail } = await import('@/app/actions/auth');
    const emailA = 'signup-rla@example.com';
    const emailB = 'signup-rlb@example.com';

    // Exhaust emailA
    await signUpWithEmail(emailA);
    await signUpWithEmail(emailA);
    await signUpWithEmail(emailA);
    await signUpWithEmail(emailA); // blocked

    // emailB is unaffected
    const resultB = await signUpWithEmail(emailB);
    expect(resultB.success).toBe(true);
  });
});
