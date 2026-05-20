'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const updateDiscoverySettingsSchema = z.object({
  is_visible: z.boolean(),
  radius_km: z.union([z.literal(3), z.literal(5), z.literal(10)]),
});

// ---------------------------------------------------------------------------
// updateDiscoverySettings
// ---------------------------------------------------------------------------

/**
 * Upserts the authenticated user's discovery visibility settings.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - RLS "discovery_settings_self" (FOR ALL) ensures user can only upsert
 *     their own row (user_id = auth.uid()).
 *
 * Called from the discovery onboarding step 1 page.
 * is_visible defaults to false (opt-in, Constitution Principle 1).
 */
export async function updateDiscoverySettings(
  input: unknown
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
  const parsed = updateDiscoverySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Thông tin không hợp lệ.' };
  }

  const { is_visible, radius_km } = parsed.data;

  // --- 3. Upsert (admin client bypasses RLS — auth guard above ensures scope) ---
  const admin = createAdminClient();
  const { error: upsertError } = await admin
    .from('user_discovery_settings')
    .upsert(
      { user_id: user.id, is_visible, radius_km },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    logger.error('[discovery] updateDiscoverySettings upsert failed:', upsertError.code);
    return { success: false, error: 'Không thể lưu cài đặt. Vui lòng thử lại.' };
  }

  return { success: true, data: { updated: true } };
}
