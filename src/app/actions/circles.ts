'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CircleNearby = {
  id: string;
  name: string;
  memberCount: number;
  location: string;
  memberAvatars: string[];
};

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const circleNameSchema = z.string().min(2, 'Tên vòng cần ít nhất 2 ký tự').max(100, 'Tên vòng tối đa 100 ký tự');
const uuidSchema = z.string().uuid('ID không hợp lệ');

// ---------------------------------------------------------------------------
// createCircleWithFounder
// ---------------------------------------------------------------------------

/**
 * Creates a new circle and adds the authenticated user as its first member.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - circles INSERT: RLS policy "circles_insert_authenticated" allows the user
 *     to insert their own circle (created_by = auth.uid()).
 *   - circle_members INSERT: no user-level policy exists; admin client is used
 *     to bypass RLS for the founder membership row.
 *
 * Called from the discovery onboarding step 3 page.
 */
export async function createCircleWithFounder(
  name: string
): Promise<ActionResult<{ circleId: string }>> {
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
  const parsed = circleNameSchema.safeParse(name);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Tên vòng không hợp lệ.' };
  }

  // --- 3. Insert circle ---
  // Pre-generate the UUID so we don't need to SELECT it back after INSERT.
  //
  // Why not .insert(...).select('id').single()?
  //   The SELECT RLS policy "circles_select_member" requires is_circle_member(id,
  //   auth.uid()), but the founder membership row hasn't been inserted yet at this
  //   point — so the SELECT returns 0 rows and .single() raises PGRST116, making
  //   the action appear to fail even though the INSERT succeeded.
  //
  // Generating the ID here lets us:
  //   (a) skip the post-INSERT SELECT entirely, and
  //   (b) still use the user-scoped client for INSERT so the RLS INSERT policy
  //       "circles_insert_authenticated" (created_by = auth.uid()) remains the
  //       DB-layer enforcement layer.
  const circleId = crypto.randomUUID();

  const { error: circleError } = await supabase
    .from('circles')
    .insert({ id: circleId, name: parsed.data, created_by: user.id });

  if (circleError) {
    logger.error('[circles] createCircleWithFounder circle insert failed:', circleError?.code);
    return { success: false, error: 'Không thể tạo vòng. Vui lòng thử lại.' };
  }

  // --- 4. Insert founder membership ---
  // Admin client required: no user-level INSERT policy on circle_members.
  const admin = createAdminClient();
  const { error: memberError } = await admin
    .from('circle_members')
    .insert({ circle_id: circleId, user_id: user.id, is_active: true });

  if (memberError) {
    logger.error('[circles] createCircleWithFounder member insert failed:', memberError.code);
    // Circle exists but no membership — non-fatal for the user; log for ops.
    return { success: false, error: 'Vòng đã tạo nhưng không thể thêm thành viên. Liên hệ hỗ trợ.' };
  }

  return { success: true, data: { circleId } };
}

// ---------------------------------------------------------------------------
// requestToJoinCircle
// ---------------------------------------------------------------------------

/**
 * Submits a join request for the authenticated user to a given circle.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - INSERT on circle_join_requests: RLS "requester_insert" allows this
 *     (requester_id = auth.uid()).
 *   - notification_logs INSERT: no user-level policy; admin client used.
 *
 * Constitution compliance:
 *   - Notification body is generic — no PII (display_name, location, kids_desc)
 *     is included per Forbidden Patterns (Privacy section).
 */
export async function requestToJoinCircle(
  circleId: string
): Promise<ActionResult<{ success: true }>> {
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
  const parsed = uuidSchema.safeParse(circleId);
  if (!parsed.success) {
    return { success: false, error: 'ID vòng không hợp lệ.' };
  }

  // --- 3. Insert join request ---
  // RLS "requester_insert" enforces requester_id = auth.uid().
  const { error: requestError } = await supabase
    .from('circle_join_requests')
    .insert({ circle_id: parsed.data, requester_id: user.id });

  if (requestError) {
    // Unique constraint violation means request already exists
    if (requestError.code === '23505') {
      return { success: false, error: 'Bạn đã gửi yêu cầu tham gia vòng này rồi.' };
    }
    logger.error('[circles] requestToJoinCircle insert failed:', requestError.code);
    return { success: false, error: 'Không thể gửi yêu cầu. Vui lòng thử lại.' };
  }

  // --- 4. Notify active circle members ---
  // Fetch member IDs (exclude the requester).
  const admin = createAdminClient();
  const { data: members, error: membersError } = await admin
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', parsed.data)
    .eq('is_active', true)
    .neq('user_id', user.id);

  if (membersError) {
    // Non-fatal: request was inserted; just skip notifications.
    logger.error('[circles] requestToJoinCircle member fetch failed:', membersError.code);
    return { success: true, data: { success: true } };
  }

  if (members && members.length > 0) {
    // Constitution: no PII in notification payloads. Generic message only.
    // 'join_request' signals an incoming request to existing members;
    // 'new_member' is reserved for notifying the requester on acceptance.
    const notificationRows = members.map((m) => ({
      user_id: m.user_id,
      type: 'join_request' as const,
      channel: 'web_push' as const,
      status: 'sent' as const,
    }));

    const { error: notifError } = await admin
      .from('notification_logs')
      .insert(notificationRows);

    if (notifError) {
      // Non-fatal: join request was created; log for ops.
      logger.error('[circles] requestToJoinCircle notification insert failed:', notifError.code);
    }
  }

  return { success: true, data: { success: true } };
}

// ---------------------------------------------------------------------------
// acceptJoinRequest
// ---------------------------------------------------------------------------

/**
 * Accepts a pending join request — the calling user must be an active member
 * of the target circle.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - Fetch (step 3): admin client reads the join request row to obtain circle_id
 *     before membership is confirmed; application-level check follows.
 *   - UPDATE on circle_join_requests (step 4): user-scoped client so RLS
 *     "members_update" is the enforcing DB layer. Application-level check is
 *     defence-in-depth.
 *   - circle_members INSERT: no user-level policy; admin client used.
 *   - notification_logs INSERT: admin client used (no user-level INSERT policy).
 *
 * Constitution Principle 3: declining a request is NOT notified to the requester.
 */
export async function acceptJoinRequest(
  requestId: string
): Promise<ActionResult<{ success: true }>> {
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
  const parsed = uuidSchema.safeParse(requestId);
  if (!parsed.success) {
    return { success: false, error: 'ID yêu cầu không hợp lệ.' };
  }

  // --- 3. Fetch request and verify caller is a circle member ---
  // Use admin client to read across RLS for the lookup; the UPDATE policy will
  // enforce membership independently at the DB layer.
  const admin = createAdminClient();
  const { data: joinReq, error: fetchError } = await admin
    .from('circle_join_requests')
    .select('id, circle_id, requester_id, status')
    .eq('id', parsed.data)
    .maybeSingle();

  if (fetchError) {
    logger.error('[circles] acceptJoinRequest fetch failed:', fetchError.code);
    return { success: false, error: 'Không thể tìm yêu cầu. Vui lòng thử lại.' };
  }

  if (!joinReq) {
    return { success: false, error: 'Yêu cầu không tồn tại.' };
  }

  if (joinReq.status !== 'pending') {
    return { success: false, error: 'Yêu cầu này đã được xử lý rồi.' };
  }

  // Verify caller is an active member of the circle
  const { data: callerMembership } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', joinReq.circle_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!callerMembership) {
    return { success: false, error: 'Bạn không có quyền xử lý yêu cầu này.' };
  }

  // --- 4. Update request status ---
  // Use user-scoped client (not admin) so the "members_update" RLS policy is the
  // enforcing layer at the DB. The application-level callerMembership check above
  // is defence-in-depth only.
  const { error: updateError } = await supabase
    .from('circle_join_requests')
    .update({ status: 'accepted' })
    .eq('id', parsed.data);

  if (updateError) {
    logger.error('[circles] acceptJoinRequest status update failed:', updateError.code);
    return { success: false, error: 'Không thể cập nhật yêu cầu. Vui lòng thử lại.' };
  }

  // --- 5. Insert new circle membership ---
  const { error: memberError } = await admin
    .from('circle_members')
    .insert({
      circle_id: joinReq.circle_id,
      user_id: joinReq.requester_id,
      is_active: true,
    });

  if (memberError) {
    // Duplicate = already a member, treat as success
    if (memberError.code !== '23505') {
      logger.error('[circles] acceptJoinRequest member insert failed:', memberError.code);
      return { success: false, error: 'Không thể thêm thành viên. Vui lòng thử lại.' };
    }
  }

  // --- 6. Notify the requester ---
  // Generic notification — no PII in payload (Constitution).
  const { error: notifError } = await admin
    .from('notification_logs')
    .insert({
      user_id: joinReq.requester_id,
      type: 'new_member',
      channel: 'web_push',
      status: 'sent',
    });

  if (notifError) {
    // Non-fatal: membership already inserted.
    logger.error('[circles] acceptJoinRequest notification failed:', notifError.code);
  }

  return { success: true, data: { success: true } };
}

// ---------------------------------------------------------------------------
// getCirclesNearby
// ---------------------------------------------------------------------------

/**
 * Returns circles that have at least one active member who has opted in to
 * discovery (user_discovery_settings.is_visible = true) and has location set.
 *
 * No PostGIS: location is a free-text field (e.g. "Yokohama"). Filtering is
 * done by checking that the circle has at least one opted-in member with
 * location set. Full geo-radius filtering is deferred to Sprint 11 (ADR-005).
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - Admin client used because the caller has no circle membership yet
 *     (they are in the discovery onboarding flow). Standard anon-client queries
 *     would return 0 rows due to "circles_select_member" requiring membership.
 *   - Returned data: only name, member count, location summary (max 50 chars),
 *     and emoji avatars — no PII (Constitution Principle 9 / Forbidden Patterns).
 *   - Location is ONLY taken from members with is_visible = true in
 *     user_discovery_settings. Members who never opted in are invisible.
 */
export async function getCirclesNearby(): Promise<ActionResult<CircleNearby[]>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Fetch circles with their active members and profile info ---
  // Admin client bypasses "circles_select_member" RLS since the user is not yet
  // a member of any circle in this flow.
  const admin = createAdminClient();
  const { data: rows, error: fetchError } = await admin
    .from('circle_members')
    .select(`
      circle_id,
      circles ( id, name ),
      profiles ( avatar_emoji, location, user_discovery_settings ( is_visible ) )
    `)
    .eq('is_active', true);

  if (fetchError) {
    logger.error('[circles] getCirclesNearby fetch failed:', fetchError.code);
    return { success: false, error: 'Không thể tải danh sách vòng. Vui lòng thử lại.' };
  }

  if (!rows || rows.length === 0) {
    return { success: true, data: [] };
  }

  // --- 3. Aggregate per circle ---
  // Group members by circle_id, filter circles with location data.
  type CircleAgg = {
    id: string;
    name: string;
    memberCount: number;
    location: string;
    memberAvatars: string[];
  };

  const circleMap = new Map<string, CircleAgg>();

  for (const row of rows) {
    // Supabase infers foreign table joins as arrays; cast through unknown to
    // the actual shape (each row has exactly one circles and one profiles FK).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circleData = (row.circles as unknown) as { id: string; name: string } | null;
    const profileData = (row.profiles as unknown) as {
      avatar_emoji: string | null;
      location: string | null;
      // user_discovery_settings is a one-to-one FK; Supabase may return an
      // object or an array with one element depending on the schema definition.
      user_discovery_settings: { is_visible: boolean } | { is_visible: boolean }[] | null;
    } | null;

    if (!circleData) continue;

    const { id, name } = circleData;

    // Resolve is_visible — handle both object and single-element array shapes.
    const discoverySettings = profileData?.user_discovery_settings;
    const isVisible: boolean = Array.isArray(discoverySettings)
      ? (discoverySettings[0]?.is_visible ?? false)
      : (discoverySettings?.is_visible ?? false);

    // Only use location from members who have explicitly opted in to discovery.
    const location = isVisible ? (profileData?.location ?? '') : '';
    const avatar = profileData?.avatar_emoji ?? '👨‍👩‍👧';

    if (!circleMap.has(id)) {
      circleMap.set(id, { id, name, memberCount: 0, location: '', memberAvatars: [] });
    }

    const agg = circleMap.get(id)!;
    agg.memberCount += 1;

    // Use first non-empty opted-in location found as the circle's location label.
    // Truncate to 50 chars to prevent extremely long free-text from reaching UI.
    if (!agg.location && location) {
      agg.location = location.slice(0, 50);
    }

    // Collect up to 3 avatars for display
    if (agg.memberAvatars.length < 3) {
      agg.memberAvatars.push(avatar);
    }
  }

  // Keep only circles that have a location (at least one member with location set)
  const result: CircleNearby[] = Array.from(circleMap.values()).filter(
    (c) => c.location !== ''
  );

  return { success: true, data: result };
}
