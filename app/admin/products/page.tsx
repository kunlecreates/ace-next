import Link from 'next/link'
import { absoluteUrl } from '@/lib/url'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export default async function AdminProductsPage() {
  const res = await fetch(await absoluteUrl('/api/products'), { cache: 'no-store' })
  const data = await res.json()
  const products = data.products as Array<{ id: number; name: string; priceCents: number; sku: string; stock: number }>
  return (
    <main>
      <h1>Admin: Products</h1>
      <p>
        <Link href="/admin/products/new">Create product</Link>
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                <Link href={`/products/${p.id}`}>{p.name}</Link>
              </td>
              <td>{p.sku}</td>
              <td>${(p.priceCents / 100).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                {/* Simple delete form */}
                <form action={async () => {
                  'use server'
                  const c = await cookies()
                  const cookieHeader = c.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
                  await fetch(await absoluteUrl(`/api/products/${p.id}`), {
                    method: 'DELETE',
                    headers: { cookie: cookieHeader },
                  })
                  revalidatePath('/admin/products')
                }}>
                  <button type="submit">Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
