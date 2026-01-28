import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('PILOTYS');
});

test('home page smoke test', async ({ page }) => {
  await page.goto('/');

  // Vérifier que le titre contient PILOTYS
  await expect(page).toHaveTitle(/PILOTYS/i);
});
