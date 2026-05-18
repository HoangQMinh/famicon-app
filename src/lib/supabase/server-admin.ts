import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS.
 * Use ONLY for checks that must run before the user is authenticated
 * (e.g., invite gating on sign-in).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
 * This key must NEVER be exposed to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      // Disable auto-refresh — server-side only, no session needed
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
