'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { profileCreateSchema, profileUpdateSchema, avatarUploadSchema } from '@/lib/schemas/profiles';
import type { ActionResult, ProfileData } from '@/lib/types';
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

// ---------------------------------------------------------------------------
// uploadAvatar
// ---------------------------------------------------------------------------

/**
 * Uploads an avatar image to Supabase Storage for the authenticated user.
 *
 * Security notes:
 *   - Upload path is always computed server-side from user.id — client cannot
 *     influence the storage path (prevents overwriting other users' avatars).
 *   - File type and size are validated via Zod before the upload attempt.
 *   - Public URL is retrieved after upload and stored in profiles.avatar_url.
 *
 * Flow:
 *   1. Auth guard
 *   2. Validate file metadata (size, type) via avatarUploadSchema
 *   3. Upload to storage bucket 'avatars' at '{user.id}/avatar.webp' (upsert)
 *   4. Get public URL
 *   5. UPDATE profiles.avatar_url
 *   6. Return { avatar_url }
 */
export async function uploadAvatar(
  file: File
): Promise<ActionResult<{ avatar_url: string }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate file metadata ---
  const metaValidation = avatarUploadSchema.safeParse({
    file_size: file.size,
    file_type: file.type,
  });

  if (!metaValidation.success) {
    const firstError =
      Object.values(metaValidation.error.flatten().fieldErrors).flat()[0] ??
      'Thông tin file không hợp lệ.';
    // Map schema error messages to the user-friendly variants required by spec
    if (firstError.includes('lớn') || firstError.includes('2MB')) {
      return { success: false, error: 'File quá lớn. Vui lòng chọn ảnh dưới 2MB.' };
    }
    return { success: false, error: 'Định dạng file không được hỗ trợ.' };
  }

  // --- 3. Upload to storage ---
  // Path is always server-computed from user.id — never from client input.
  const storagePath = `${user.id}/avatar.webp`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    logger.error('[profiles] uploadAvatar storage upload failed:', uploadError.message);
    return { success: false, error: 'Không thể tải ảnh lên. Vui lòng thử lại.' };
  }

  // --- 4. Get public URL ---
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // --- 5. Update profile ---
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[profiles] uploadAvatar profile update failed:', updateError.code);
    return { success: false, error: 'Không thể tải ảnh lên. Vui lòng thử lại.' };
  }

  return { success: true, data: { avatar_url: publicUrl } };
}

// ---------------------------------------------------------------------------
// getMyProfile
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's own profile.
 *
 * Privacy notes:
 *   - line_user_id is intentionally excluded from the SELECT — must never
 *     be returned to the client (Constitution Principle 9).
 *   - RLS policy "profiles_select_self" allows the user to read their own row.
 *
 * Flow:
 *   1. Auth guard
 *   2. SELECT profile row excluding line_user_id
 *   3. Return ProfileData
 */
export async function getMyProfile(): Promise<ActionResult<ProfileData>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. SELECT profile — line_user_id intentionally excluded (Constitution P9) ---
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji, avatar_url, location, kids_desc, help_tags')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    logger.error('[profiles] getMyProfile fetch failed:', fetchError.code);
    return { success: false, error: 'Không tìm thấy hồ sơ. Vui lòng thử lại.' };
  }

  if (!profile) {
    return { success: false, error: 'Không tìm thấy hồ sơ. Vui lòng thử lại.' };
  }

  return {
    success: true,
    data: {
      id: profile.id,
      display_name: profile.display_name,
      avatar_emoji: profile.avatar_emoji ?? null,
      avatar_url: profile.avatar_url ?? null,
      location: profile.location ?? null,
      kids_desc: profile.kids_desc ?? null,
      help_tags: profile.help_tags ?? null,
    },
  };
}
