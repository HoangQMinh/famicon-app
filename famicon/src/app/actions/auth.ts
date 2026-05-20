'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { emailSchema, otpSchema } from '@/lib/schemas/auth';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// In-memory rate limiter (MVP — no Redis required)
// Tracks OTP send attempts per email address.
// Structure: email → { count: number; firstAt: number }
// Resets automatically after RATE_WINDOW_MS from the first attempt in a window.
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  firstAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Returns true when the email has exceeded the allowed OTP request rate.
 * Mutates the store on each call to track the attempt.
 */
function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(email);

  if (!entry || now - entry.firstAt > RATE_WINDOW_MS) {
    // First request in this window — start a new entry
    rateLimitStore.set(email, { count: 1, firstAt: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  // Increment within the current window
  rateLimitStore.set(email, { count: entry.count + 1, firstAt: entry.firstAt });
  return false;
}

// ---------------------------------------------------------------------------
// Invite gating
// ---------------------------------------------------------------------------

/**
 * Checks whether an email address is permitted to sign in:
 *   1. Has a pending, non-expired invite in circle_invites, OR
 *   2. Is already an active circle member (looked up by matching auth.users email).
 *
 * Must use the service-role client because the user is not yet authenticated —
 * the anon-key RLS policies (invites_select_inviter, members_select_same_circle)
 * require auth.uid() which is null at this point.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
async function isEmailAllowed(email: string): Promise<boolean> {
  const admin = createAdminClient();

  // Check 1: pending invite not yet expired
  const { data: invite, error: inviteError } = await admin
    .from('circle_invites')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (inviteError) {
    // Log server-side only; never expose DB errors to client
    logger.error('[auth] invite gate check failed:', inviteError.code);
  }

  if (invite) return true;

  // Check 2: email has an accepted invite (i.e. joined via invite flow).
  const { data: acceptedInvite } = await admin
    .from('circle_invites')
    .select('id')
    .eq('email', email)
    .eq('status', 'accepted')
    .maybeSingle();

  if (acceptedInvite) return true;

  // Check 3: email already has a Supabase auth account (open-registration users
  // who signed up via /register never receive a circle_invites entry — they are
  // legitimate returning users and must be allowed to sign in).
  // Uses is_email_registered() RPC (SECURITY DEFINER) which accesses auth.users.
  const { data: isRegistered } = await admin.rpc('is_email_registered', {
    p_email: email,
  });

  return isRegistered === true;
}

/**
 * Extracts an email string from either a plain string or a FormData object.
 * Handles both call patterns used by the client pages.
 */
function extractEmail(input: string | FormData): string {
  if (typeof input === 'string') return input;
  const value = input.get('email');
  return typeof value === 'string' ? value : '';
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Step 1 — Send OTP email.
 *
 * Accepts a plain email string OR FormData with an "email" field.
 * Two call sites exist in the frontend:
 *   - auth/page.tsx: passes FormData
 *   - auth/verify/page.tsx resend: passes a plain string
 *
 * Flow: validate → invite gate → rate limit → supabase.auth.signInWithOtp
 */
export async function signInWithEmail(
  input: string | FormData
): Promise<ActionResult<null>> {
  const raw = extractEmail(input);
  const parsed = emailSchema.safeParse({ email: raw });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors.email?.[0] ?? 'Email không hợp lệ',
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  // Invite gating — only invited or existing members may sign in
  const allowed = await isEmailAllowed(normalizedEmail);
  if (!allowed) {
    return {
      success: false,
      error: 'Email này chưa được mời vào vòng tròn.',
    };
  }

  // Rate limiting — max 3 OTP sends per email per 10 minutes
  if (isRateLimited(normalizedEmail)) {
    return {
      success: false,
      error: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      // Allow account creation so newly invited users can register on first login
      shouldCreateUser: true,
    },
  });

  if (error) {
    logger.error('[auth] signInWithOtp failed:', error.code);
    return {
      success: false,
      error: 'Không thể gửi mã OTP. Vui lòng thử lại.',
    };
  }

  return { success: true, data: null };
}

/**
 * Step 2 — Verify the 6-digit OTP and establish a session.
 *
 * Accepts plain email and token strings.
 * Returns { redirectTo: '/circle' } on success so the client component can
 * perform a client-side navigation as a fallback in case the server-side
 * redirect() is intercepted (e.g., dynamic import + useTransition boundary).
 *
 * On success: calls redirect('/circle') — throws internally (Next.js mechanism).
 * On failure: returns ActionResult with a Vietnamese user-facing error.
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = otpSchema.safeParse({ email, token });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError =
      fieldErrors.token?.[0] ??
      fieldErrors.email?.[0] ??
      'Thông tin không hợp lệ';
    return { success: false, error: firstError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: 'email',
  });

  if (error) {
    logger.error('[auth] verifyOtp failed:', error.code);
    return {
      success: false,
      error: 'OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.',
    };
  }

  // Return redirectTo for client-side navigation.
  // Do NOT call redirect() here — Supabase session cookies must be written to
  // the response before the action returns. Calling redirect() throws
  // NEXT_REDIRECT before cookies are flushed, causing the session to be lost.
  return { success: true, data: { redirectTo: '/home' } };
}

/**
 * Step 1 (open registration) — Send OTP email without invite gate.
 *
 * Identical to signInWithEmail() except isEmailAllowed() is skipped so any
 * email address can register. Rate limiting still applies.
 *
 * Call sites: /register page.
 */
export async function signUpWithEmail(
  input: string | FormData
): Promise<ActionResult<null>> {
  const raw = extractEmail(input);
  const parsed = emailSchema.safeParse({ email: raw });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors.email?.[0] ?? 'Email không hợp lệ',
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  // Rate limiting — same budget as signInWithEmail (shared store, same key)
  if (isRateLimited(normalizedEmail)) {
    return {
      success: false,
      error: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    logger.error('[auth] signUpWithEmail signInWithOtp failed:', error.code);
    return {
      success: false,
      error: 'Không thể gửi mã OTP. Vui lòng thử lại.',
    };
  }

  return { success: true, data: null };
}

/**
 * Sign out the current user and redirect to the auth page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth');
}
