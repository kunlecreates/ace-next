import { test, expect } from '@playwright/test'

// Quick integration test for the admin PATCH /api/admin/orders route
// - Places an order as a unique per-test user to avoid cross-test interference
// - Uses pre-auth admin storageState to update order status via API

function randomEmail(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}@example.com`
}

const PASSWORD = 'ChangeMe123!'

test('PATCH /api/admin/orders updates status with admin auth', async ({ browser }) => {
  const customerContext = await browser.newContext()
  const customerPage = await customerContext.newPage()
  const email = randomEmail('cust')

  // Register and login customer within this isolated context
  const r1 = await customerPage.request.post('/api/auth/register', {
    data: { email, name: 'Customer API Test', password: PASSWORD },
  })
  expect(r1.status()).toBe(200)
  const rLogin = await customerPage.request.post('/api/auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(rLogin.status()).toBe(200)

  // Pick a product via API (prefer Bananas) and add to cart via API to avoid UI flake
  const productsResp = await customerPage.request.get('/api/products')
  expect(productsResp.status()).toBe(200)
  const productsJson = await productsResp.json()
  const products = productsJson?.products as Array<{ id: number; name: string }>
  expect(products?.length).toBeGreaterThan(0)
  const chosen = products.find((p) => p.name === 'Bananas') || products[0]
  const addResp = await customerPage.request.post('/api/cart', { data: { productId: chosen.id, qty: 1 } })
  expect(addResp.status()).toBe(200)

  // Ensure page has an origin before in-page fetch
  await customerPage.goto('/cart')
  await expect(customerPage).toHaveURL(/\/cart/)
  // Checkout via in-page fetch, capturing the final redirected URL (fetch follows redirects and exposes r.url)
  const finalUrl = await customerPage.evaluate(async () => {
    const r = await fetch('/api/checkout', { method: 'POST' })
    return r.url
  })
  expect(finalUrl).toMatch(/\/cart\?success=1/)
  await customerPage.goto(finalUrl)
  await expect(customerPage).toHaveURL(/\/cart\?success=1/)
  const orderId = new URL(finalUrl).searchParams.get('orderId')
  expect(orderId).not.toBeNull()

  // Use a separate admin context pre-authenticated via storageState to call admin API
  const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' })
  const adminPage = await adminContext.newPage()
  const resp = await adminPage.request.patch('/api/admin/orders', {
    data: { id: Number(orderId), status: 'SHIPPED' },
  })
  expect(resp.status()).toBe(200)
  const json = await resp.json()
  expect(json?.order?.status).toBe('SHIPPED')

  await adminContext.close()
  await customerContext.close()
})
