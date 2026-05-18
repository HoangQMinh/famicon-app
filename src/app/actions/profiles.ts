'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { profileCreateSchema, profileUpdateSchema } from '@/lib/schemas/profiles';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// createProfile
// ---------------------------------------------------------------------------

/**
 * Creates a new profile row for the authenticated user.
 *
 * If the profile already exists (conflict on primary key = user.id),
 * we treat this as idempotent and return success with the existing profile_id.
 *
 * After a successful profile creation we activate any pending invite that
 * matches the user's email address, inserting a circle_members row via the
 * service-role client so that RLS is bypassed (the user is not yet a member).
 *
 * Flow:
 *   1. Guard auth
 *   2. Validate input (Zod)
 *   3. Insert profile — or confirm it already exists
 *   4. Activate pending invite if found
 *   5. Return { profile_id }
 */
export async function createProfile(
  data: unknown
): Promise<ActionResult<{ profile_id: string; hasCircle: boolean }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate ---
  const parsed = profileCreateSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      'Thông tin không hợp lệ';
    return { success: false, error: firstError };
  }

  const admin = createAdminClient();

  // --- 3. Insert profile (upsert on conflict so action is idempotent) ---
  const { error: insertError } = await admin.from('profiles').upsert(
    {
      id: user.id,
      display_name: parsed.data.display_name,
      avatar_emoji: parsed.data.avatar_emoji ?? '👨‍👩‍👧',
      kids_desc: parsed.data.kids_desc ?? null,
      location: parsed.data.location ?? null,
    },
    {
      // Only insert; do not overwrite an existing profile on repeated calls.
      // ignoreDuplicates prevents update on conflict.
      ignoreDuplicates: true,
    }
  );

  if (insertError) {
    logger.error('[profiles] createProfile upsert failed:', insertError.code);
    return { success: false, error: 'Không thể tạo hồ sơ. Vui lòng thử lại.' };
  }

  // --- 4. Activate pending invite ---
  // Look up any pending invite matching the user's email.
  // We use the service-role client because RLS on circle_invites only allows
  // the inviter to select their own rows, not the invitee.
  const userEmail = user.email;
  if (userEmail) {
    const { data: invite, error: inviteFetchError } = await admin
      .from('circle_invites')
      .select('id, circle_id')
      .eq('email', userEmail.toLowerCase().trim())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteFetchError) {
      // Non-fatal: profile already created; log and continue.
      logger.error('[profiles] invite fetch failed:', inviteFetchError.code);
    }

    if (invite) {
      // Check whether user is already a member (handles repeated onboarding calls).
      const { data: existingMember } = await admin
        .from('circle_members')
        .select('id, is_active')
        .eq('circle_id', invite.circle_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingMember) {
        // First time joining — insert new membership row.
        const { error: memberInsertError } = await admin
          .from('circle_members')
          .insert({ circle_id: invite.circle_id, user_id: user.id });

        if (memberInsertError) {
          logger.error(
            '[profiles] circle_members insert failed:',
            memberInsertError.code
          );
        }
      } else if (!existingMember.is_active) {
        // Returning member — reactivate per D-026.
        const { error: reactivateError } = await admin
          .from('circle_members')
          .update({ is_active: true })
          .eq('circle_id', invite.circle_id)
          .eq('user_id', user.id);

        if (reactivateError) {
          logger.error(
            '[profiles] reactivate circle_members failed:',
            reactivateError.code
          );
        }
      }

      // Mark invite accepted regardless of membership insertion outcome.
      const { error: inviteUpdateError } = await admin
        .from('circle_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (inviteUpdateError) {
        logger.error(
          '[profiles] invite status update failed:',
          inviteUpdateError.code
        );
      }
    }
  }

  // --- 5. Check whether user belongs to any active circle ---
  // Used by the onboarding page to decide whether to redirect to the discovery
  // flow (no circle) or directly to /home (already a member via invite).
  // We query with the anon client so RLS "members_select_same_circle" applies;
  // the user IS authenticated at this point so auth.uid() resolves correctly.
  const { data: membership } = await supabase
    .from('circle_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const hasCircle = membership !== null;

  return { success: true, data: { profile_id: user.id, hasCircle } };
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Partial update of the authenticated user's profile.
 * Accepts any subset of profile fields; only provided fields are written.
 *
 * Flow:
 *   1. Guard auth
 *   2. Validate input (Zod — partial schema)
 *   3. Update profile row
 *   4. Return { updated: true }
 */
export async function updateProfile(
  data: unknown
): Promise<ActionResult<{ updated: true }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate ---
  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      'Thông tin không hợp lệ';
    return { success: false, error: firstError };
  }

  // Reject empty update payloads to avoid silent no-ops.
  const updatePayload = parsed.data;
  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: 'Không có thông tin nào được cập nhật.' };
  }

  // --- 3. Update ---
  // RLS policy "profiles_update_self" ensures only the owner's row is touched.
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (updateError) {
    logger.error('[profiles] updateProfile failed:', updateError.code);
    return {
      success: false,
      error: 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
    };
  }

  return { success: true, data: { updated: true } };
}
