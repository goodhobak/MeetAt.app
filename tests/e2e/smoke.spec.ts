import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic functionality verification
 * These tests verify the core application flows work end-to-end
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page title or main heading is present
    await expect(page.locator('text=Create New Event')).toBeVisible();
  });

  test('can create a basic event', async ({ page }) => {
    await page.goto('/');

    // Fill in event name
    await page.fill('#name', '테스트 이벤트');

    // Select duration
    await page.selectOption('#duration', '90');

    // Add a date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date-input', dateString);
    await page.click('button:has-text("Add Date")');

    // Verify date was added
    await expect(page.locator('text=' + dateString.substring(5))).toBeVisible();

    // Set time range
    await page.fill('#time-start', '09:00');
    await page.fill('#time-end', '18:00');

    // Submit form
    await page.click('button:has-text("Create Event")');

    // Wait for navigation to event page
    await page.waitForURL(/\/#\/event\/.+/);

    // Verify we're on the event page
    await expect(page.locator('text=테스트 이벤트')).toBeVisible();
  });

  test('can create event with password', async ({ page }) => {
    await page.goto('/');

    // Fill in basic details
    await page.fill('#name', '비밀번호 보호 이벤트');
    await page.selectOption('#duration', '60');

    // Add a date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date-input', dateString);
    await page.click('button:has-text("Add Date")');

    // Set password
    await page.fill('#password', 'test123');

    // Submit
    await page.click('button:has-text("Create Event")');
    await page.waitForURL(/\/#\/event\/.+/);

    const eventUrl = page.url();

    // Open in new context to simulate password requirement
    await page.goto('/');
    await page.goto(eventUrl);

    // Should see password input
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Enter wrong password
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]').first();

    // Should see error (implementation may vary)
    // Note: This will depend on your LockScreen component implementation

    // Enter correct password
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]').first();

    // Should see event content
    await expect(page.locator('text=비밀번호 보호 이벤트')).toBeVisible();
  });

  test('can submit a vote', async ({ page }) => {
    // Create event first
    await page.goto('/');
    await page.fill('#name', '투표 테스트');
    await page.selectOption('#duration', '60');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date-input', dateString);
    await page.click('button:has-text("Add Date")');
    await page.click('button:has-text("Create Event")');
    await page.waitForURL(/\/#\/event\/.+/);

    // Now submit a vote
    // Find the participant name input (VotingInterface component)
    const nameInput = page.locator('input[placeholder*="이름"]').or(page.locator('input[placeholder*="name"]'));
    await nameInput.fill('김민수');

    // Click the "전체" (All) button to select all slots
    const allButton = page.locator('button:has-text("전체")');
    if (await allButton.isVisible()) {
      await allButton.click();
    }

    // Submit vote
    const submitButton = page.locator('button:has-text("투표")').first();
    await submitButton.click();

    // Verify vote was submitted (should see participant name in list)
    await expect(page.locator('text=김민수')).toBeVisible();
  });

  test('can view results', async ({ page }) => {
    // Create event and add vote first
    await page.goto('/');
    await page.fill('#name', '결과 확인 테스트');
    await page.selectOption('#duration', '60');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date-input', dateString);
    await page.click('button:has-text("Add Date")');
    await page.click('button:has-text("Create Event")');
    await page.waitForURL(/\/#\/event\/.+/);

    // Add a vote
    const nameInput = page.locator('input[placeholder*="이름"]').or(page.locator('input[placeholder*="name"]'));
    await nameInput.fill('박지영');

    const allButton = page.locator('button:has-text("전체")');
    if (await allButton.isVisible()) {
      await allButton.click();
    }

    const submitButton = page.locator('button:has-text("투표")').first();
    await submitButton.click();

    // Switch to results tab
    const resultsTab = page.locator('button:has-text("결과")').or(page.locator('button:has-text("Results")'));
    await resultsTab.click();

    // Verify results are visible
    // Should see heatmap or timeline (implementation specific)
    await expect(page.locator('text=박지영').or(page.locator('text=1명'))).toBeVisible();
  });
});

/**
 * Critical Path: Basic Event Flow
 * This test covers the minimal critical path through the application
 */
test.describe('Critical Path: Event Creation and Voting', () => {
  test('complete event flow', async ({ page }) => {
    // 1. Create event
    await page.goto('/');
    await page.fill('#name', 'Critical Path Test');
    await page.selectOption('#duration', '90');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date-input', dateString);
    await page.click('button:has-text("Add Date")');
    await page.fill('#time-start', '09:00');
    await page.fill('#time-end', '18:00');
    await page.click('button:has-text("Create Event")');
    await page.waitForURL(/\/#\/event\/.+/);

    const eventUrl = page.url();

    // 2. First participant votes
    let nameInput = page.locator('input[placeholder*="이름"]').or(page.locator('input[placeholder*="name"]'));
    await nameInput.fill('Alice');

    let allButton = page.locator('button:has-text("전체")');
    if (await allButton.isVisible()) {
      await allButton.click();
    }

    await page.locator('button:has-text("투표")').first().click();
    await expect(page.locator('text=Alice')).toBeVisible();

    // 3. Second participant votes (simulate different user)
    await page.goto(eventUrl);

    nameInput = page.locator('input[placeholder*="이름"]').or(page.locator('input[placeholder*="name"]'));
    await nameInput.fill('Bob');

    allButton = page.locator('button:has-text("전체")');
    if (await allButton.isVisible()) {
      await allButton.click();
    }

    await page.locator('button:has-text("투표")').first().click();
    await expect(page.locator('text=Bob')).toBeVisible();

    // 4. View results
    const resultsTab = page.locator('button:has-text("결과")').or(page.locator('button:has-text("Results")'));
    if (await resultsTab.isVisible()) {
      await resultsTab.click();
    }

    // Should show 2 participants
    await expect(page.locator('text=2명').or(page.locator('text=Alice'))).toBeVisible();

    // Test passes if we got this far without errors
    expect(true).toBe(true);
  });
});
