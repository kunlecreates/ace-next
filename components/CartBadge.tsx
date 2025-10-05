'use client'

import React from 'react'

function useCartCount() {
  const [count, setCount] = React.useState<number>(0)

  const fetchCount = React.useCallback(async () => {
    try {
      const res = await fetch('/api/cart/count', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setCount(Number(data?.count ?? 0))
    } catch {
      // ignore fetch errors; badge will retry on next interval/event
    }
  }, [])

  React.useEffect(() => {
    fetchCount()
    const onUpdate = () => fetchCount()
    window.addEventListener('cart:updated', onUpdate)
    const id = setInterval(fetchCount, 30000) // light polling as a fallback
    return () => {
      window.removeEventListener('cart:updated', onUpdate)
      clearInterval(id)
    }
  }, [fetchCount])

  return count
}

export default function CartBadge() {
  const count = useCartCount()
  if (!Number(count)) return <a href="/cart">Cart</a>
  return (
    <a href="/cart" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      Cart
      <span
        style={{
          marginLeft: 6,
          background: '#111827',
          color: 'white',
          borderRadius: 9999,
          fontSize: 11,
          lineHeight: '16px',
          padding: '0 6px',
          minWidth: 18,
          textAlign: 'center',
        }}
      >
        {count}
      </span>
    </a>
  )
}
