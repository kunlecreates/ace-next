import { absoluteUrl } from '@/lib/url'
import { cookies } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const c = await cookies()
  const res = await fetch(await absoluteUrl('/api/orders'), { headers: { cookie: c.toString() }, cache: 'no-store' })
  if (res.status === 401) return <main><p>Please <Link href="/login">sign in</Link> to view orders.</p></main>
  const data = await res.json()
  const orders = data.orders as Array<{ id: number; status: string; totalCents: number; createdAt: string }>
  return (
    <main>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`}>Order #{o.id}</Link> — {o.status} — ${(o.totalCents / 100).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
