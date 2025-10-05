import Link from 'next/link'
import { absoluteUrl } from '@/lib/url'

export default async function ProductsPage() {
  const res = await fetch(await absoluteUrl('/api/products'), { cache: 'no-store' })
  const data = await res.json()
  const products = data.products as Array<{ id: number; name: string; priceCents: number; sku: string; stock: number }>
  return (
    <main>
      <h1>Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id} style={{ margin: '8px 0' }}>
            <Link href={`/products/${p.id}`}>{p.name}</Link> – ${(p.priceCents / 100).toFixed(2)}
          </li>
        ))}
      </ul>
    </main>
  )
}
