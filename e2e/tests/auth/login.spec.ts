import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CREDENTIALS } from '../../fixtures/credentials';

test.describe('Authentication', () => {
  test('superadmin login succeeds and redirects to /super/dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
    await expect(page).toHaveURL(/\/super\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(CREDENTIALS.superadmin.email, 'wrongpassword');
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('non-superadmin login shows access denied on platform-ui', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login(CREDENTIALS.superadmin.email, CREDENTIALS.superadmin.password);
    await expect(page).toHaveURL(/\/super\/dashboard/);
    await page.getByText('Log out').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to protected route redirects to login', async ({ page }) => {
    await page.goto('/super/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
