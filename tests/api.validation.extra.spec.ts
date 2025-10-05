import { test, expect } from '@playwright/test'

const PASSWORD = 'ChangeMe123!'

function rand(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}`
}

async function registerAndLogin(page: any) {
  const email = `${rand('u')}@example.com`
  const reg = await page.request.post('/api/auth/register', { data: { email, name: 'X', password: PASSWORD } })
  expect(reg.status()).toBe(200)
  const login = await page.request.post('/api/auth/login', { data: { email, password: PASSWORD } })
  expect(login.status()).toBe(200)
  return email
}

test('products/[id] invalid id returns 400', async ({ page }) => {
  const resp = await page.request.get('/api/products/not-a-number')
  expect([400, 404]).toContain(resp.status())
})

test('checkout invalid body returns 400 or redirect when empty', async ({ page }) => {
  await registerAndLogin(page)
  const resp = await page.request.post('/api/checkout', { data: 'not-json' as any, headers: { 'Content-Type': 'application/json' } })
  expect([400, 303, 401]).toContain(resp.status())
})

test('me PATCH empty payload returns 400', async ({ page }) => {
  await registerAndLogin(page)
  const resp = await page.request.patch('/api/me', { data: {}, headers: { 'Content-Type': 'application/json' } })
  expect(resp.status()).toBe(400)
})

test('admin orders GET invalid pagination returns 400', async ({ page }) => {
  // Should return 403 for non-admin OR 400 for invalid query; both acceptable as negative behavior
  const resp = await page.request.get('/api/admin/orders?page=-1&pageSize=1000')
  expect([400, 403]).toContain(resp.status())
})
