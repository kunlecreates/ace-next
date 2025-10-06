import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Acegrocer' })).toBeVisible()
})

test('unauthenticated users can navigate to login', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /sign in|login/i }).click()
  await expect(page).toHaveURL(/.*login/)
})
