import { test, expect } from '@playwright/test';

test.describe('Authentication Smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should render login form', async ({ page }) => {
      await expect(page.getByText('StackMemory')).toBeVisible();
      await expect(page.getByText(/workflow/i)).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByRole('button', { name: /Giri|Login/i })).toBeVisible();
    });

    test('should expose signup link', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /Hesap Olu|Sign up/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', /\/signup/);
    });

    test('should expose forgot password action', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Unuttum|Forgot/i })).toBeVisible();
    });

    test('should keep email required', async ({ page }) => {
      await page.getByRole('button', { name: /Giri|Login/i }).click();
      await expect(page.getByLabel('Email')).toHaveAttribute('required');
    });

    test('email and password input types should be correct', async ({ page }) => {
      await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');
      await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    });

    test('home backlink should point to root', async ({ page }) => {
      await expect(page.getByRole('link', { name: /Ana Sayfa|Home/i })).toHaveAttribute('href', '/');
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should render signup form', async ({ page }) => {
      await expect(page.getByText('StackMemory')).toBeVisible();
      await expect(page.getByText(/workflow/i)).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.getByRole('button', { name: /Hesap Olu|Sign up/i })).toBeVisible();
    });

    test('should expose login link', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /Giri|Login/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', /\/login/);
    });

    test('all signup fields should be required', async ({ page }) => {
      await expect(page.getByLabel('Email')).toHaveAttribute('required');
      await expect(page.locator('#password')).toHaveAttribute('required');
      await expect(page.locator('#confirmPassword')).toHaveAttribute('required');
    });

    test('home backlink should point to root', async ({ page }) => {
      await expect(page.getByRole('link', { name: /Ana Sayfa|Home/i })).toHaveAttribute('href', '/');
    });
  });
});
