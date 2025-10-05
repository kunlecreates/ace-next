import { NextResponse } from 'next/server'
import { unauthorized, badRequest, notFound } from '@/lib/http'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) return badRequest('Invalid id')
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      items: {
        select: { qty: true, priceCents: true, product: { select: { name: true, sku: true } } },
      },
      tx: true,
    },
  })
  if (!order) return notFound()
  const res = NextResponse.json({ order })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
