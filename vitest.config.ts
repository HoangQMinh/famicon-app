import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Run in Node environment — Server Actions and middleware rely on Node APIs.
    // No DOM needed for unit/integration tests.
    environment: 'node',
    // Isolate each test file so module-level state (e.g. rate limit Map) resets.
    isolate: true,
    // Global test APIs (describe, it, expect) — avoids importing from vitest in every file.
    globals: true,
    // Exclude Playwright E2E spec files — they use Playwright's test runner, not Vitest.
    // Without this, Vitest picks up e2e/**/*.spec.ts and fails with
    // "Playwright Test did not expect test.describe()" (T-006).
    exclude: ['e2e/**', 'node_modules/**'],
    // Coverage via v8 (no instrumentation overhead)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/schemas/**', 'src/app/actions/**', 'src/middleware.ts'],
    },
  },
});
