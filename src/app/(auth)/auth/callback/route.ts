import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * Auth callback route — handles magic link token exchange.
 *
 * Used by:
 *   1. E2E global.setup.ts — to authenticate test users via generated magic links
 *      (avoids manual OTP entry in automated tests)
 *
 * Flow:
 *   Supabase magic link redirects to /auth/callback?code=<pkce_code>
 *   → This route exchanges the code for a session (sets sb-* cookies)
 *   → Redirects to /home on success
 *
 * Security: This route does not expose any sensitive data.
 *   The PKCE code is single-use and expires quickly.
 *   The session is stored in HttpOnly cookies by @supabase/ssr.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Route handler — cookies can be set
            }
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to home after successful auth
  return NextResponse.redirect(new URL('/home', request.url));
}
