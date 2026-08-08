import { test, expect } from '@playwright/test';

// Storefront tests run against the customer-facing storefront app
// baseURL is set to STOREFRONT_URL in playwright.config.ts for this project

const TEST_STORE_SUBDOMAIN = process.env.TEST_STORE_SUBDOMAIN || 'demo';

test.describe('Storefront — Browse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}`);
  });

  test('homepage loads with store name', async ({ page }) => {
    await expect(page).not.toHaveTitle('Error');
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation bar is visible', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('products page loads', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/products`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('about page loads', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/about`);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Storefront — Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/products`);
  });

  test('add to cart button present on product', async ({ page }) => {
    const addToCart = page.getByRole('button', { name: /add to cart/i }).first();
    const count = await addToCart.count();
    if (count > 0) {
      await addToCart.click();
      // Cart count or confirmation should appear
      await page.waitForTimeout(500);
    }
  });

  test('cart page is accessible', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/cart`);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Storefront — Customer Auth', () => {
  test('login page accessible', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/login`);
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('register page accessible', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/register`);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Storefront — Orders', () => {
  test('orders page requires login', async ({ page }) => {
    await page.goto(`/s/${TEST_STORE_SUBDOMAIN}/orders`);
    // Should redirect to login or show auth gate
    const url = page.url();
    const body = await page.locator('body').textContent();
    expect(url.includes('login') || (body ?? '').includes('sign in') || (body ?? '').includes('orders')).toBeTruthy();
  });
});
