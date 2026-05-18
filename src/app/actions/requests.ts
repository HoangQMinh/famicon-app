'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult, AidRequestWithProfile, RequestDetail } from '@/lib/types';
import { logger } from '@/lib/logger';
import { newRequestSchema } from '@/lib/schemas/requests';

// ---------------------------------------------------------------------------
// createRequest
// ---------------------------------------------------------------------------

/**
 * Creates a new aid request in the given circle.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected early.
 *   - Membership check: explicit lookup on circle_members (is_active = true)
 *     to return NOT_MEMBER before touching aid_requests. Defense-in-depth on
 *     top of the RLS policy "requests_insert_member" which enforces the same
 *     constraint at the DB layer.
 *   - Zod validation runs after auth/membership checks to avoid leaking
 *     existence information to unauthenticated or non-member callers.
 *   - requester_id is always set to auth.uid() — never trusted from input.
 *   - status is always set to 'open' server-side — not accepted from input.
 *
 * @param data Raw form submission (unknown — validated by Zod inside).
 * @returns ActionResult wrapping { request_id: string } on success.
 */
export async function createRequest(
  data: unknown
): Promise<ActionResult<{ request_id: string }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate input ---
  const parsed = newRequestSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
    };
  }

  const { circle_id, category, description, scheduled_at, location, is_urgent } =
    parsed.data;

  // --- 3. Membership check ---
  // Explicit check gives a meaningful NOT_MEMBER error instead of a silent RLS
  // rejection. is_active = true mirrors the is_circle_member() DB helper used
  // by RLS, so we enforce the same semantics at the application layer.
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('circle_id', circle_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (memberError) {
    logger.error('[requests] createRequest membership check failed:', memberError.code);
    return { success: false, error: 'Không thể xác minh tư cách thành viên.' };
  }

  if (!membership) {
    return { success: false, error: 'Bạn không thuộc vòng tròn này.' };
  }

  // --- 4. Insert ---
  const { data: row, error: insertError } = await supabase
    .from('aid_requests')
    .insert({
      circle_id,
      requester_id: user.id,
      category,
      description,
      scheduled_at,
      location,
      is_urgent,
      status: 'open',
    })
    .select('id')
    .single();

  if (insertError) {
    logger.error('[requests] createRequest insert failed:', insertError.code);
    return { success: false, error: 'Không thể tạo yêu cầu. Vui lòng thử lại.' };
  }

  // --- 5. Trigger notify-circle Edge Function ---
  // Fire-and-forget: notification failure must not block the request creation
  // response. We call the Edge Function directly (Option 2 — no DB webhook)
  // so errors here are logged server-side but invisible to the user.
  triggerNotifyCircle({
    id: row.id,
    circle_id,
    requester_id: user.id,
    category,
    description,
    is_urgent,
  }).catch((err: unknown) => {
    // Log but do not surface to user — notification is best-effort
    logger.error('[requests] notify-circle trigger failed:', (err as Error).message);
  });

  return { success: true, data: { request_id: row.id } };
}

// ---------------------------------------------------------------------------
// triggerNotifyCircle (internal helper)
// ---------------------------------------------------------------------------

/**
 * Calls the notify-circle Supabase Edge Function after a successful aid_request insert.
 *
 * Uses fetch() with the service role key to call the Edge Function endpoint.
 * This is fire-and-forget — callers should .catch() to avoid unhandled rejections.
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (never exposed to browser)
 */
async function triggerNotifyCircle(record: {
  id: string;
  circle_id: string;
  requester_id: string;
  category: string;
  description: string;
  is_urgent: boolean;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    logger.error('[requests] triggerNotifyCircle: missing env vars — skipping');
    return;
  }

  const url = `${supabaseUrl}/functions/v1/notify-circle`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ record }),
  });

  if (!res.ok) {
    logger.error(
      `[requests] notify-circle returned HTTP ${res.status}`
    );
  }
}

// ---------------------------------------------------------------------------
// getCircleRequests
// ---------------------------------------------------------------------------

/**
 * Fetches all open aid requests for a given circle, joined with requester profile.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers are rejected before any DB query.
 *   - Membership check: explicit DB lookup to return a meaningful error and to
 *     short-circuit before touching aid_requests. Defense-in-depth on top of RLS.
 *   - RLS on aid_requests ("requests_select_circle_member") ensures the server
 *     Supabase client (anon key + user session) cannot read rows from circles
 *     the user does not belong to, even if the membership check above were skipped.
 *
 * Sort order: is_urgent DESC, created_at DESC (urgent first, then newest).
 * Only status = 'open' requests are returned (Feed shows active requests only).
 *
 * @param circleId UUID of the circle whose feed is being loaded.
 * @returns ActionResult wrapping an array of AidRequestWithProfile.
 */
export async function getCircleRequests(
  circleId: string
): Promise<ActionResult<AidRequestWithProfile[]>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Basic input validation ---
  // UUID format check prevents SQL injection vectors and provides a cleaner error.
  if (
    typeof circleId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(circleId)
  ) {
    return { success: false, error: 'ID vòng tròn không hợp lệ.' };
  }

  // --- 3. Membership check (explicit — defense-in-depth on top of RLS) ---
  // RLS on circle_members uses is_circle_member() helper which checks is_active = true.
  // We replicate that here to give a user-friendly error instead of an empty result set.
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (memberError) {
    logger.error('[requests] membership check failed:', memberError.code);
    return { success: false, error: 'Không thể xác minh tư cách thành viên.' };
  }

  if (!membership) {
    // Intentionally vague — do not confirm that the circle exists.
    return { success: false, error: 'Bạn không thuộc vòng tròn này.' };
  }

  // --- 4. Fetch open requests joined with requester profile ---
  // Supabase .select() with a foreign key join: aid_requests → profiles (via requester_id).
  // The 'profiles' join key is 'requester_id' referencing profiles.id.
  // RLS "requests_select_circle_member" applies automatically.
  //
  // Column alias mapping:
  //   aid_requests.location  → returned as location_text in AidRequestWithProfile
  //   profiles.display_name  → returned as requester_name
  //   profiles.avatar_emoji  → returned as requester_emoji
  const { data, error: queryError } = await supabase
    .from('aid_requests')
    .select(
      `
      id,
      circle_id,
      requester_id,
      category,
      description,
      scheduled_at,
      location,
      is_urgent,
      status,
      created_at,
      profiles!requester_id (
        display_name,
        avatar_emoji
      )
    `
    )
    .eq('circle_id', circleId)
    .eq('status', 'open')
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false });

  if (queryError) {
    logger.error('[requests] getCircleRequests query failed:', queryError.code);
    return { success: false, error: 'Không thể tải danh sách yêu cầu. Vui lòng thử lại.' };
  }

  // --- 5. Map DB rows to AidRequestWithProfile ---
  // The Supabase JS client returns to-one joins as objects at runtime.
  // We cast through unknown because database.types.ts is not yet generated.
  const requests: AidRequestWithProfile[] = (data ?? []).map((row) => {
    const profile = (row.profiles as unknown) as {
      display_name: string;
      avatar_emoji: string;
    } | null;

    return {
      id: row.id,
      circle_id: row.circle_id,
      requester_id: row.requester_id,
      category: row.category,
      description: row.description,
      scheduled_at: row.scheduled_at ?? null,
      location_text: row.location ?? null,
      is_urgent: row.is_urgent,
      status: row.status,
      created_at: row.created_at,
      requester_name: profile?.display_name ?? 'Thành viên',
      requester_emoji: profile?.avatar_emoji ?? null,
    };
  });

  return { success: true, data: requests };
}

// ---------------------------------------------------------------------------
// getCircleInfo
// ---------------------------------------------------------------------------

/**
 * Fetches the display name and active member count for a given circle.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - RLS on circles ("circles_select_member") ensures only members can read
 *     the circle row — a non-member will receive an empty result (not an error).
 *   - RLS on circle_members ("members_select_same_circle") allows counting
 *     active members of any circle the caller belongs to.
 *
 * Two separate queries are used (circles + circle_members count) because
 * Supabase's count() aggregate runs in the same query as .select() — combining
 * them into a single query would require raw SQL which coding conventions forbid.
 *
 * @param circleId UUID of the circle.
 * @returns ActionResult wrapping { name: string; member_count: number }.
 */
export async function getCircleInfo(
  circleId: string
): Promise<ActionResult<{ name: string; member_count: number }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Basic input validation ---
  if (
    typeof circleId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(circleId)
  ) {
    return { success: false, error: 'ID vòng tròn không hợp lệ.' };
  }

  // --- 3. Fetch circle name ---
  // RLS "circles_select_member" limits this to circles the user belongs to.
  // If the user is not a member, data will be null (Supabase returns null, not 403).
  const { data: circle, error: circleError } = await supabase
    .from('circles')
    .select('name')
    .eq('id', circleId)
    .maybeSingle();

  if (circleError) {
    logger.error('[requests] getCircleInfo circle query failed:', circleError.code);
    return { success: false, error: 'Không thể tải thông tin vòng tròn.' };
  }

  if (!circle) {
    // RLS returned empty — user is not a member of this circle.
    return { success: false, error: 'Vòng tròn không tồn tại hoặc bạn không có quyền truy cập.' };
  }

  // --- 4. Count active members ---
  // Uses Supabase count() with head:true to avoid fetching actual rows.
  // RLS "members_select_same_circle" allows reading circle_members rows for
  // circles the authenticated user is an active member of.
  const { count, error: countError } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', circleId)
    .eq('is_active', true);

  if (countError) {
    logger.error('[requests] getCircleInfo member count failed:', countError.code);
    return { success: false, error: 'Không thể đếm số thành viên.' };
  }

  return {
    success: true,
    data: {
      name: circle.name,
      member_count: count ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// getRequestDetail (Sprint 7)
// ---------------------------------------------------------------------------

/**
 * Fetches full detail for a single aid request, joined with the requester's
 * display name. Visible only to active circle members (enforced by RLS).
 *
 * Privacy:
 *   - requester's line_user_id is intentionally NOT included in the return value.
 *     Only the createOffer Server Action accesses it internally to build the LINE
 *     deeplink (Constitution Principle 9 — closed circle).
 *   - requester_name is joined from profiles — safe to display within the circle.
 *
 * RLS "requests_select_circle_member" + "profiles_select_circle_member" are
 * enforced automatically by the Supabase client (user session cookie).
 *
 * @param requestId UUID of the aid request.
 * @returns ActionResult<RequestDetail>
 */
export async function getRequestDetail(
  requestId: string
): Promise<ActionResult<RequestDetail>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Basic UUID validation ---
  if (
    typeof requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
  ) {
    return { success: false, error: 'ID yêu cầu không hợp lệ.' };
  }

  // --- 3. Fetch request joined with requester profile ---
  // RLS "requests_select_circle_member" restricts to requests in circles the
  // calling user is an active member of.
  // NOTE: line_user_id is intentionally excluded from the select list.
  const { data: row, error: queryError } = await supabase
    .from('aid_requests')
    .select(
      `
      id,
      circle_id,
      requester_id,
      category,
      description,
      scheduled_at,
      location,
      is_urgent,
      status,
      created_at,
      profiles!requester_id (
        display_name
      )
    `
    )
    .eq('id', requestId)
    .maybeSingle();

  if (queryError) {
    logger.error('[requests] getRequestDetail query failed:', queryError.code);
    return { success: false, error: 'Không thể tải yêu cầu. Vui lòng thử lại.' };
  }

  if (!row) {
    // RLS returned empty or the request doesn't exist — intentionally vague.
    return { success: false, error: 'Yêu cầu không tồn tại hoặc bạn không có quyền xem.' };
  }

  // The Supabase JS client returns to-one FK joins as an object at runtime.
  const profile = (row.profiles as unknown) as { display_name: string } | null;

  const detail: RequestDetail = {
    id: row.id,
    circle_id: row.circle_id,
    requester_id: row.requester_id,
    category: row.category as RequestDetail['category'],
    description: row.description,
    scheduled_at: row.scheduled_at ?? null,
    location_text: row.location ?? null,
    is_urgent: row.is_urgent,
    status: row.status as RequestDetail['status'],
    created_at: row.created_at,
    requester_name: profile?.display_name ?? 'Thành viên',
  };

  return { success: true, data: detail };
}

// ---------------------------------------------------------------------------
// cancelRequest (Sprint 7)
// ---------------------------------------------------------------------------

/**
 * Cancels an open or matched aid request. Only the requester may cancel.
 *
 * D-033: If the request was 'matched' before cancellation, re-notify the circle
 * so that other helpers know the request needs help again.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - Ownership check: explicit requester_id = user.id in WHERE clause.
 *   - RLS "requests_update_requester" enforces the same at DB level.
 *
 * @param requestId UUID of the aid request to cancel.
 * @returns ActionResult<{ cancelled: true }>
 */
export async function cancelRequest(
  requestId: string
): Promise<ActionResult<{ cancelled: true }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. UUID validation ---
  if (
    typeof requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
  ) {
    return { success: false, error: 'ID yêu cầu không hợp lệ.' };
  }

  // --- 3. Fetch current request to verify ownership and current status ---
  const { data: request, error: fetchError } = await supabase
    .from('aid_requests')
    .select('id, circle_id, requester_id, category, description, is_urgent, status')
    .eq('id', requestId)
    .eq('requester_id', user.id) // only fetch if the user owns it
    .maybeSingle();

  if (fetchError) {
    logger.error('[requests] cancelRequest fetch failed:', fetchError.code);
    return { success: false, error: 'Không thể tải yêu cầu. Vui lòng thử lại.' };
  }

  if (!request) {
    // Either not found or user is not the requester — intentionally vague.
    return { success: false, error: 'Không thể huỷ yêu cầu này.' };
  }

  // --- 4. Status guard --- prevent cancelling already-terminal requests ---
  if (request.status === 'cancelled') {
    return { success: false, error: 'Yêu cầu đã được huỷ rồi.' };
  }
  if (request.status === 'closed') {
    return { success: false, error: 'Không thể huỷ yêu cầu đã đóng.' };
  }

  // Capture whether the request was matched — needed for D-033 re-notify below.
  const wasMatched = request.status === 'matched';

  // --- 5. Cancel the request ---
  const { error: updateError } = await supabase
    .from('aid_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('requester_id', user.id);

  if (updateError) {
    logger.error('[requests] cancelRequest update failed:', updateError.code);
    return { success: false, error: 'Không thể huỷ yêu cầu. Vui lòng thử lại.' };
  }

  // --- 6. D-033: Re-notify circle if the request was matched ---
  // When a matched request is cancelled, the circle needs to know so another
  // helper can step in. We re-use the notify-circle Edge Function with
  // type='new_request' to surface the re-opened need.
  // Fire-and-forget — notification failure must not block the cancel response.
  if (wasMatched) {
    triggerNotifyCircle({
      id: request.id,
      circle_id: request.circle_id,
      requester_id: user.id,
      category: request.category,
      description: request.description,
      is_urgent: request.is_urgent,
    }).catch((err: unknown) => {
      logger.error('[requests] cancelRequest re-notify failed:', (err as Error).message);
    });
  }

  return { success: true, data: { cancelled: true } };
}

// ---------------------------------------------------------------------------
// closeRequest (Sprint 7)
// ---------------------------------------------------------------------------

/**
 * Marks an aid request as 'closed' (fulfilled / no longer needed).
 * Only the requester may close their own request.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - Ownership: requester_id = user.id enforced in WHERE clause + RLS.
 *
 * @param requestId UUID of the aid request to close.
 * @returns ActionResult<{ closed: true }>
 */
export async function closeRequest(
  requestId: string
): Promise<ActionResult<{ closed: true }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. UUID validation ---
  if (
    typeof requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
  ) {
    return { success: false, error: 'ID yêu cầu không hợp lệ.' };
  }

  // --- 3. Fetch request to verify ownership and status ---
  const { data: request, error: fetchError } = await supabase
    .from('aid_requests')
    .select('id, requester_id, status')
    .eq('id', requestId)
    .eq('requester_id', user.id)
    .maybeSingle();

  if (fetchError) {
    logger.error('[requests] closeRequest fetch failed:', fetchError.code);
    return { success: false, error: 'Không thể tải yêu cầu. Vui lòng thử lại.' };
  }

  if (!request) {
    return { success: false, error: 'Không thể đóng yêu cầu này.' };
  }

  // --- 4. Status guard ---
  if (request.status === 'closed') {
    return { success: false, error: 'Yêu cầu đã được đóng rồi.' };
  }
  if (request.status === 'cancelled') {
    return { success: false, error: 'Không thể đóng yêu cầu đã huỷ.' };
  }

  // --- 5. Close the request ---
  const { error: updateError } = await supabase
    .from('aid_requests')
    .update({ status: 'closed' })
    .eq('id', requestId)
    .eq('requester_id', user.id);

  if (updateError) {
    logger.error('[requests] closeRequest update failed:', updateError.code);
    return { success: false, error: 'Không thể đóng yêu cầu. Vui lòng thử lại.' };
  }

  return { success: true, data: { closed: true } };
}
