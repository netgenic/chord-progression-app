import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/integration/**/*.test.ts',
      'apps/**/tests/integration/**/*.test.{ts,tsx}',
      'apps/**/*.integration.test.{ts,tsx}',
      'packages/**/tests/integration/**/*.test.{ts,tsx}',
      'packages/**/*.integration.test.{ts,tsx}',
    ],
    passWithNoTests: true,
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
