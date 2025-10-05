import { test, expect } from '@playwright/test'

function randomEmail(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}@example.com`
}

const PASSWORD = 'ChangeMe123!'

async function registerAndPromoteAdmin(page: any, email: string) {
  // Register
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/name/i).fill('Admin Neg Test')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /create account|sign up|register|submit/i }).click()
  // Promote
  const { execFileSync } = await import('child_process')
  execFileSync('node', ['scripts/make-admin.mjs', email], { stdio: 'inherit' })
  // Login
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
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
}

test('PATCH /api/admin/orders returns 400 for invalid payload', async ({ page }) => {
  const adminEmail = randomEmail('admin')
  await registerAndPromoteAdmin(page, adminEmail)

  const resp = await page.request.patch('/api/admin/orders', {
    data: { id: -1, status: 'INVALID' },
  })
  expect(resp.status()).toBe(400)
  const json = await resp.json()
  expect(json?.error).toBeTruthy()
})

test('PATCH /api/admin/orders returns 404 for non-existent order', async ({ page }) => {
  const adminEmail = randomEmail('admin')
  await registerAndPromoteAdmin(page, adminEmail)

  const resp = await page.request.patch('/api/admin/orders', {
    data: { id: 999999, status: 'SHIPPED' },
  })
  expect(resp.status()).toBe(404)
  const json = await resp.json()
  expect(json?.error).toBeTruthy()
})
