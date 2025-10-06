'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function QuickAddToCartButton({ productId }: { productId: number }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const add = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: 1 }),
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) throw new Error('Add to cart failed')
      window.dispatchEvent(new Event('cart:updated'))
      toast.success('Added to cart')
    } catch (e: any) {
      toast.error(e?.message ?? 'Add to cart failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={add}
      disabled={loading}
      className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      aria-label="Quick add to cart"
    >
      {loading ? 'Adding…' : 'Add'}
    </button>
  )
}
