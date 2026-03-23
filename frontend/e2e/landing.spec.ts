import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /Stop re-explaining your project to every/i })).toBeVisible();
    await expect(page.getByText(/one shared memory layer for project context/i)).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(page.getByRole('link', { name: 'StackMemory' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Use Cases' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
  });

  test('should have CTA buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
    const getStarted = page.getByRole('link', { name: 'Get Started' }).first();
    await expect(getStarted).toBeVisible();
    await expect(getStarted).toHaveAttribute('href', /\/signup/);
    await expect(page.getByRole('link', { name: 'Open builder guide' }).first()).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    const getStarted = page.getByRole('link', { name: 'Get Started' }).first();
    await expect(getStarted).toHaveAttribute('href', /\/signup/);
  });

  test('should navigate to login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', /\/login/);
  });

  test('should display features section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Built for AI-native development workflows/i })).toBeVisible();
    await expect(page.getByText('Recall project context')).toBeVisible();
    await expect(page.getByText('Connect multiple surfaces')).toBeVisible();
  });

  test('should show product-or-infrastructure section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Use StackMemory as a product or as infrastructure/i })).toBeVisible();
    await expect(page.getByText('MCP server')).toBeVisible();
    await expect(page.getByText('API bridge')).toBeVisible();
  });

  test('should display final CTA section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Give every AI coding tool the same project memory/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start free' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Compare plans' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { level: 1, name: /Stop re-explaining your project to every/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
  });
});
