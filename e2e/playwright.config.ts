import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'platform-ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLATFORM_URL || 'http://localhost:3000',
      },
      testMatch: ['**/superadmin/**', '**/auth/**'],
    },
    {
      name: 'admin-ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ADMIN_URL || 'http://localhost:3001',
      },
      testMatch: ['**/admin/**'],
    },
    {
      name: 'storefront',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.STOREFRONT_URL || 'http://localhost:3002',
      },
      testMatch: ['**/storefront/**'],
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.ADMIN_URL || 'http://localhost:3001',
      },
      testMatch: ['**/admin/dashboard.spec.ts'],
    },
  ],
});
