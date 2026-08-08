import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Load .env from e2e/ directory
try {
  const envPath = path.resolve(__dirname, '.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && !(key in process.env)) process.env[key.trim()] = rest.join('=').trim();
  }
} catch { /* .env optional */ }

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  workers: 2,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./reporters/pdf-reporter.ts'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'on',
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
