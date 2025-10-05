import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { getUserFromCookie } from '../../lib/session'

const COOKIE_NAME = process.env.COOKIE_NAME ?? 'acegrocer_auth'
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

describe('session.getUserFromCookie', () => {
  it('returns null when no cookie header', async () => {
    const req = new Request('http://localhost/api', { headers: {} })
    const user = await getUserFromCookie(req)
    expect(user).toBeNull()
  })

  it('returns parsed user on valid JWT cookie', async () => {
    const token = jwt.sign({ sub: 123, role: 'ADMIN', email: 'a@b.c' }, JWT_SECRET)
    const headers = new Headers({ cookie: `${COOKIE_NAME}=${token}` })
    const req = new Request('http://localhost/api', { headers })
    const user = await getUserFromCookie(req)
    expect(user).toEqual({ id: 123, role: 'ADMIN', email: 'a@b.c' })
  })

  it('returns null on invalid signature', async () => {
    const bad = jwt.sign({ sub: 1, role: 'CUSTOMER' }, 'wrong-secret')
    const headers = new Headers({ cookie: `${COOKIE_NAME}=${bad}` })
    const req = new Request('http://localhost/api', { headers })
    const user = await getUserFromCookie(req)
    expect(user).toBeNull()
  })
})
