import { test, expect } from '@playwright/test';

test('Security test: Prevent onboarding bypass', async ({ page }) => {
  // 1. Visit signup
  await page.goto('/signup');

  // 2. Fill out signup form
  const uniqueEmail = `hacker_${Date.now()}@example.com`;
  await page.fill('input[name="name"]', 'Hacker');
  await page.fill('input[type="email"]', uniqueEmail);
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Should redirect to onboarding
  await expect(page).toHaveURL(/.*\/onboarding/);

  // 3. Hack attempt: Try to manually navigate to /search and bypass onboarding
  await page.goto('/search');

  // 4. Verify we are booted back to /onboarding
  await expect(page).toHaveURL(/.*\/onboarding/);

  // 5. Hack attempt: Try to manually navigate to /profile
  await page.goto('/profile');

  // 6. Verify we are booted back to /onboarding again
  await expect(page).toHaveURL(/.*\/onboarding/);

  // 7. Verify we can access them AFTER completing onboarding
  await page.fill('input[name="name"]', 'Reformed Hacker');
  await page.fill('input[name="age"]', '30');
  await page.fill('input[name="weightKg"]', '70');
  await page.fill('input[name="heightCm"]', '175');
  await page.selectOption('select[name="gender"]', 'M');
  await page.selectOption('select[name="activityLevel"]', '1.2');
  await page.fill('input[name="calorieBound"]', '2000');
  await page.selectOption('select[name="dietaryPreference"]', 'Omnivore');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:3000/');

  // Now we should be able to access search
  await page.goto('/search');
  await expect(page).toHaveURL(/.*\/search/);
});
