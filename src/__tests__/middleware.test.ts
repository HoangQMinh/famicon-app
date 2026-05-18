/**
 * Middleware routing tests.
 *
 * WHY: The middleware is the sole auth enforcement layer between the browser
 * and all protected routes. A bug here means unauthenticated users can access
 * private circle data, or authenticated users get redirect-looped on /auth.
 *
 * Approach:
 *  - Mock @supabase/ssr so createServerClient returns a configurable user.
 *  - Build minimal NextRequest objects for each route under test.
 *  - Assert on the response: NextResponse.next() (pass-through) vs. redirect.
 *
 * We test the middleware function directly — no HTTP server needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mock @supabase/ssr — createServerClient must be controlled per test
// ---------------------------------------------------------------------------

// We keep a mutable reference so individual tests can swap the user out.
let mockUser: { id: string; email: string } | null = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUser },
        error: null,
      })),
    },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal NextRequest for the given pathname.
 * The base URL is fixed to a local origin — middleware only inspects pathname.
 */
function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'));
}

/**
 * Returns true when the response is a redirect to the expected destination.
 */
function isRedirectTo(response: NextResponse, destination: string): boolean {
  if (response.status < 300 || response.status >= 400) return false;
  const location = response.headers.get('location') ?? '';
  return location.includes(destination);
}

/**
 * Returns true when the response is a pass-through (not a redirect).
 */
function isPassThrough(response: NextResponse): boolean {
  return response.status < 300 || response.status >= 400;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('middleware — unauthenticated user', () => {
  beforeEach(() => {
    mockUser = null; // Ensure no session for every test in this block
  });

  it('redirects /circle to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/circle'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /profile to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/profile'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /requests to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/requests'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /notifications to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/notifications'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /members to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/members'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /new-request to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/new-request'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('passes through /auth — auth page must be public', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/auth'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /auth/verify — OTP page must be public', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/auth/verify'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /join/abc123 — invite link accessible to anyone', async () => {
    /**
     * WHY: Join links are shared externally (e.g. via LINE) and must work
     * before the recipient has an account. The page itself handles auth state.
     */
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/join/abc123'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /join/ with a long token', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(
      makeRequest('/join/550e8400-e29b-41d4-a716-446655440000')
    );
    expect(isPassThrough(response)).toBe(true);
  });
});

describe('middleware — authenticated user', () => {
  beforeEach(() => {
    mockUser = { id: 'user-123', email: 'user@example.com' };
  });

  it('redirects /auth to /home — no auth page for logged-in users', async () => {
    /**
     * WHY: An authenticated user hitting /auth likely bookmarked it or
     * used back-navigation. Redirect them to /home (Sprint 3 renamed the
     * landing route from /circle to /home — middleware updated accordingly).
     */
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/auth'));
    expect(isRedirectTo(response, '/home')).toBe(true);
  });

  it('passes through /circle for authenticated user', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/circle'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /profile for authenticated user', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/profile'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /requests for authenticated user', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/requests'));
    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /join/token for authenticated user', async () => {
    /**
     * WHY: Authenticated users may receive invite links too (joining a second
     * circle). The /join route always passes through regardless of auth state.
     */
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/join/sometoken'));
    expect(isPassThrough(response)).toBe(true);
  });
});

describe('middleware — sub-path protection', () => {
  beforeEach(() => {
    mockUser = null;
  });

  it('redirects /circle/123 (sub-path of protected route) to /auth', async () => {
    /**
     * WHY: matchesAny uses startsWith — sub-paths must also be protected.
     * E.g. /circle/[id]/members should not be publicly accessible.
     */
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/circle/some-circle-id'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });

  it('redirects /profile/edit (sub-path) to /auth', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(makeRequest('/profile/edit'));
    expect(isRedirectTo(response, '/auth')).toBe(true);
  });
});
