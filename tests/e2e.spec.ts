import { test, expect } from '@playwright/test';

test('Full user journey: signup, onboard, log meal', async ({ page }) => {
  // 1. Visit root, should redirect to login
  await page.goto('/');
  await expect(page).toHaveURL(/.*\/login/);

  // 2. Go to signup
  await page.click('text=Sign up');
  await expect(page).toHaveURL(/.*\/signup/);

  // 3. Fill out signup form
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  await page.fill('input[type="email"]', uniqueEmail);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Should redirect to onboarding since it's a new user
  await expect(page).toHaveURL(/.*\/onboarding/);

  // 4. Fill onboarding form
  await page.fill('input[name="name"]', 'Playwright Tester');
  await page.fill('input[name="age"]', '30');
  await page.fill('input[name="weightKg"]', '70');
  await page.fill('input[name="heightCm"]', '175');
  await page.selectOption('select[name="gender"]', 'M');
  await page.selectOption('select[name="activityLevel"]', '1.2');
  // calorieBound is auto-calculated but we can still fill/override it
  await page.fill('input[name="calorieBound"]', '2000');
  await page.selectOption('select[name="dietaryPreference"]', 'Omnivore');
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL('/');
  await expect(page.locator('h1')).toContainText('Hello, Playwright');

  // 5. Navigate to search / log meal
  await page.click('text=Log NLP');
  await expect(page).toHaveURL(/.*\/search/);

  // 6. Search for food
  await page.fill('input[type="text"]', '1 egg');
  await page.click('button[type="submit"]');

  // Wait for extraction yield to show up
  await expect(page.locator('text=Extraction Yield')).toBeVisible({ timeout: 10000 });

  // Add to daily log
  await page.selectOption('select', 'Breakfast');
  await page.click('button:has-text("Add to Daily Log")');

  // Wait for success indicator
  await expect(page.locator('text=Added to Daily Log!')).toBeVisible();

  // 7. Verify dashboard update
  await page.goto('/');
  await expect(page.locator('text=egg')).toBeVisible();
});
