import { describe, it, expect } from 'vitest'
import { ProductsQuerySchema, CartPatchSchema, ProductUpdateSchema, MePatchSchema } from '../../lib/schemas'

describe('schemas edge cases', () => {
  it('ProductsQuerySchema minPrice > maxPrice should fail', () => {
    const result = ProductsQuerySchema.safeParse({ minPrice: 200, maxPrice: 100 })
    expect(result.success).toBe(false)
  })

  it('CartPatchSchema qty <= 0 should still parse, treated as remove by API', () => {
    const resultZero = CartPatchSchema.safeParse({ productId: 1, qty: 0 })
    const resultNeg = CartPatchSchema.safeParse({ productId: 1, qty: -5 })
    expect(resultZero.success).toBe(true)
    expect(resultNeg.success).toBe(true)
  })

  it('ProductUpdateSchema with no fields should fail', () => {
    const result = ProductUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('MePatchSchema empty payload should fail', () => {
    const result = MePatchSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
