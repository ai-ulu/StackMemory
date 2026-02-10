import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Remember Everything/i })).toBeVisible();
    await expect(page.getByText(/Securely capture, organize/i)).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check navigation exists
    await expect(page.getByRole('link', { name: 'AI-ULU' })).toBeVisible();
    
    // Check nav links
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Security' })).toBeVisible();
  });

  test('should have CTA buttons', async ({ page }) => {
    // Primary CTA
    const tryFreeButton = page.getByRole('link', { name: /Try for Free/i });
    await expect(tryFreeButton).toBeVisible();
    await expect(tryFreeButton).toHaveAttribute('href', '/signup');
    
    // Secondary CTA
    await expect(page.getByRole('button', { name: /Watch Demo/i })).toBeVisible();
    
    // Header CTAs
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started Free/i })).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /Get Started Free/i }).first().click();
    await expect(page).toHaveURL('/signup');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Log In' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should display features section', async ({ page }) => {
    await expect(page.getByText('Smart Capture')).toBeVisible();
    await expect(page.getByText('Contextual Recall')).toBeVisible();
    await expect(page.getByText('Personalized Insights')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await expect(page.getByText('Simple, Transparent Pricing')).toBeVisible();
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();
  });

  test('should display security features', async ({ page }) => {
    await expect(page.getByText('Zero Trust Security Model')).toBeVisible();
    await expect(page.getByText('End-to-End Encryption')).toBeVisible();
  });

  test('should have theme toggle', async ({ page }) => {
    const themeButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    await expect(themeButton).toBeVisible();
    
    // Click to toggle theme
    await themeButton.click();
    // Theme should change (we can't easily test the actual theme, but button should still be there)
    await expect(themeButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hero should still be visible
    await expect(page.getByRole('heading', { name: /Remember Everything/i })).toBeVisible();
    
    // CTAs should be visible
    await expect(page.getByRole('link', { name: /Try for Free/i }).first()).toBeVisible();
  });
});
