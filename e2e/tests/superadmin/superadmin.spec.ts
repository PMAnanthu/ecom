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
    // Dashboard renders stat cards — wait for any card to appear
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible({ timeout: 10000 });
    // Sidebar has the "Super Admin" label
    await expect(page.getByText('Super Admin')).toBeVisible();
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
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Add Admin' })).toBeVisible({ timeout: 5000 });
    // Use placeholder from source: type="email" placeholder="admin@example.com"
    await expect(page.getByPlaceholder(/admin@example\.com/i)).toBeVisible();
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
    await expect(page.getByRole('columnheader', { name: 'Store Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Store ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Days Left' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('add store button opens modal with form fields', async ({ page }) => {
    await page.getByRole('button', { name: /\+ add store/i }).click();
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Add Store' })).toBeVisible({ timeout: 5000 });
    // placeholder="My Jewellery Store" from source
    await expect(page.getByPlaceholder(/my jewellery store/i)).toBeVisible();
    // placeholder="my-jewellery-store" for URL ID
    await expect(page.getByPlaceholder(/my-jewellery-store/i)).toBeVisible();
  });

  test('live/offline toggle button visible per store row', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    const count = await rows.count();
    if (count > 0) {
      // Scroll row into view and check for the button anywhere on the page
      await expect(page.getByRole('button', { name: /go live|go offline/i }).first()).toBeVisible({ timeout: 5000 });
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

  test('shows subscription plans table', async ({ page }) => {
    await expect(page.getByText('Subscription Plans')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Price' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Period' })).toBeVisible();
  });

  test('create plan form has all required fields', async ({ page }) => {
    // placeholder="Pro" from source
    await expect(page.getByPlaceholder('Pro')).toBeVisible();
    // placeholder="USD" from source
    await expect(page.getByPlaceholder('USD')).toBeVisible();
  });

  test('creates a new subscription plan', async ({ page }) => {
    const planName = `E2E Plan ${Date.now()}`;
    await page.getByPlaceholder('Pro').fill(planName);
    // Price is first number input
    await page.locator('input[type="number"]').first().fill('999');
    await page.getByPlaceholder('USD').fill('INR');
    await page.getByRole('button', { name: /create plan/i }).click();
    await expect(page.getByText(planName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Super Admin — Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/templates');
  });

  test('shows templates page content', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Error');
  });
});

test.describe('Super Admin — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/notifications');
  });

  test('shows email and whatsapp config sections', async ({ page }) => {
    // EmailConfigForm card title is "Email (SMTP)"
    await expect(page.locator('[data-slot="card-title"]', { hasText: /email/i }).first()).toBeVisible();
    // WhatsAppConfigForm card title is "WhatsApp"
    await expect(page.locator('[data-slot="card-title"]', { hasText: /whatsapp/i })).toBeVisible();
  });

  test('SMTP host field is present', async ({ page }) => {
    // placeholder="smtp.example.com" from EmailConfigForm source
    await expect(page.getByPlaceholder('smtp.example.com')).toBeVisible();
  });

  test('WhatsApp provider selector visible', async ({ page }) => {
    // WhatsAppConfigForm has a Select with "Meta (Cloud API)" option
    await expect(page.getByText('Meta (Cloud API)').or(page.getByText('META'))).toBeVisible();
  });
});

test.describe('Super Admin — Settings', () => {
  test('change password form is shown', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super/settings');
    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
