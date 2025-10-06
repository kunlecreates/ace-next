import { NextResponse } from 'next/server'
import { badRequest, forbidden, notFound } from '@/lib/http'
import { prisma } from '@/lib/db'
import { getUserFromCookie } from '@/lib/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user || user.role !== 'ADMIN') {
    return forbidden()
  }
  const url = new URL(req.url)
  const StatusSchema = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'])
  const SortField = z.enum(['createdAt', 'totalCents', 'status', 'userEmail'])
  const QuerySchema = z.object({
    status: StatusSchema.optional(),
    email: z.string().trim().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    sort: SortField.optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  const query = QuerySchema.safeParse({
    status: url.searchParams.get('status') || undefined,
    email: url.searchParams.get('email') || undefined,
    from: url.searchParams.get('from') || undefined,
    to: url.searchParams.get('to') || undefined,
    sort: url.searchParams.get('sort') || undefined,
    order: url.searchParams.get('order') || undefined,
    page: url.searchParams.get('page') || undefined,
    pageSize: url.searchParams.get('pageSize') || undefined,
  })
  if (!query.success) {
    return badRequest('Invalid query', query.error.flatten())
  }

  const where: Record<string, any> = {}
  if (query.data.status) {
    where.status = query.data.status
  }
  // If filtering by email, resolve to userId to avoid relational filter pitfalls
  if (query.data.email) {
    const u = await prisma.user.findUnique({ where: { email: query.data.email }, select: { id: true } })
    if (!u) {
      const res = NextResponse.json({ orders: [], page: query.data.page ?? 1, pageSize: query.data.pageSize ?? 20, total: 0 })
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    where.userId = u.id
  }
  if (query.data.from || query.data.to) {
    where.createdAt = {
      ...(query.data.from ? { gte: new Date(query.data.from) } : {}),
      ...(query.data.to ? { lte: new Date(query.data.to) } : {}),
    }
  }

  // Sorting
  const sortField = query.data.sort || 'createdAt'
  const sortOrder = (query.data.order || 'desc') as 'asc' | 'desc'
  let orderBy: Record<string, any> = { createdAt: sortOrder }
  if (sortField === 'totalCents') orderBy = { totalCents: sortOrder }
  else if (sortField === 'status') orderBy = { status: sortOrder }
  else if (sortField === 'userEmail') orderBy = { user: { email: sortOrder } }

  // Pagination
  const page = query.data.page ?? 1
  const pageSize = query.data.pageSize ?? 20
  const skip = (page - 1) * pageSize
  const take = pageSize

  const total = await prisma.order.count({ where })

  const orders = await prisma.order.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      user: { select: { email: true } },
      items: { select: { qty: true, priceCents: true } },
    },
  })
  const res = NextResponse.json({ orders, page, pageSize, total })
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function PATCH(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user || user.role !== 'ADMIN') {
    return forbidden()
  }
  const StatusSchema = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'])
  const BodySchema = z.object({ id: z.number().int().positive(), status: StatusSchema })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parse = BodySchema.safeParse(body)
  if (!parse.success) {
    return badRequest('Invalid payload', parse.error.flatten())
  }

  const { id, status } = parse.data

  // Ensure the order exists to provide a clean 404 instead of a generic error
  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) {
    const res404 = notFound('Order not found')
    res404.headers.set('Cache-Control', 'no-store')
    return res404
  }

  const updated = await prisma.order.update({ where: { id }, data: { status } })
  const res = NextResponse.json({ order: updated })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
