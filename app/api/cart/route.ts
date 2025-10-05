import { NextResponse } from 'next/server'
import { badRequest, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  })
  const res = NextResponse.json({ items })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function POST(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const BodySchema = z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(100) })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }
  const { productId, qty } = parsed.data
  // Increment existing quantity if item exists, otherwise create
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })
  const item = existing
    ? await prisma.cartItem.update({
        where: { userId_productId: { userId: user.id, productId } },
        data: { qty: { increment: qty } },
      })
    : await prisma.cartItem.create({
        data: { userId: user.id, productId, qty },
      })
  const res = NextResponse.json({ item })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function DELETE(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const BodySchema = z.object({ productId: z.number().int().positive() })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }
  const { productId } = parsed.data
  await prisma.cartItem.delete({ where: { userId_productId: { userId: user.id, productId } } })
  const res = NextResponse.json({ ok: true })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function PATCH(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()
  const BodySchema = z.object({ productId: z.number().int().positive(), qty: z.number().int().max(100) })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }
  const { productId, qty } = parsed.data

  if (qty <= 0) {
    // Treat zero or negative as removal
    await prisma.cartItem.delete({ where: { userId_productId: { userId: user.id, productId } } }).catch(() => {})
    const res = NextResponse.json({ ok: true, removed: true })
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { qty },
    create: { userId: user.id, productId, qty },
  })
  const res = NextResponse.json({ item })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
