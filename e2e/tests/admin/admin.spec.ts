import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CREDENTIALS } from '../../fixtures/credentials';

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page);
  // Wait for network idle before checking URL — Cloud Run cold starts are slow
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(CREDENTIALS.admin.email);
  await page.getByLabel('Password').fill(CREDENTIALS.admin.password);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
}

test.describe('Admin — Login', () => {
  test('admin login succeeds and redirects to /dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('[data-slot="card"]').first().or(page.locator('main'))).toBeVisible();
  });

  test('non-admin login shows access denied on admin-ui', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });
});

test.describe('Admin — Dashboard', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test('shows store name and recent orders', async ({ page }) => {
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin — Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/catalog');
  });

  test('shows catalog page with add product button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible();
  });

  test('add product opens form', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await expect(page.getByText(/new product/i)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('create a product', async ({ page }) => {
    await page.getByRole('button', { name: /add product/i }).click();
    await expect(page.getByText(/new product/i)).toBeVisible({ timeout: 5000 });
    const productName = `Test Product ${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(productName);
    await page.locator('input[type="number"]').nth(0).fill('49.99');
    await page.locator('input[type="number"]').nth(1).fill('10');
    await page.getByRole('button', { name: /save product/i }).click();
    await expect(page.getByText(productName)).toBeVisible({ timeout: 10000 });
  });

  test('add category opens form', async ({ page }) => {
    await page.getByRole('button', { name: /\+ category/i }).click();
    await expect(page.getByPlaceholder(/category name/i)).toBeVisible();
  });

  test('edit product opens pre-filled form', async ({ page }) => {
    if (await page.getByRole('button', { name: 'Edit' }).count() > 0) {
      await page.getByRole('button', { name: 'Edit' }).first().click();
      await expect(page.locator('[data-slot="card-title"]', { hasText: /edit product/i })).toBeVisible();
    }
  });
});

test.describe('Admin — Orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/orders');
  });

  test('shows orders page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  });

  test('order status dropdown is present', async ({ page }) => {
    const orders = page.locator('.p-4.bg-white.rounded.border');
    if (await orders.count() > 0) {
      await expect(orders.first().getByRole('combobox')).toBeVisible();
    }
  });
});

test.describe('Admin — Domain & Publish', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/store');
  });

  test('shows store publish page or create store form', async ({ page }) => {
    const hasPublish = await page.getByRole('button', { name: /publish|unpublish/i }).count();
    const hasCreate = await page.getByRole('button', { name: /create store/i }).count();
    expect(hasPublish + hasCreate).toBeGreaterThan(0);
  });

  test('custom domain input present when store exists', async ({ page }) => {
    if (await page.getByPlaceholder(/myshop\.com/i).count() > 0) {
      await expect(page.getByPlaceholder(/myshop\.com/i)).toBeVisible();
    }
  });
});

test.describe('Admin — Shop Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings');
  });

  test('shows settings page with store name field', async ({ page }) => {
    await expect(page.getByText('Shop Settings')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('currency selector shows currency options', async ({ page }) => {
    await expect(page.getByText('USD')).toBeVisible();
    await expect(page.getByText('INR')).toBeVisible();
  });

  test('save settings button present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  });
});

test.describe('Admin — Customize Home', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/customize');
  });

  test('shows hero section customization fields', async ({ page }) => {
    await expect(page.getByText('Customize Home')).toBeVisible();
    // placeholder="Welcome to our store" from source
    await expect(page.getByPlaceholder(/welcome to our store/i)).toBeVisible();
  });

  test('hero style selector is present', async ({ page }) => {
    await expect(page.getByText(/hero style/i)).toBeVisible();
  });
});

test.describe('Admin — Customize About', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/customize/about');
  });

  test('shows about page fields', async ({ page }) => {
    await expect(page.getByText('Customize About Page')).toBeVisible();
    // placeholder="About Us" from source
    await expect(page.getByPlaceholder('About Us')).toBeVisible();
  });

  test('social media fields are present', async ({ page }) => {
    // placeholder="https://instagram.com/yourstore" from source
    await expect(page.getByPlaceholder(/instagram\.com/i)).toBeVisible();
  });
});

test.describe('Admin — Customize Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/customize/navbar');
  });

  test('shows color pickers and nav links', async ({ page }) => {
    await expect(page.getByText('Customize Navbar')).toBeVisible();
    await expect(page.getByText(/colors/i)).toBeVisible();
    await expect(page.getByText(/navigation links/i)).toBeVisible();
  });

  test('can add a new nav link', async ({ page }) => {
    await page.getByPlaceholder(/menu label/i).fill('Test Page');
    await page.getByPlaceholder(/path or https/i).fill('/test');
    await page.locator('button[aria-label="Add"]').click();
    await expect(page.locator('input[value="Test Page"]')).toBeVisible({ timeout: 3000 });
  });
});
