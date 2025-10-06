import Link from 'next/link'
import { absoluteUrl } from '@/lib/url'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export default async function AdminProductsPage() {
  const res = await fetch(await absoluteUrl('/api/products'), { cache: 'no-store' })
  const data = await res.json()
  const products = data.products as Array<{ id: number; name: string; priceCents: number; sku: string; stock: number }>
  return (
    <main className="container mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin: Products</h1>
        <Link href="/admin/products/new" className="text-primary hover:underline">Create product</Link>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">SKU</th>
              <th className="px-3 py-2 text-left font-medium">Price</th>
              <th className="px-3 py-2 text-left font-medium">Stock</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{p.id}</td>
                <td className="px-3 py-2">
                  <Link href={`/products/${p.id}`} className="text-primary hover:underline">{p.name}</Link>
                </td>
                <td className="px-3 py-2">{p.sku}</td>
                <td className="px-3 py-2">${(p.priceCents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:underline">Edit</Link>
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
                      <button className="text-red-600 hover:underline" type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
