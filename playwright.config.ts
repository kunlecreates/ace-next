import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Only run E2E specs; ignore unit tests so Vitest imports are never evaluated by Playwright
  testIgnore: ['**/tests/unit/**'],
  testMatch: ['**/*.spec.ts'],
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [['list']],
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    // Default to 3005 to match the production server started via `next start -p 3005`.
    // Override with PLAYWRIGHT_BASE_URL if needed.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run start -- -p 3005',
    port: 3005,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
