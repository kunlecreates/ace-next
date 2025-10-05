'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function AddToCartButton({ productId }: { productId: number }) {
  const router = useRouter()
  const [qty, setQty] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const add = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: Number(qty) || 1 }),
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
  if (!res.ok) throw new Error('Add to cart failed')
  // Notify listeners (e.g., header badge) that cart changed
  window.dispatchEvent(new Event('cart:updated'))
  // Navigate to cart; a refresh ensures server components read the latest cookies/state
  router.push('/cart')
  router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Add to cart failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        style={{ width: 64 }}
      />
      <button onClick={add} disabled={loading}>
        {loading ? 'Adding…' : 'Add to cart'}
      </button>
      {error ? <span style={{ color: 'crimson' }}>{error}</span> : null}
    </div>
  )
}
