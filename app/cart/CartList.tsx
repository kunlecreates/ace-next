'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Item = { productId: number; qty: number; product: { name: string; priceCents: number } }

export default function CartList({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = React.useState(initialItems)
  const [draftQty, setDraftQty] = React.useState<Record<number, number>>(
    Object.fromEntries(initialItems.map((it) => [it.productId, it.qty]))
  )
  const [updatingId, setUpdatingId] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState<Set<number>>(new Set())

  const refreshFromServer = async () => {
    try {
      const res = await fetch('/api/cart', { cache: 'no-store' })
      if (res.status === 401) return (window.location.href = '/login')
      const data = await res.json()
      setItems(data.items ?? [])
      window.dispatchEvent(new Event('cart:updated'))
    } catch (e) {
      // no-op
    }
  }

  const updateQty = async (productId: number, qty: number) => {
    setUpdatingId(productId)
    setError(null)
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty }),
      })
      if (!res.ok) throw new Error('Update failed')
  await refreshFromServer()
  toast.success('Cart updated')
      setCooldown((prev) => {
        const next = new Set(prev)
        next.add(productId)
        return next
      })
      setTimeout(() => {
        setCooldown((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      }, 400)
    } catch (e: any) {
  setError(e.message ?? 'Update failed')
  toast.error('Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (productId: number) => {
    setUpdatingId(productId)
    setError(null)
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) throw new Error('Remove failed')
  await refreshFromServer()
  toast.success('Removed from cart')
    } catch (e: any) {
  setError(e.message ?? 'Remove failed')
  toast.error('Remove failed')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
  <div className="grid gap-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="grid list-none gap-2 p-0">
        {items.map((it) => (
          <li key={it.productId} className="flex items-center gap-2">
            <div className="flex-1">
              {it.product.name} — ${((it.product.priceCents * it.qty) / 100).toFixed(2)}
            </div>
            <input
              type="number"
              min={0}
              value={draftQty[it.productId] ?? it.qty}
              onChange={(e) =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: Math.max(0, Number(e.target.value) || 0) }))
              }
              className="w-20 rounded-md border px-2 py-1"
              disabled={updatingId === it.productId}
            />
            <Button
              onClick={() =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: (prev[it.productId] ?? it.qty) + 1 }))
              }
              disabled={updatingId === it.productId}
              className="h-8 w-8"
              variant="outline"
              size="icon"
              data-testid="cart-plus"
            >
              +
            </Button>
            <Button
              onClick={() =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: Math.max(0, (prev[it.productId] ?? it.qty) - 1) }))
              }
              disabled={updatingId === it.productId}
              className="h-8 w-8"
              variant="outline"
              size="icon"
              data-testid="cart-minus"
            >
              -
            </Button>
            <Button
              onClick={() => updateQty(it.productId, draftQty[it.productId] ?? it.qty)}
              disabled={
                updatingId === it.productId ||
                cooldown.has(it.productId) ||
                (draftQty[it.productId] ?? it.qty) === it.qty
              }
              variant="secondary"
              className="px-3"
              data-testid="cart-update"
            >
              Update
            </Button>
            <Button
              onClick={() => removeItem(it.productId)}
              disabled={updatingId === it.productId}
              variant="destructive"
              className="px-3"
              data-testid="cart-remove"
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">
        Subtotal: {(
          items.reduce((sum, it) => sum + it.product.priceCents * it.qty, 0) / 100
        ).toFixed(2)}
      </p>
    </div>
  )
}
