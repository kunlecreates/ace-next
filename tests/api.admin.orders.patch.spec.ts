import { test, expect } from '@playwright/test'

// Quick integration test for the admin PATCH /api/admin/orders route
// - Creates a customer and places an order via UI
// - Promotes a new admin and logs in
// - Calls the PATCH endpoint directly and verifies the change

function randomEmail(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}@example.com`
}

const PASSWORD = 'ChangeMe123!'

async function login(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(password)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await expect(page.getByRole('heading', { name: 'Acegrocer' })).toBeVisible()
}

test('PATCH /api/admin/orders updates status with admin auth', async ({ page }) => {
  const customerEmail = randomEmail('cust')
  const adminEmail = randomEmail('admin')

  // Register customer and place an order
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(customerEmail)
  await page.getByLabel(/name/i).fill('Customer API Test')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /create account|sign up|register|submit/i }).click()

  await login(page, customerEmail, PASSWORD)
  await page.goto('/products')
  await page.locator('main ul li a').first().click()
  await page.getByRole('button', { name: /add to cart/i }).click()
  await expect(page).toHaveURL(/\/cart/)
  await page.getByRole('button', { name: /checkout/i }).click()
  await expect(page).toHaveURL(/\/cart\?success=1/)
  const orderId = new URL(page.url()).searchParams.get('orderId')
  expect(orderId).not.toBeNull()

  // Logout customer
  const logoutButton = page.getByRole('button', { name: /logout/i })
  if (await logoutButton.count()) await logoutButton.click()

  // Register and promote admin
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(adminEmail)
  await page.getByLabel(/name/i).fill('Admin API Test')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /create account|sign up|register|submit/i }).click()

  // Promote via script (synchronously)
  const { execFileSync } = await import('child_process')
  execFileSync('node', ['scripts/make-admin.mjs', adminEmail], { stdio: 'inherit' })

  // Admin login
  await login(page, adminEmail, PASSWORD)

  // Ensure server recognizes admin role
  await page.waitForFunction(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      return data?.user?.role === 'ADMIN'
    } catch {
      return false
    }
  }, { timeout: 5000 })

  // Use the page's request (shares cookies) to call admin API
  const resp = await page.request.patch('/api/admin/orders', {
    data: { id: Number(orderId), status: 'SHIPPED' },
  })
  expect(resp.status()).toBe(200)
  const json = await resp.json()
  expect(json?.order?.status).toBe('SHIPPED')
})
