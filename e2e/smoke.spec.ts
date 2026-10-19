import { expect, test } from '@playwright/test'

test('home page loads with the KeCup brand', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('KeCup').first()).toBeVisible()
  await expect(page).toHaveTitle(/KeCup/)
})
