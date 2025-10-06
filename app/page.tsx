import Link from 'next/link'
export default function HomePage() {
  return (
    <main className="container mx-auto p-6 sm:p-8">
  <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/20 via-accent/15 to-secondary p-8 sm:p-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight">Fresh groceries, delivered fast</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Browse our curated catalog and stock up on everyday essentials, from fruit to dairy and bakery.
          </p>
          <div className="mt-6">
            <Link href="/products" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
              Shop the catalog
            </Link>
          </div>
        </div>
  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/25 blur-3xl" />
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Always fresh</h3>
          <p className="mt-1 text-sm text-muted-foreground">We keep stock levels accurate and rotate inventory often.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Fast checkout</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add to cart from product pages and check out in a snap.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Track orders</h3>
          <p className="mt-1 text-sm text-muted-foreground">Follow your order status end-to-end from your account.</p>
        </div>
      </section>
    </main>
  )
}
