import { describe, it, expect } from 'vitest'
import { ok, err, badRequest, unauthorized, forbidden, notFound, tooMany } from '../../lib/http'

function jsonOf(res: any) {
  return res.json()
}

describe('http helpers', () => {
  it('ok should return data and honor no-store option', async () => {
    const res = ok({ a: 1 }, undefined, { noStore: true })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = await jsonOf(res)
    expect(body).toEqual({ a: 1 })
  })

  it('err should wrap message and code', async () => {
    const res = err(418, 'Teapot', { code: 'E_TP' })
    expect(res.status).toBe(418)
    const body = await jsonOf(res)
    expect(body).toEqual({ error: { message: 'Teapot', code: 'E_TP' } })
  })

  it('shortcuts produce expected statuses', async () => {
    expect((await jsonOf(unauthorized())).error.message).toBe('Unauthorized')
    expect((await jsonOf(forbidden())).error.message).toBe('Forbidden')
    expect((await jsonOf(badRequest('Bad', { foo: 'bar' }))).error.issues).toEqual({ foo: 'bar' })
    expect((await jsonOf(notFound())).error.message).toBe('Not Found')
    expect((await jsonOf(tooMany())).error.message).toBe('Too Many Requests')
  })
})
