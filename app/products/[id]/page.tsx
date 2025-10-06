import { absoluteUrl } from '@/lib/url'
import SafeImage from '@/components/SafeImage'
import { AddToCartButton } from './AddToCartButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(await absoluteUrl(`/api/products/${id}`), { cache: 'no-store' })
  const data = await res.json()
  const product = data.product as { id: number; name: string; description?: string | null; priceCents: number; sku: string; stock: number; imageUrl?: string | null }
  if (!product) return <div>Not found</div>
  return (
    <main className="container mx-auto p-6">
      <Card className="max-w-2xl overflow-hidden">
        <div className="relative h-56 w-full sm:h-72">
          <SafeImage
            src={product.imageUrl ?? null}
            fallbackSrc={`https://picsum.photos/seed/ace-${product.id}/900/600`}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 576px, 100vw"
          />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {product.name}
            <Badge variant="secondary">SKU {product.sku}</Badge>
          </CardTitle>
          <CardDescription>
            <span className="text-base font-medium">${(product.priceCents / 100).toFixed(2)}</span>
            <span className="ml-3 text-xs text-muted-foreground">Stock: {product.stock}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description ? <p className="text-sm text-muted-foreground">{product.description}</p> : null}
          <AddToCartButton productId={product.id} />
        </CardContent>
      </Card>
    </main>
  )
}
