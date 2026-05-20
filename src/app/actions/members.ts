'use server';

import { createClient } from '@/lib/supabase/server';
import { membersQuerySchema } from '@/lib/schemas/members';
import type { ActionResult, MemberProfile } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// getCircleMembers
// ---------------------------------------------------------------------------

/**
 * Returns the list of active members for a given circle, joined with their
 * profile data, plus the circle's display name.
 *
 * Privacy notes:
 *   - line_user_id is intentionally excluded from the profiles SELECT
 *     (Constitution Principle 9 — closed circle / no PII exposure).
 *   - No contribution counts, offer counts, or activity counters returned
 *     (Constitution Principle 2 — no ledger).
 *   - No admin/founder badge fields (Constitution Principle 7).
 *
 * Auth & access:
 *   - RLS on circle_members ("members_select_same_circle") enforces that only
 *     active circle members can read the circle's member list.
 *   - Explicit membership check is added for an early, user-friendly error
 *     (defense-in-depth on top of RLS).
 *
 * Flow:
 *   1. Auth guard
 *   2. Validate circleId is a valid UUID
 *   3. Verify caller is an active member of circleId (explicit check)
 *   4. Fetch circle name
 *   5. JOIN circle_members + profiles for active members, ordered by joined_at ASC
 *   6. Return { members, circle_name }
 */
export async function getCircleMembers(
  circleId: string
): Promise<ActionResult<{ members: MemberProfile[]; circle_name: string }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate circleId ---
  const parsed = membersQuerySchema.safeParse({ circleId });
  if (!parsed.success) {
    return { success: false, error: 'ID vòng tròn không hợp lệ.' };
  }

  const validatedCircleId = parsed.data.circleId;

  // --- 3. Verify caller is an active member ---
  // RLS will silently return 0 rows if the user is not a member, but we add an
  // explicit check here so we can return a meaningful Vietnamese error message
  // rather than an empty list that would confuse the user.
  const { data: membership, error: membershipError } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', validatedCircleId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (membershipError) {
    logger.error('[members] membership check failed:', membershipError.code);
    return { success: false, error: 'Bạn không phải thành viên của vòng này.' };
  }

  if (!membership) {
    return { success: false, error: 'Bạn không phải thành viên của vòng này.' };
  }

  // --- 4. Fetch circle name ---
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('name')
    .eq('id', validatedCircleId)
    .single();

  if (circleError || !circle) {
    logger.error('[members] circle name fetch failed:', circleError?.code);
    return { success: false, error: 'Không tìm thấy thông tin vòng tròn. Vui lòng thử lại.' };
  }

  // --- 5. Fetch active members joined with profile data ---
  // line_user_id is intentionally NOT in the select list (Constitution P9).
  // No counter or ranking columns (Constitution P2).
  // No role/badge fields (Constitution P7).
  // Order by joined_at ASC so the earliest member appears first.
  const { data: rows, error: membersError } = await supabase
    .from('circle_members')
    .select(
      `
      joined_at,
      profiles!inner (
        id,
        display_name,
        avatar_emoji,
        avatar_url,
        location,
        kids_desc,
        help_tags
      )
      `
    )
    .eq('circle_id', validatedCircleId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });

  if (membersError) {
    logger.error('[members] getCircleMembers fetch failed:', membersError.code);
    return { success: false, error: 'Không thể tải danh sách thành viên. Vui lòng thử lại.' };
  }

  // Map the joined rows into MemberProfile shape.
  // profiles!inner guarantees a non-null join but Supabase types the relation
  // as an array; we index [0] as the canonical single-row result per circle_member.
  const members: MemberProfile[] = (rows ?? []).map((row) => {
    // Supabase types profiles as an array for foreign-key joins; !inner ensures
    // exactly one matching profile row exists per circle_member row.
    const profilesResult = row.profiles as Array<{
      id: string;
      display_name: string;
      avatar_emoji: string | null;
      avatar_url: string | null;
      location: string | null;
      kids_desc: string | null;
      help_tags: string[] | null;
    }> | {
      id: string;
      display_name: string;
      avatar_emoji: string | null;
      avatar_url: string | null;
      location: string | null;
      kids_desc: string | null;
      help_tags: string[] | null;
    };

    const p = Array.isArray(profilesResult) ? profilesResult[0] : profilesResult;

    return {
      id: p.id,
      display_name: p.display_name,
      avatar_emoji: p.avatar_emoji ?? null,
      avatar_url: p.avatar_url ?? null,
      location: p.location ?? null,
      kids_desc: p.kids_desc ?? null,
      help_tags: p.help_tags ?? null,
    };
  });

  return {
    success: true,
    data: {
      members,
      circle_name: circle.name,
    },
  };
}
