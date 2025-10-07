import { test, expect } from '@playwright/test'
// Start tests already authenticated by using the user storage state from setup
test.use({ storageState: 'playwright/.auth/user.json' })

const PASSWORD = 'ChangeMe123!'

function rand(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}`
}

async function register(page: any) {
  const email = `${rand('u')}@example.com`
  const r = await page.request.post('/api/auth/register', {
    data: { email, name: 'Cart Tester', password: PASSWORD },
  })
  expect(r.status()).toBe(200)
  return email
}

async function getFirstProductId(page: any) {
  const resp = await page.request.get('/api/products')
  expect(resp.status()).toBe(200)
  const json = await resp.json()
  const id = json?.products?.[0]?.id
  expect(id).toBeTruthy()
  return id
}

// Happy path add within bounds
test('POST /api/cart respects qty max 100 and returns 400 when exceeded', async ({ page }) => {
  await register(page)
  const productId = await getFirstProductId(page)

  const ok = await page.request.post('/api/cart', { data: { productId, qty: 100 } })
  expect(ok.status()).toBe(200)

  const tooMuch = await page.request.post('/api/cart', { data: { productId, qty: 101 } })
  expect(tooMuch.status()).toBe(400)
  const j = await tooMuch.json()
  expect(j?.error).toBeTruthy()
})

// PATCH within bounds, and above bounds
test('PATCH /api/cart caps qty to 100 via validation', async ({ page }) => {
  await register(page)
  const productId = await getFirstProductId(page)

  const initial = await page.request.patch('/api/cart', { data: { productId, qty: 1 } })
  expect(initial.status()).toBe(200)

  const ok = await page.request.patch('/api/cart', { data: { productId, qty: 100 } })
  expect(ok.status()).toBe(200)

  const tooMuch = await page.request.patch('/api/cart', { data: { productId, qty: 1000 } })
  expect(tooMuch.status()).toBe(400)
})
