import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that require an active session
const PROTECTED_ROUTES = [
  '/home',
  '/circle',
  '/requests',
  '/new-request',
  '/profile',
  '/members',
  '/notifications',
  '/invite',
  '/onboarding',
  '/onboarding/discovery',
];

// Routes only for unauthenticated users (redirect away when logged in)
// Note: /onboarding is NOT in this list because authenticated users need it
// (new members redirected here after OTP verify + acceptInvite).
// /register is included: authenticated users should not re-register.
const AUTH_ONLY_ROUTES = ['/auth', '/register'];

/**
 * Returns true when the pathname starts with any of the listed route prefixes.
 */
function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(request: NextRequest) {
  // Build a mutable response so Supabase can update the session cookie
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request and the response so the
          // refreshed session is visible to subsequent Server Components.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the session against Supabase — do not use getSession()
  // which only reads from the cookie and can be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /join/[token] — accessible to everyone; the page itself handles auth state
  if (pathname.startsWith('/join/')) {
    return supabaseResponse;
  }

  // Unauthenticated user trying to access a protected route → send to /auth
  if (!user && matchesAny(pathname, PROTECTED_ROUTES)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth';
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting an auth-only page → send to /home
  if (user && matchesAny(pathname, AUTH_ONLY_ROUTES)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/home';
    return NextResponse.redirect(homeUrl);
  }

  // Return the (possibly cookie-refreshed) response in all other cases
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, manifest.json, sw.js, icons/**
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/).*)',
  ],
};
