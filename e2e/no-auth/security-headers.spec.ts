import { test, expect } from '@playwright/test';

// TC-9.3.1–9.3.4

test.describe('Security headers', () => {
  let headers: Record<string, string>;

  test.beforeAll(async ({ request }) => {
    const response = await request.get('/');
    headers = Object.fromEntries(
      Object.entries(response.headers()).map(([k, v]) => [k.toLowerCase(), v])
    );
  });

  test('X-Frame-Options: DENY (TC-9.3.1)', () => {
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options: nosniff (TC-9.3.2)', () => {
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('Content-Security-Policy present (TC-9.3.3)', () => {
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain('supabase.co');
  });

  test('Referrer-Policy: strict-origin-when-cross-origin (TC-9.3.4)', () => {
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
