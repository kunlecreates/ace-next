import { absoluteUrl } from '@/lib/url'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await cookies()
  const res = await fetch(await absoluteUrl(`/api/orders/${id}`), { headers: { cookie: c.toString() }, cache: 'no-store' })
  if (res.status === 401) return <main><p>Unauthorized</p></main>
  if (res.status === 404) return <main><p>Order not found</p></main>
  const data = await res.json()
  const order = data.order as {
    id: number; status: string; totalCents: number; createdAt: string;
    items: Array<{ qty: number; priceCents: number; product: { name: string; sku: string } }>
  }
  return (
    <main>
      <h1>Order #{order.id}</h1>
      <p>Status: {order.status}</p>
      <ul>
        {order.items.map((it, idx) => (
          <li key={idx}>
            {it.product.name} ({it.product.sku}) x {it.qty} — ${(it.priceCents * it.qty / 100).toFixed(2)}
          </li>
        ))}
      </ul>
      <p>Total: ${(order.totalCents / 100).toFixed(2)}</p>
    </main>
  )
}
