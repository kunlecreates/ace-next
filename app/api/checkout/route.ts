import { NextResponse } from 'next/server'
import { badRequest, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'
import { z } from 'zod'
// Using any for tx typing due to missing Prisma TransactionClient type in generated d.ts

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()

  // If/when we add fields (coupon, addressRef, etc.), validate here.
  const CheckoutSchema = z.object({}).passthrough()
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Invalid payload', parsed.error.flatten())
    }
  } catch {
    // Non-JSON body is fine since we accept empty body; treat as empty
  }

  const cartItems = await prisma.cartItem.findMany({ where: { userId: user.id }, include: { product: true } })
  if (cartItems.length === 0) {
    const url = new URL('/cart?empty=1', req.url)
    const res = NextResponse.redirect(url, 303)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  // Validate stock
  for (const it of cartItems) {
    if (it.qty > it.product.stock) {
      const url = new URL('/cart?error=stock', req.url)
      url.searchParams.set('pid', String(it.productId))
      url.searchParams.set('name', it.product.name)
      const res = NextResponse.redirect(url, 303)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
  }

  const totalCents = cartItems.reduce((sum: number, it: { qty: number; product: { priceCents: number } }) => sum + it.qty * it.product.priceCents, 0)

  const order = await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.create({ data: { userId: user.id, totalCents, status: 'PENDING' } })
    for (const it of cartItems) {
      await tx.orderItem.create({ data: { orderId: order.id, productId: it.productId, qty: it.qty, priceCents: it.product.priceCents } })
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } })
    }
    await tx.cartItem.deleteMany({ where: { userId: user.id } })
    // Mock payment
    await tx.transaction.create({ data: { orderId: order.id, amountCents: totalCents, status: 'AUTHORIZED', provider: 'MOCK' } })
    await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } })
    return order
  })

  // Redirect back to cart so the user sees an immediate confirmation
  const url = new URL('/cart?success=1&orderId=' + order.id, req.url)
  const res = NextResponse.redirect(url, 303)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
