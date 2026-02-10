import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Tekrar Hoş Geldiniz/i })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Şifre')).toBeVisible();
      await expect(page.getByRole('button', { name: /Giriş Yap/i })).toBeVisible();
    });

    test('should have link to signup', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /Hesap Oluştur/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', '/signup');
    });

    test('should have forgot password button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Şifremi Unuttum/i })).toBeVisible();
    });

    test('should show validation error for empty form', async ({ page }) => {
      await page.getByRole('button', { name: /Giriş Yap/i }).click();
      
      // HTML5 validation should prevent submission
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toHaveAttribute('required');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByLabel('Email').fill('invalid@test.com');
      await page.getByLabel('Şifre').fill('wrongpassword');
      await page.getByRole('button', { name: /Giriş Yap/i }).click();
      
      // Should show error message (Supabase will return error)
      await expect(page.getByText(/hatalı/i)).toBeVisible({ timeout: 10000 });
    });

    test('should navigate back to home', async ({ page }) => {
      await page.getByRole('link', { name: /Ana Sayfa/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('email input should have correct type', async ({ page }) => {
      await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');
    });

    test('password input should be masked', async ({ page }) => {
      await expect(page.getByLabel('Şifre')).toHaveAttribute('type', 'password');
    });

    test('should show loading state on submit', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Şifre').fill('password123');
      
      const submitButton = page.getByRole('button', { name: /Giriş Yap/i });
      await submitButton.click();
      
      // Should show loading text
      await expect(page.getByText(/Giriş Yapılıyor/i)).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('should display signup form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Hesap Oluştur/i })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Şifre', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Şifre Tekrar')).toBeVisible();
      await expect(page.getByRole('button', { name: /Hesap Oluştur/i })).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /Giriş Yap/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('should show password requirements', async ({ page }) => {
      await expect(page.getByText(/Büyük harf, küçük harf ve rakam içermeli/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('weak');
      await page.getByLabel('Şifre Tekrar').fill('weak');
      await page.getByRole('button', { name: /Hesap Oluştur/i }).click();
      
      // Should show password validation error
      await expect(page.getByText(/en az 8 karakter/i)).toBeVisible({ timeout: 2000 });
    });

    test('should validate password match', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('Password123');
      await page.getByLabel('Şifre Tekrar').fill('Password456');
      await page.getByRole('button', { name: /Hesap Oluştur/i }).click();
      
      // Should show password mismatch error
      await expect(page.getByText(/eşleşmiyor/i)).toBeVisible({ timeout: 2000 });
    });

    test('should navigate back to home', async ({ page }) => {
      await page.getByRole('link', { name: /Ana Sayfa/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('all inputs should be required', async ({ page }) => {
      await expect(page.getByLabel('Email')).toHaveAttribute('required');
      await expect(page.getByLabel('Şifre', { exact: true })).toHaveAttribute('required');
      await expect(page.getByLabel('Şifre Tekrar')).toHaveAttribute('required');
    });

    test('should show loading state on submit', async ({ page }) => {
      await page.getByLabel('Email').fill('newuser@example.com');
      await page.getByLabel('Şifre', { exact: true }).fill('Password123');
      await page.getByLabel('Şifre Tekrar').fill('Password123');
      
      const submitButton = page.getByRole('button', { name: /Hesap Oluştur/i });
      await submitButton.click();
      
      // Should show loading text
      await expect(page.getByText(/Hesap Oluşturuluyor/i)).toBeVisible({ timeout: 2000 });
    });
  });
});
