import { test, expect } from '@playwright/test'
import { execFileSync } from 'child_process'

function randomEmail(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}@example.com`
}

const PASSWORD = 'ChangeMe123!'

test('customer checkout and admin status update end-to-end', async ({ page, baseURL }) => {
  const customerEmail = randomEmail('cust')
  const adminEmail = randomEmail('admin')

  // Register customer
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(customerEmail)
  await page.getByLabel(/name/i).fill('Customer Test')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  const createBtn = page.getByRole('button', { name: /create account|sign up|register|submit/i })
  await createBtn.click()

  // Login customer
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(customerEmail)
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  // Ensure the login navigation completes
  await expect(page.getByRole('heading', { name: 'Acegrocer' })).toBeVisible()
  // Wait for navigation and app hydration after login
  await expect(page.getByRole('heading', { name: 'Acegrocer' })).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${baseURL?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''}/?`))

  // Add a specific seeded product to cart to avoid interference from other tests
  await page.goto('/products')
  const bananaLink = page.getByRole('link', { name: /^Bananas$/ })
  await bananaLink.click()
  // On product detail, add to cart
  await page.getByRole('button', { name: /add to cart/i }).click()
  await expect(page).toHaveURL(/\/cart/)

  // Increment quantity and update
  const updateBtn = page.getByRole('button', { name: /^update$/i }).first()
  const plusBtn = page.getByRole('button', { name: /^\+$/ }).first()
  await plusBtn.click()
  await updateBtn.click()

  // Checkout
  await page.getByRole('button', { name: /checkout/i }).click()
  await expect(page).toHaveURL(/\/cart\?success=1/)
  await expect(page.getByText(/order placed successfully/i)).toBeVisible()
  const cartUrl = new URL(page.url())
  const orderIdStr = cartUrl.searchParams.get('orderId')
  expect(orderIdStr).not.toBeNull()

  // Verify orders page has at least one order link
  await page.goto('/orders')
  await expect(page.locator('a[href^="/orders/"]').first()).toBeVisible()

  // Logout customer
  const logoutButton = page.getByRole('button', { name: /logout/i })
  if (await logoutButton.count()) {
    await logoutButton.click()
  } else {
    // fallback: call logout API
    await page.request.post('/api/auth/logout')
    await page.goto('/')
  }

  // Register admin
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(adminEmail)
  await page.getByLabel(/name/i).fill('Admin Test')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /create account|sign up|register|submit/i }).click()

  // Promote admin via script
  execFileSync('node', ['scripts/make-admin.mjs', adminEmail], { stdio: 'inherit' })

  // Login admin
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(adminEmail)
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  // Wait until server recognizes admin role
  await expect(page.getByRole('heading', { name: 'Acegrocer' })).toBeVisible()
  await page.waitForFunction(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      return data?.user?.role === 'ADMIN'
    } catch {
      return false
    }
  }, { timeout: 5000 })

  // Go to admin orders (newest first)
  await page.goto('/admin/orders?sort=createdAt&order=desc')
  await expect(page.getByRole('heading', { name: /admin: orders/i })).toBeVisible()
  // Target the row for the customer who just ordered, using the email as a stable identifier
  const targetRow = page.locator(`[data-testid="order-row"][data-user-email="${customerEmail}"]`).first()
  await expect(targetRow).toBeVisible()
  const rowStatus = targetRow.locator('[data-testid="order-row-status"]')
  await expect(rowStatus).toBeVisible()
  await rowStatus.selectOption('SHIPPED')
  await targetRow.locator('[data-testid="order-row-update"]').click()
  await expect(targetRow.locator('[data-testid="order-status-badge"]', { hasText: /shipped/i })).toBeVisible({ timeout: 10000 })
})
