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
    // Coverage via v8 (no instrumentation overhead)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/schemas/**', 'src/app/actions/**', 'src/middleware.ts'],
    },
  },
});
