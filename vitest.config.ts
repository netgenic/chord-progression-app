import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/preflight/**/*.test.ts',
      'tests/unit/**/*.test.ts',
      'apps/**/src/**/*.test.{ts,tsx}',
      'apps/**/tests/unit/**/*.test.{ts,tsx}',
      'packages/**/src/**/*.test.{ts,tsx}',
      'packages/**/tests/unit/**/*.test.{ts,tsx}',
    ],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['apps/**/src/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
    },
  },
});
