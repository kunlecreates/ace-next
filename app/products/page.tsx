import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { absoluteUrl } from '@/lib/url'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import QuickAddToCartButton from '@/components/QuickAddToCartButton'

export default async function ProductsPage() {
  const res = await fetch(await absoluteUrl('/api/products'), { cache: 'no-store' })
  const data = await res.json()
  const products = data.products as Array<{ id: number; name: string; priceCents: number; sku: string; stock: number; imageUrl?: string | null }>
  return (
    <main className="container mx-auto p-6 sm:p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <Card key={p.id} className="group overflow-hidden transition-colors hover:border-ring/40">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <SafeImage
                src={p.imageUrl ?? null}
                fallbackSrc={`https://picsum.photos/seed/ace-${p.id}/600/450`}
                alt={p.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
              />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <Link href={`/products/${p.id}`} className="truncate font-medium hover:underline">
                  {p.name}
                </Link>
                <Badge variant="secondary" className="shrink-0 tabular-nums text-foreground bg-secondary">
                  ${(p.priceCents / 100).toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 pt-0">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] text-muted-foreground">SKU {p.sku}</span>
                <span className="text-[11px] text-muted-foreground">Stock: {p.stock}</span>
              </div>
              <QuickAddToCartButton productId={p.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
