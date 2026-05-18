'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { emailSchema } from '@/lib/schemas/auth';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a circle_invites row joined with the parent circle name. */
export interface CircleInvite {
  id: string;
  circle_id: string;
  invited_by: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://famicon.vercel.app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a 32-character invite token from a UUID (dashes stripped).
 * crypto.randomUUID() is available in Node 18+ and all Edge environments.
 */
function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Returns an ISO string for `now() + 7 days`.
 */
function sevenDaysFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// createInvite
// ---------------------------------------------------------------------------

/**
 * Creates a new invite for the given email address.
 *
 * The caller must be an active member of at least one circle.
 * Duplicate-invite and already-member guards prevent spam.
 *
 * Flow:
 *   1. Guard auth
 *   2. Validate email
 *   3. Resolve caller's circle_id
 *   4. Duplicate / existing-member checks
 *   5. Generate token, insert invite (service role)
 *   6. Return invite metadata + URL
 */
export async function createInvite(
  email: string
): Promise<
  ActionResult<{
    invite_id: string;
    token: string;
    invite_url: string;
    expires_at: string;
  }>
> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate email ---
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors.email?.[0] ?? 'Email không hợp lệ',
    };
  }
  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  // --- 3. Resolve caller's circle_id ---
  // RLS "members_select_same_circle" allows reading own rows.
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    logger.error('[invites] circle_members lookup failed:', memberError.code);
    return { success: false, error: 'Không thể xác định vòng tròn của bạn.' };
  }

  if (!membership) {
    return {
      success: false,
      error: 'Bạn chưa thuộc vòng tròn nào để mời thành viên.',
    };
  }

  const circleId = membership.circle_id;
  const admin = createAdminClient();

  // --- 4a. Check for duplicate pending invite ---
  const { data: existingInvite, error: dupInviteError } = await admin
    .from('circle_invites')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('circle_id', circleId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (dupInviteError) {
    logger.error('[invites] duplicate invite check failed:', dupInviteError.code);
    return { success: false, error: 'Không thể kiểm tra lời mời. Vui lòng thử lại.' };
  }

  if (existingInvite) {
    return { success: false, error: 'Email này đã được mời rồi.' };
  }

  // --- 4b. Check if email already belongs to an active member ---
  // We determine membership via invite history: a previously accepted invite for
  // this email + circle_id means the user went through the flow and is a member.
  // This avoids needing auth.admin.getUserByEmail which is unavailable in
  // @supabase/auth-js v2.x (only getUserById exists).
  const { data: acceptedInvite, error: acceptedInviteError } = await admin
    .from('circle_invites')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('circle_id', circleId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (acceptedInviteError) {
    logger.error('[invites] accepted invite check failed:', acceptedInviteError.code);
    return { success: false, error: 'Không thể kiểm tra tư cách thành viên. Vui lòng thử lại.' };
  }

  if (acceptedInvite) {
    return { success: false, error: 'Email này đã là thành viên.' };
  }

  // --- 5. Generate token and insert ---
  const token = generateToken();
  const expiresAt = sevenDaysFromNow();

  const { data: newInvite, error: insertError } = await admin
    .from('circle_invites')
    .insert({
      circle_id: circleId,
      invited_by: user.id,
      email: normalizedEmail,
      token,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (insertError || !newInvite) {
    logger.error('[invites] insert failed:', insertError?.code);
    return { success: false, error: 'Không thể tạo lời mời. Vui lòng thử lại.' };
  }

  // --- 6. Return ---
  return {
    success: true,
    data: {
      invite_id: newInvite.id,
      token,
      invite_url: `${BASE_URL}/join/${token}`,
      expires_at: expiresAt,
    },
  };
}

// ---------------------------------------------------------------------------
// acceptInvite
// ---------------------------------------------------------------------------

/**
 * Accepts a pending invite identified by its token.
 *
 * Intended to be called after the user has completed verifyOtp + createProfile.
 * Handles returning members per D-026: reactivates their circle_members row
 * instead of inserting a duplicate (unique constraint on circle_id + user_id).
 *
 * Flow:
 *   1. Guard auth
 *   2. Fetch invite (service role — user may not yet be a circle member)
 *   3. Check returning-member status
 *   4. Reactivate or insert circle_members (service role)
 *   5. Mark invite accepted
 *   6. Return circle info + is_returning_member flag
 */
export async function acceptInvite(
  token: string
): Promise<
  ActionResult<{
    circle_id: string;
    circle_name: string;
    is_returning_member: boolean;
  }>
> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // Validate token shape — must be 32 hex chars (UUID without dashes).
  if (typeof token !== 'string' || !/^[0-9a-f]{32}$/i.test(token)) {
    return { success: false, error: 'Link mời đã hết hạn hoặc không hợp lệ.' };
  }

  const admin = createAdminClient();

  // --- 2. Fetch invite ---
  const { data: invite, error: inviteError } = await admin
    .from('circle_invites')
    .select('id, circle_id, email')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (inviteError) {
    logger.error('[invites] acceptInvite fetch failed:', inviteError.code);
    return { success: false, error: 'Không thể xác nhận lời mời. Vui lòng thử lại.' };
  }

  if (!invite) {
    return { success: false, error: 'Link mời đã hết hạn hoặc không hợp lệ.' };
  }

  // --- 3. Returning-member check ---
  const { data: existingMember, error: memberCheckError } = await admin
    .from('circle_members')
    .select('id, is_active')
    .eq('circle_id', invite.circle_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberCheckError) {
    logger.error('[invites] member check failed:', memberCheckError.code);
    return { success: false, error: 'Không thể xác nhận tư cách thành viên. Vui lòng thử lại.' };
  }

  const isReturningMember = existingMember !== null;

  // --- 4. Reactivate or insert ---
  if (isReturningMember && !existingMember.is_active) {
    // D-026: soft-delete — reactivate instead of inserting duplicate.
    const { error: reactivateError } = await admin
      .from('circle_members')
      .update({ is_active: true })
      .eq('circle_id', invite.circle_id)
      .eq('user_id', user.id);

    if (reactivateError) {
      logger.error('[invites] reactivate failed:', reactivateError.code);
      return { success: false, error: 'Không thể tham gia vòng tròn. Vui lòng thử lại.' };
    }
  } else if (!isReturningMember) {
    const { error: insertMemberError } = await admin
      .from('circle_members')
      .insert({ circle_id: invite.circle_id, user_id: user.id });

    if (insertMemberError) {
      logger.error('[invites] circle_members insert failed:', insertMemberError.code);
      return { success: false, error: 'Không thể tham gia vòng tròn. Vui lòng thử lại.' };
    }
  }
  // If isReturningMember && is_active is already true, user is already a member — no-op.

  // --- 5. Mark invite accepted ---
  const { error: updateError } = await admin
    .from('circle_invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);

  if (updateError) {
    // Non-fatal: membership already granted above.
    logger.error('[invites] invite status update failed:', updateError.code);
  }

  // --- 6. Fetch circle name and return ---
  const { data: circle, error: circleError } = await admin
    .from('circles')
    .select('name')
    .eq('id', invite.circle_id)
    .single();

  if (circleError || !circle) {
    logger.error('[invites] circle fetch failed:', circleError?.code);
    return { success: false, error: 'Không thể lấy thông tin vòng tròn.' };
  }

  return {
    success: true,
    data: {
      circle_id: invite.circle_id,
      circle_name: circle.name,
      is_returning_member: isReturningMember,
    },
  };
}

// ---------------------------------------------------------------------------
// revokeInvite
// ---------------------------------------------------------------------------

/**
 * Revokes a pending invite created by the authenticated user.
 *
 * Authorization: invite.invited_by must equal auth user id.
 * Sets status = 'expired' so the token is permanently invalidated.
 * Soft-close only — row is retained for audit purposes.
 *
 * Flow:
 *   1. Guard auth
 *   2. Verify invite ownership (service role fetch)
 *   3. Update status = 'expired'
 *   4. Return { revoked: true }
 */
export async function revokeInvite(
  inviteId: string
): Promise<ActionResult<{ revoked: true }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // Basic shape guard — must be a UUID.
  if (typeof inviteId !== 'string' || inviteId.trim() === '') {
    return { success: false, error: 'ID lời mời không hợp lệ.' };
  }

  const admin = createAdminClient();

  // --- 2. Verify ownership ---
  // We fetch first to provide a meaningful error rather than a silent no-op.
  const { data: invite, error: fetchError } = await admin
    .from('circle_invites')
    .select('id, invited_by, status')
    .eq('id', inviteId)
    .maybeSingle();

  if (fetchError) {
    logger.error('[invites] revokeInvite fetch failed:', fetchError.code);
    return { success: false, error: 'Không thể tìm thấy lời mời.' };
  }

  if (!invite) {
    return { success: false, error: 'Không tìm thấy lời mời.' };
  }

  if (invite.invited_by !== user.id) {
    // Ownership mismatch — do not reveal invite existence to third parties.
    return { success: false, error: 'Bạn không có quyền hủy lời mời này.' };
  }

  if (invite.status !== 'pending') {
    return { success: false, error: 'Lời mời này đã được xử lý rồi.' };
  }

  // --- 3. Update status ---
  const { error: updateError } = await admin
    .from('circle_invites')
    .update({ status: 'expired' })
    .eq('id', inviteId);

  if (updateError) {
    logger.error('[invites] revokeInvite update failed:', updateError.code);
    return { success: false, error: 'Không thể hủy lời mời. Vui lòng thử lại.' };
  }

  return { success: true, data: { revoked: true } };
}

// ---------------------------------------------------------------------------
// getInvite
// ---------------------------------------------------------------------------

/**
 * Public lookup — no auth required.
 *
 * Fetches a pending, non-expired invite by token together with the circle name.
 * Used by the /join/[token] page to render invite details before the user signs in.
 *
 * Uses service-role client because:
 *   - The visitor is unauthenticated (anon key RLS blocks circle_invites reads).
 *   - We intentionally expose only non-PII fields (no inviter name/email returned).
 *
 * Flow:
 *   1. Validate token shape
 *   2. Query invite + circle (service role)
 *   3. Return invite data (excluding invited_by email for privacy)
 */
export async function getInvite(token: string): Promise<
  ActionResult<{
    invite: { id: string; circle_id: string; token: string; status: CircleInvite['status']; expires_at: string; created_at: string; circle: { name: string } };
  }>
> {
  // --- 1. Token shape validation ---
  if (typeof token !== 'string' || !/^[0-9a-f]{32}$/i.test(token)) {
    return { success: false, error: 'Link mời không hợp lệ.' };
  }

  const admin = createAdminClient();

  // --- 2. Query — select only non-PII fields ---
  const { data, error } = await admin
    .from('circle_invites')
    .select(
      `
      id,
      circle_id,
      token,
      status,
      expires_at,
      created_at,
      circles ( name )
    `
    )
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    logger.error('[invites] getInvite query failed:', error.code);
    return { success: false, error: 'Không thể tải thông tin lời mời.' };
  }

  if (!data) {
    return { success: false, error: 'Link mời đã hết hạn hoặc không hợp lệ.' };
  }

  // Supabase returns to-one joins as objects at runtime; cast through unknown
  // because generated types default to array shape until database.types.ts is added.
  const circleRow = (data.circles as unknown) as { name: string } | null;

  if (!circleRow) {
    logger.error('[invites] getInvite: circle row missing for invite', data.id);
    return { success: false, error: 'Không thể tải thông tin vòng tròn.' };
  }

  return {
    success: true,
    data: {
      invite: {
        id: data.id,
        circle_id: data.circle_id,
        token: data.token,
        status: data.status as CircleInvite['status'],
        expires_at: data.expires_at,
        created_at: data.created_at,
        circle: { name: circleRow.name },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// createLinkInvite / revokeLinkInvites — link-based invites
// ---------------------------------------------------------------------------

/**
 * Creates or reuses a pending link-based invite for the current user's circle.
 * email = null signals a link-based (non-targeted) invite (migration 000005).
 */
export async function createLinkInvite(): Promise<
  ActionResult<{ token: string; expires_at: string; invite_url: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  const admin = createAdminClient();

  const { data: membership, error: memberError } = await admin
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    logger.error('[invites] createLinkInvite membership lookup failed:', memberError.code);
    return { success: false, error: 'Không thể xác định vòng tròn của bạn.' };
  }

  if (!membership) {
    return { success: false, error: 'Bạn chưa thuộc vòng tròn nào.' };
  }

  const circleId = membership.circle_id;

  // Reuse existing pending link invite (email IS NULL means link-based invite)
  const { data: existing } = await admin
    .from('circle_invites')
    .select('token, expires_at')
    .eq('circle_id', circleId)
    .eq('invited_by', user.id)
    .eq('status', 'pending')
    .is('email', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      data: {
        token: existing.token,
        expires_at: existing.expires_at,
        invite_url: `${BASE_URL}/join/${existing.token}`,
      },
    };
  }

  const token = generateToken();
  const expiresAt = sevenDaysFromNow();

  const { error: insertError } = await admin.from('circle_invites').insert({
    circle_id: circleId,
    invited_by: user.id,
    email: null,
    token,
    status: 'pending',
    expires_at: expiresAt,
  });

  if (insertError) {
    logger.error('[invites] createLinkInvite insert failed:', insertError.code);
    return { success: false, error: 'Không thể tạo link mời. Vui lòng thử lại.' };
  }

  return {
    success: true,
    data: {
      token,
      expires_at: expiresAt,
      invite_url: `${BASE_URL}/join/${token}`,
    },
  };
}

/**
 * Revokes all active link-based (email = null) pending invites for the caller's circle.
 *
 * BLOCKED: Requires schema migration — circle_invites.email must be nullable.
 */
export async function revokeLinkInvites(): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('circle_invites')
    .update({ status: 'expired' })
    .eq('invited_by', user.id)
    .eq('status', 'pending')
    .is('email', null);

  if (error) {
    logger.error('[invites] revokeLinkInvites failed:', error.code);
    return { success: false, error: 'Không thể thu hồi link mời cũ. Vui lòng thử lại.' };
  }

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// getInviteState — discriminated result for /join/[token] page
// ---------------------------------------------------------------------------

export type InviteState =
  | { state: 'valid'; circle_name: string; token: string }
  | { state: 'expired' }
  | { state: 'invalid' };

/**
 * Returns a discriminated union for the /join/[token] Server Component.
 * Separates "expired" from "invalid" so the page can render the right UI.
 *
 * Does NOT require auth — uses admin client for public token lookup.
 */
export async function getInviteState(token: string): Promise<InviteState> {
  // Quick shape check — 32 hex chars (UUID without dashes)
  if (typeof token !== 'string' || !/^[0-9a-f]{32}$/i.test(token)) {
    return { state: 'invalid' };
  }

  const admin = createAdminClient();

  // Fetch the row regardless of status/expiry so we can distinguish states
  const { data, error } = await admin
    .from('circle_invites')
    .select('status, expires_at, circles ( name )')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    logger.error('[invites] getInviteState query failed:', error.code);
    return { state: 'invalid' };
  }

  if (!data) {
    return { state: 'invalid' };
  }

  // Revoked, accepted, or past expiry all show as "expired"
  const isExpiredByTime = new Date(data.expires_at) < new Date();
  const isExpiredByStatus = data.status !== 'pending';

  if (isExpiredByTime || isExpiredByStatus) {
    return { state: 'expired' };
  }

  const circleRow = (data.circles as unknown) as { name: string } | null;

  return {
    state: 'valid',
    circle_name: circleRow?.name ?? 'Vòng tròn',
    token,
  };
}

