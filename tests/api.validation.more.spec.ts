import { test, expect } from '@playwright/test'

const PASSWORD = 'ChangeMe123!'

function rand(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}`
}

async function register(page: any) {
  const email = `${rand('u')}@example.com`
  const resp = await page.request.post('/api/auth/register', {
    data: { email, name: 'Val Tester', password: PASSWORD },
  })
  expect(resp.status()).toBe(200)
  return email
}

async function login(page: any, email: string) {
  const resp = await page.request.post('/api/auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(resp.status()).toBe(200)
}

test('auth/login returns 400 for invalid payload', async ({ page }) => {
  const resp = await page.request.post('/api/auth/login', { data: { email: 'not-an-email' } })
  expect(resp.status()).toBe(400)
  const j = await resp.json()
  expect(j?.error?.message).toBeTruthy()
})

test('auth/register returns 400 for invalid payload', async ({ page }) => {
  const resp = await page.request.post('/api/auth/register', { data: { email: 'bad', password: 'x', name: '' } })
  expect(resp.status()).toBe(400)
})

test('me PATCH invalid JSON returns 400', async ({ page }) => {
  const email = await register(page)
  await login(page, email)
  const resp = await page.request.patch('/api/me', { data: 'not-json' as any, headers: { 'Content-Type': 'application/json' } })
  expect(resp.status()).toBe(400)
})

test('products GET with minPrice > maxPrice returns 400', async ({ page }) => {
  const resp = await page.request.get('/api/products?minPrice=200&maxPrice=100')
  expect(resp.status()).toBe(400)
})

test('cart DELETE invalid JSON returns 400', async ({ page }) => {
  const email = await register(page)
  await login(page, email)
  const resp = await page.request.delete('/api/cart', { data: 'x' as any, headers: { 'Content-Type': 'application/json' } })
  expect(resp.status()).toBe(400)
})
