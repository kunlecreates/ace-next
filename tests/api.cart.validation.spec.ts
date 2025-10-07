import { test, expect } from '@playwright/test'

const PASSWORD = 'ChangeMe123!'

function rand(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}`
}

async function registerAndLogin(page: any) {
  const email = `${rand('u')}@example.com`
  // Register via API
  const r = await page.request.post('/api/auth/register', {
    data: { email, name: 'Cart Tester', password: PASSWORD },
  })
  expect(r.status()).toBe(200)
  // Login via UI to establish browser cookies
  await page.goto('/login')
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await expect(page.getByRole('link', { name: 'Acegrocer' })).toBeVisible()
  return email
}

async function getFirstProductId(request: any) {
  const resp = await request.get('/api/products')
  expect(resp.status()).toBe(200)
  const json = await resp.json()
  const id = json?.products?.[0]?.id
  expect(id).toBeTruthy()
  return id
}

// Happy path add within bounds
test('POST /api/cart respects qty max 100 and returns 400 when exceeded', async ({ page }) => {
  await registerAndLogin(page)
  const productId = await getFirstProductId(page.request)

  const ok = await page.request.post('/api/cart', { data: { productId, qty: 100 } })
  expect(ok.status()).toBe(200)

  const tooMuch = await page.request.post('/api/cart', { data: { productId, qty: 101 } })
  expect(tooMuch.status()).toBe(400)
  const j = await tooMuch.json()
  expect(j?.error).toBeTruthy()
})

// PATCH within bounds, and above bounds
test('PATCH /api/cart caps qty to 100 via validation', async ({ page }) => {
  await registerAndLogin(page)
  const productId = await getFirstProductId(page.request)

  const initial = await page.request.patch('/api/cart', { data: { productId, qty: 1 } })
  expect(initial.status()).toBe(200)

  const ok = await page.request.patch('/api/cart', { data: { productId, qty: 100 } })
  expect(ok.status()).toBe(200)

  const tooMuch = await page.request.patch('/api/cart', { data: { productId, qty: 1000 } })
  expect(tooMuch.status()).toBe(400)
})
