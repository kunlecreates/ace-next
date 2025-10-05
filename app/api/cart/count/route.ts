import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return NextResponse.json({ count: 0 })
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    select: { qty: true },
  })
  const count = items.reduce((sum: number, it: { qty: number }) => sum + it.qty, 0)
  return NextResponse.json({ count })
}
