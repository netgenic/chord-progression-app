import { defineConfig, devices } from '@playwright/test';
import { loadToolingEnvironment } from './config/environment.ts';

const environment = loadToolingEnvironment();

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: environment.ci,
  retries: environment.ci ? 2 : 0,
  workers: environment.ci ? 1 : '50%',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: environment.e2eBaseUrl.toString(),
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
