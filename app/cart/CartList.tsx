'use client'

import React from 'react'

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
    } catch (e: any) {
      setError(e.message ?? 'Remove failed')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {items.map((it) => (
          <li key={it.productId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              {it.product.name} — ${(it.product.priceCents * it.qty / 100).toFixed(2)}
            </div>
            <input
              type="number"
              min={0}
              value={draftQty[it.productId] ?? it.qty}
              onChange={(e) =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: Math.max(0, Number(e.target.value) || 0) }))
              }
              style={{ width: 72 }}
              disabled={updatingId === it.productId}
            />
            <button
              onClick={() =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: (prev[it.productId] ?? it.qty) + 1 }))
              }
              disabled={updatingId === it.productId}
            >
              +
            </button>
            <button
              onClick={() =>
                setDraftQty((prev) => ({ ...prev, [it.productId]: Math.max(0, (prev[it.productId] ?? it.qty) - 1) }))
              }
              disabled={updatingId === it.productId}
            >
              -
            </button>
            <button
              onClick={() => updateQty(it.productId, draftQty[it.productId] ?? it.qty)}
              disabled={
                updatingId === it.productId ||
                cooldown.has(it.productId) ||
                (draftQty[it.productId] ?? it.qty) === it.qty
              }
            >
              Update
            </button>
            <button onClick={() => removeItem(it.productId)} disabled={updatingId === it.productId}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p>
        Subtotal:{' '}
        {(
          items.reduce((sum, it) => sum + it.product.priceCents * it.qty, 0) / 100
        ).toFixed(2)}
      </p>
    </div>
  )
}
