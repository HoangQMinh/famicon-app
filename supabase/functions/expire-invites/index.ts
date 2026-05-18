// =============================================================================
// Edge Function: expire-invites
// Description: Daily cron job — marks circle_invites as 'expired' where
//              status = 'pending' AND expires_at < now().
// Schedule:    Configure in Supabase Dashboard > Edge Functions > Cron
//              Recommended: "0 2 * * *" (02:00 UTC daily)
// Refs:        D-024 (invites expire after 7 days)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req: Request): Promise<Response> => {
  // Service role key bypasses RLS — required because the expire action
  // updates rows not owned by any authenticated user.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error, count } = await supabase
    .from('circle_invites')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    console.error('[expire-invites] error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[expire-invites] expired ${count ?? 0} invite(s)`);
  return new Response(
    JSON.stringify({ expired: count ?? 0 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
