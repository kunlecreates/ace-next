import { test, expect } from '@playwright/test'

const PASSWORD = 'ChangeMe123!'

function rand(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}`
}

async function registerAndPromoteAdmin(page: any) {
  const email = `${rand('admin')}@example.com`
  // Register
  await page.goto('/register')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/name/i).fill('Admin Tester')
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /create account|sign up|register|submit/i }).click()
  // Promote via script
  const { execFileSync } = await import('child_process')
  execFileSync('node', ['scripts/make-admin.mjs', email], { stdio: 'inherit' })
  // Login
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password$/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await expect(page.getByRole('heading', { name: 'Acegrocer' })).toBeVisible()
  // Wait for admin role recognition
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

test('POST /api/products returns 400 for invalid payload', async ({ page }) => {
  await registerAndPromoteAdmin(page)
  // Missing required fields
  const r1 = await page.request.post('/api/products', { data: { name: '', priceCents: -1 } })
  expect(r1.status()).toBe(400)
  const j1 = await r1.json()
  expect(j1?.error?.message).toBeTruthy()

  const r2 = await page.request.post('/api/products', { data: { name: 'X', sku: '', priceCents: 100, stock: -5 } })
  expect(r2.status()).toBe(400)
})

test('PATCH /api/products/:id returns 400 for empty or invalid payload', async ({ page }) => {
  await registerAndPromoteAdmin(page)
  // Create a valid product first
  const created = await page.request.post('/api/products', { data: { name: 'Valid', sku: 'SKU1', priceCents: 123, stock: 10 } })
  expect(created.status()).toBe(200)
  const product = await created.json()
  const id = product?.product?.id
  expect(id).toBeTruthy()

  // Empty update
  const r1 = await page.request.patch(`/api/products/${id}`, { data: {} })
  expect(r1.status()).toBe(400)
  // Invalid
  const r2 = await page.request.patch(`/api/products/${id}`, { data: { priceCents: -100 } })
  expect(r2.status()).toBe(400)
})
