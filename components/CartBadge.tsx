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
  if (!Number(count)) return (
    <a href="/cart" className="inline-flex items-center text-sm hover:underline">
      Cart
    </a>
  )
  return (
    <a href="/cart" className="relative inline-flex items-center text-sm hover:underline">
      Cart
      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] leading-4 text-white">
        {count}
      </span>
    </a>
  )
}
