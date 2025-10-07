import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const AUTH_DIR = path.resolve(__dirname, '../playwright/.auth')
const ADMIN_FILE = path.join(AUTH_DIR, 'admin.json')
const USER_FILE = path.join(AUTH_DIR, 'user.json')

function randomEmail(prefix: string) {
  const n = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${n}@example.com`
}

const PASSWORD = 'ChangeMe123!'

setup('authenticate as admin (seeded)', async ({ request }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  // Login seeded admin via API
  const resp = await request.post('/api/auth/login', {
    data: { email: 'admin@example.com', password: PASSWORD },
  })
  expect(resp.status()).toBe(200)
  // Save admin storage state
  await request.storageState({ path: ADMIN_FILE })
})

setup('authenticate as user (fresh)', async ({ request }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  const email = randomEmail('cust')
  // Register customer then login to ensure cookies set
  const r1 = await request.post('/api/auth/register', {
    data: { email, name: 'Playwright User', password: PASSWORD },
  })
  expect(r1.status()).toBe(200)
  const r2 = await request.post('/api/auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(r2.status()).toBe(200)
  // Save user storage state
  await request.storageState({ path: USER_FILE })
})
