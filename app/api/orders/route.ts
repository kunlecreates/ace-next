import { NextResponse } from 'next/server'
import { unauthorized } from '@/lib/http'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      items: {
        select: { qty: true, priceCents: true, product: { select: { name: true } } },
      },
    },
  })
  const res = NextResponse.json({ orders })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
