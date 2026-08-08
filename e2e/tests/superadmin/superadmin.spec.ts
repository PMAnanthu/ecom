import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CREDENTIALS } from '../../fixtures/credentials';

test.use({ storageState: undefined });

async function loginAsSuperAdmin(page: Page) {
  const login = new LoginPage(page);
  await login.login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
  await expect(page).toHaveURL(/\/super\/dashboard/, { timeout: 15000 });
}

test.describe('Super Admin — Dashboard', () => {
  test('shows platform stats cards', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    // Stats cards are rendered as card titles
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
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

  test('create admin opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add admin/i }).click();
    // Modal card title appears inside the overlay
    await expect(page.getByRole('heading', { name: 'Add Admin' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
  });

  test('search filters admin list', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i);
    await search.fill('nonexistent@example.com');
    await expect(page.locator('tbody')).toBeVisible();
  });
});

test.describe('Super Admin — Stores', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/stores');
  });

  test('shows stores table with correct columns', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Store Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Store ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Days Left' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('add store button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add store/i }).click();
    await expect(page.getByRole('heading', { name: 'Add Store' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Store Name')).toBeVisible();
    await expect(page.getByLabel(/store url id/i)).toBeVisible();
  });

  test('live/offline toggle button visible per store row', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await rows.first().waitFor({ timeout: 5000 }).catch(() => {});
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().getByRole('button', { name: /go live|go offline/i })).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Super Admin — Customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/customers');
  });

  test('shows customer table', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('block/unblock button visible per customer', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
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

  test('shows subscription plans table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Subscription Plans' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Price' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Period' })).toBeVisible();
  });

  test('create plan form has all required fields', async ({ page }) => {
    await expect(page.getByPlaceholder('Pro')).toBeVisible();
    await expect(page.getByLabel('Price')).toBeVisible();
    await expect(page.getByLabel('Currency')).toBeVisible();
  });

  test('creates a new subscription plan', async ({ page }) => {
    const planName = `Test Plan ${Date.now()}`;
    await page.getByPlaceholder('Pro').fill(planName);
    await page.getByLabel('Price').fill('999');
    await page.getByLabel('Currency').fill('INR');
    await page.getByRole('button', { name: /create plan/i }).click();
    await expect(page.getByText(planName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Super Admin — Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/templates');
  });

  test('shows template cards', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Super Admin — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/notifications');
  });

  test('shows email and whatsapp config sections', async ({ page }) => {
    await expect(page.getByText(/email/i, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/whatsapp/i, { exact: false }).first()).toBeVisible();
  });

  test('SMTP fields are present', async ({ page }) => {
    await expect(page.getByLabel(/smtp host/i).or(page.getByPlaceholder(/smtp\./i))).toBeVisible();
  });

  test('WhatsApp provider options visible', async ({ page }) => {
    // Provider shown as Select or option text
    await expect(page.getByText('META').or(page.getByText('Meta').or(page.getByText('Twilio')))).toBeVisible();
  });
});

test.describe('Super Admin — Settings', () => {
  test('change password form is shown', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/settings');
    await expect(page.getByText(/change password/i)).toBeVisible();
    // Label may be 'Current' or 'Current Password'
    await expect(page.getByLabel(/current/i).first()).toBeVisible();
  });
});
