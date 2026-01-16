import { expect, test } from '@playwright/test';

test('home page renders main content', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('main#main-content')).toBeVisible();
});
