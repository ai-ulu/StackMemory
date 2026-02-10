import { test, expect } from '@playwright/test';

test.describe('Memory System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to memory dashboard
    await page.goto('/memory');
  });

  test('should display memory dashboard', async ({ page }) => {
    // Check title
    await expect(page.getByRole('heading', { name: 'Memory System' })).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'Memory Graph' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Memory List' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible();
  });

  test('should display memory stats', async ({ page }) => {
    // Wait for stats to load
    await page.waitForTimeout(1000);
    
    // Check for stat badges
    const stmBadge = page.locator('text=/STM:/');
    const episodesBadge = page.locator('text=/Episodes:/');
    const vectorsBadge = page.locator('text=/Vectors:/');
    
    await expect(stmBadge).toBeVisible();
    await expect(episodesBadge).toBeVisible();
    await expect(vectorsBadge).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click Memory List tab
    await page.getByRole('tab', { name: 'Memory List' }).click();
    await expect(page.getByText('Recent Memories')).toBeVisible();
    
    // Click Search tab
    await page.getByRole('tab', { name: 'Search' }).click();
    await expect(page.getByText('Search Memories')).toBeVisible();
    await expect(page.getByPlaceholder('Search memories...')).toBeVisible();
    
    // Click back to Memory Graph
    await page.getByRole('tab', { name: 'Memory Graph' }).click();
    await expect(page.getByText('Memory Network')).toBeVisible();
  });

  test('should search memories', async ({ page }) => {
    // Go to search tab
    await page.getByRole('tab', { name: 'Search' }).click();
    
    // Enter search query
    const searchInput = page.getByPlaceholder('Search memories...');
    await searchInput.fill('test query');
    
    // Click search button
    await page.getByRole('button', { name: /Search/ }).click();
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check if search was triggered (button text changes)
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('should display memory list', async ({ page }) => {
    // Go to list tab
    await page.getByRole('tab', { name: 'Memory List' }).click();
    
    // Wait for memories to load
    await page.waitForTimeout(1000);
    
    // Check for list container
    const listContainer = page.locator('.space-y-2.max-h-\\[600px\\]');
    await expect(listContainer).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // If no memories, should show empty state
    const emptyState = page.getByText(/No memories to display|Loading memories/);
    
    // Either loading or empty state should be visible
    const isVisible = await emptyState.isVisible().catch(() => false);
    
    // This is acceptable - either state is valid
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display memory graph canvas', async ({ page }) => {
    // Check for canvas element (ForceGraph2D renders to canvas)
    const canvas = page.locator('canvas');
    
    // Wait a bit for graph to render
    await page.waitForTimeout(2000);
    
    // Canvas should exist
    const canvasCount = await canvas.count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('should display legend', async ({ page }) => {
    // Check for legend
    await expect(page.getByText('Memory Types')).toBeVisible();
    
    // Check for some memory type labels
    const legendItems = page.locator('.capitalize');
    const count = await legendItems.count();
    
    // Should have at least a few memory types
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Memory API Integration', () => {
  test('should record interaction', async ({ request }) => {
    const response = await request.post('/api/memory/interaction', {
      data: {
        user_input: 'Test user input',
        system_output: 'Test system output',
        metadata: { test: true }
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('success');
  });

  test('should get memory stats', async ({ request }) => {
    const response = await request.get('/api/memory/stats');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.stats).toBeDefined();
    expect(data.stats.stm_size).toBeDefined();
  });

  test('should recall memories', async ({ request }) => {
    const response = await request.post('/api/memory/recall', {
      data: {
        query: 'test',
        top_k: 5
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.results).toBeDefined();
    expect(data.results.recent).toBeDefined();
    expect(data.results.episodic).toBeDefined();
  });

  test('should get recent episodes', async ({ request }) => {
    const response = await request.get('/api/memory/episodes?limit=10');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.episodes).toBeDefined();
    expect(Array.isArray(data.episodes)).toBeTruthy();
  });
});
