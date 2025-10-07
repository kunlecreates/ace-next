'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  toast.success('Added to cart')
  // Navigate to cart; a refresh ensures server components read the latest cookies/state
  router.push('/cart')
  router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Add to cart failed')
      toast.error('Add to cart failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="w-16 rounded-md border px-2 py-1"
      />
      <button
        data-testid="add-to-cart"
        onClick={add}
        disabled={loading}
        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add to cart'}
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  )
}
