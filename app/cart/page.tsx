import { absoluteUrl } from '@/lib/url'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CartList from './CartList'

export const dynamic = 'force-dynamic'

type CartItem = { productId: number; qty: number; product: { name: string; priceCents: number } }

async function fetchCart(): Promise<CartItem[]> {
  const c = await cookies()
  const cookieHeader = c.toString()
  const res = await fetch(await absoluteUrl('/api/cart'), {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })
  if (res.status === 401) {
    // Not signed in – send to login
    return redirect('/login')
  }
  if (!res.ok) {
    throw new Error('Failed to load cart')
  }
  const data = await res.json()
  return (data.items ?? []) as CartItem[]
}

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const success = sp?.success === '1'
  const empty = sp?.empty === '1'
  const stockErr = sp?.error === 'stock'
  const stockName = typeof sp?.name === 'string' ? sp?.name : null
  const items = await fetchCart()
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Cart</h1>
      {success ? <p className="mt-2 text-sm text-green-600">Order placed successfully.</p> : null}
      {empty ? <p className="mt-2 text-sm text-red-600">Your cart is empty.</p> : null}
      {stockErr ? (
        <p className="mt-2 text-sm text-red-600">
          Not enough stock{stockName ? ` for ${stockName}` : ''}. Please adjust quantities.
        </p>
      ) : null}
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <CartList initialItems={items} />
          <form method="post" action="/api/checkout" className="mt-4">
            <Button type="submit">Checkout (mock)</Button>
          </form>
        </>
      )}
    </main>
  )
}

