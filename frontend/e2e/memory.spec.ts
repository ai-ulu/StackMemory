import { test, expect } from '@playwright/test';

test.describe('Memory Dashboard Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/memory');
  });

  test('should render dashboard shell', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Project memory control center/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to chat/i })).toBeVisible();
  });

  test('should render top stat cards', async ({ page }) => {
    await expect(page.getByText('Total memories')).toBeVisible();
    await expect(page.getByText('Starter memories')).toBeVisible();
    await expect(page.getByText('Average confidence')).toBeVisible();
  });

  test('should render inventory section', async ({ page }) => {
    await expect(page.getByText('Memory inventory')).toBeVisible();
    await expect(page.getByPlaceholder('Search memory content or source')).toBeVisible();
  });

  test('should render memory filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rules' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Decisions' })).toBeVisible();
  });

  test('should support filter click interaction', async ({ page }) => {
    await page.getByRole('button', { name: 'Rules' }).click();
    await expect(page.getByRole('button', { name: 'Rules' })).toBeVisible();
  });

  test('should keep dashboard shell stable after initial load', async ({ page }) => {
    await page.waitForTimeout(1000);
    await expect(page.getByText('Memory inventory')).toBeVisible();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  });
});
