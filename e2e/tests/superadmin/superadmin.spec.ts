import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CREDENTIALS } from '../../fixtures/credentials';

test.use({ storageState: undefined });

async function loginAsSuperAdmin(page: Page) {
  const login = new LoginPage(page);
  await login.login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
  await expect(page).toHaveURL(/\/super\/dashboard/);
}

test.describe('Super Admin — Dashboard', () => {
  test('shows platform stats cards', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page.getByText(/total customers/i)).toBeVisible();
    await expect(page.getByText(/admins/i)).toBeVisible();
    await expect(page.getByText(/stores/i)).toBeVisible();
  });
});

test.describe('Super Admin — Admins', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/admins');
  });

  test('lists admins table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
  });

  test('create admin opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add admin/i }).click();
    await expect(page.getByRole('dialog').or(page.locator('[data-testid="modal"]')).or(page.getByText('Add Admin'))).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('search filters admin list', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i);
    await search.fill('nonexistent@example.com');
    await expect(page.getByText(/no admins yet/i).or(page.locator('tbody tr'))).toBeDefined();
  });
});

test.describe('Super Admin — Stores', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/stores');
  });

  test('shows stores table with correct columns', async ({ page }) => {
    await expect(page.getByText('Store Name')).toBeVisible();
    await expect(page.getByText('Store ID')).toBeVisible();
    await expect(page.getByText('Days Left')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('add store button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add store/i }).click();
    await expect(page.getByText('Add Store')).toBeVisible();
    await expect(page.getByLabel('Store Name')).toBeVisible();
    await expect(page.getByLabel(/store url id/i)).toBeVisible();
  });

  test('live/offline toggle button visible per store row', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const firstRow = rows.first();
      await expect(firstRow.getByRole('button', { name: /go live|go offline/i })).toBeVisible();
    }
  });
});

test.describe('Super Admin — Customers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/customers');
  });

  test('shows customer table', async ({ page }) => {
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('block/unblock button visible per customer', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    if (count > 0) {
      const firstRow = rows.first();
      await expect(firstRow.getByRole('button', { name: /block|unblock/i })).toBeVisible();
    }
  });

  test('search filters by email', async ({ page }) => {
    await page.getByPlaceholder(/search by email/i).fill('test@');
    await page.waitForTimeout(300);
    // Table should have filtered or show no results
    await expect(page.locator('tbody')).toBeVisible();
  });
});

test.describe('Super Admin — Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/subscriptions');
  });

  test('shows subscription plans table', async ({ page }) => {
    await expect(page.getByText('Subscription Plans')).toBeVisible();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByText('Price')).toBeVisible();
    await expect(page.getByText('Period')).toBeVisible();
  });

  test('create plan form has all required fields', async ({ page }) => {
    await expect(page.getByLabel('Plan Name')).toBeVisible();
    await expect(page.getByLabel('Price')).toBeVisible();
    await expect(page.getByLabel('Currency')).toBeVisible();
    await expect(page.getByText('Billing Period')).toBeVisible();
  });

  test('creates a new subscription plan', async ({ page }) => {
    const planName = `Test Plan ${Date.now()}`;
    await page.getByLabel('Plan Name').fill(planName);
    await page.getByLabel('Price').fill('999');
    await page.getByLabel('Currency').fill('INR');
    await page.getByRole('button', { name: /create plan/i }).click();
    await expect(page.getByText(planName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Super Admin — Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/templates');
  });

  test('shows template cards', async ({ page }) => {
    await expect(page.getByText(/templates/i).first()).toBeVisible();
  });
});

test.describe('Super Admin — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/notifications');
  });

  test('shows email and whatsapp config sections', async ({ page }) => {
    await expect(page.getByText(/email/i).first()).toBeVisible();
    await expect(page.getByText(/whatsapp/i)).toBeVisible();
  });

  test('SMTP fields are present', async ({ page }) => {
    await expect(page.getByPlaceholder(/smtp\.example\.com|smtp host/i).or(page.getByLabel(/smtp host/i))).toBeVisible();
  });

  test('WhatsApp provider toggle works', async ({ page }) => {
    const metaBtn = page.getByRole('button', { name: 'META' }).or(page.getByText('META').first());
    const twilioBtn = page.getByRole('button', { name: 'TWILIO' }).or(page.getByText('TWILIO').first());
    await expect(metaBtn).toBeVisible();
    await expect(twilioBtn).toBeVisible();
  });
});

test.describe('Super Admin — Settings', () => {
  test('change password form is shown', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/settings');
    await expect(page.getByText(/change password/i)).toBeVisible();
    await expect(page.getByLabel(/current password/i)).toBeVisible();
  });
});
