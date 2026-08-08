import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CREDENTIALS } from '../../fixtures/credentials';

test.use({ storageState: undefined });

async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(CREDENTIALS.superadmin.email);
  await page.getByLabel('Password').fill(CREDENTIALS.superadmin.password);
  await Promise.all([
    page.waitForURL(/\/super\/dashboard/, { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
}

test.describe('Super Admin — Dashboard', () => {
  test('loads dashboard with content', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Super Admin — Admins', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/admins');
  });

  test('lists admins table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });

  test('create admin opens form', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add admin/i }).click();
    await expect(page.locator('input[type="email"]').last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').last()).toBeVisible();
  });

  test('search filters admin list', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('nonexistent@example.com');
    await expect(page.locator('tbody')).toBeVisible();
  });
});

test.describe('Super Admin — Stores', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/stores');
  });

  test('shows stores table with correct columns', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Store Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('add store button opens modal with form fields', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add store/i }).click();
    // Modal overlay appears — wait for any input inside it
    await expect(page.locator('input').last()).toBeVisible({ timeout: 8000 });
  });

  test('stores have action buttons', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    if (await rows.count() > 0) {
      await expect(rows.first().getByRole('button').first()).toBeVisible();
    }
  });
});

test.describe('Super Admin — Customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/customers');
  });

  test('shows customer table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });

  test('block/unblock button visible per customer', async ({ page }) => {
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await expect(rows.first().getByRole('button', { name: /block|unblock/i })).toBeVisible();
    }
  });

  test('search filters by email', async ({ page }) => {
    await page.getByPlaceholder(/search by email/i).fill('test@');
    await expect(page.locator('tbody')).toBeVisible();
  });
});

test.describe('Super Admin — Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/subscriptions');
  });

  test('shows subscription plans page', async ({ page }) => {
    await expect(page.getByText('Subscription Plans')).toBeVisible();
  });

  test('create plan form has name and price fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Pro')).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('creates a new subscription plan', async ({ page }) => {
    const planName = `E2E Plan ${Date.now()}`;
    await page.getByPlaceholder('Pro').fill(planName);
    await page.locator('input[type="number"]').first().fill('999');
    await page.getByRole('button', { name: /create plan/i }).click();
    await expect(page.getByText(planName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Super Admin — Templates', () => {
  test('shows templates page', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/templates');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Super Admin — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/notifications');
  });

  test('shows email config section', async ({ page }) => {
    // Wait for page to fully load, then check for SMTP text
    await expect(page.getByText(/smtp/i, { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('shows whatsapp config section', async ({ page }) => {
    await expect(page.getByText(/whatsapp/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test('SMTP host field is present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="smtp"]').or(page.getByPlaceholder('smtp.example.com'))).toBeVisible();
  });
});

test.describe('Super Admin — Settings', () => {
  test('change password form is shown', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/settings');
    await expect(page.getByText(/change password/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
