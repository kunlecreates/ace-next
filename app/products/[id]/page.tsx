import { absoluteUrl } from '@/lib/url'
import { AddToCartButton } from './AddToCartButton'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(await absoluteUrl(`/api/products/${id}`), { cache: 'no-store' })
  const data = await res.json()
  const product = data.product as { id: number; name: string; description?: string | null; priceCents: number; sku: string; stock: number }
  if (!product) return <div>Not found</div>
  return (
    <main>
      <h1>{product.name}</h1>
      <p>SKU: {product.sku}</p>
      <p>Price: ${(product.priceCents / 100).toFixed(2)}</p>
      <p>Stock: {product.stock}</p>
      {product.description ? <p>{product.description}</p> : null}
      <AddToCartButton productId={product.id} />
    </main>
  )
}
