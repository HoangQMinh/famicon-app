import { test, expect } from '@playwright/test';

// TC-9.1.1, TC-9.1.2, TC-9.2.3

test.describe('PWA assets', () => {
  test('manifest.json has required fields (TC-9.1.1)', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('Vòng Tròn Tương Trợ');
    expect(manifest.short_name).toBe('Vòng Tròn');
    expect(manifest.start_url).toBe('/home');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  for (const iconPath of ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']) {
    test(`${iconPath} returns HTTP 200 (TC-9.1.2)`, async ({ request }) => {
      const response = await request.get(iconPath);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });
  }

  test('/offline.html returns 200 with offline message (TC-9.2.3)', async ({ request }) => {
    const response = await request.get('/offline.html');
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('Bạn đang offline');
    expect(body).toContain('Thử lại');
  });
});
