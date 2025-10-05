import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromCookie, requireAdmin } from '@/lib/session'
import { badRequest, forbidden } from '@/lib/http'
import { z } from 'zod'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const QuerySchema = z
    .object({
      search: z.string().trim().min(1).optional(),
      category: z.string().trim().min(1).optional(),
      minPrice: z.coerce.number().int().nonnegative().optional(),
      maxPrice: z.coerce.number().int().nonnegative().optional(),
    })
    .refine((q) => (q.minPrice !== undefined && q.maxPrice !== undefined ? q.minPrice <= q.maxPrice : true), {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    })
  const parsed = QuerySchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    minPrice: url.searchParams.get('minPrice') ?? undefined,
    maxPrice: url.searchParams.get('maxPrice') ?? undefined,
  })
  if (!parsed.success) {
    return badRequest('Invalid query', parsed.error.flatten())
  }
  const { search, category, minPrice, maxPrice } = parsed.data
  type FindManyArgs = Parameters<typeof prisma.product.findMany>[0]
  const where: NonNullable<FindManyArgs>['where'] = {}
  if (search) where.OR = [
    { name: { contains: search } },
    { description: { contains: search } },
  ]
  if (category) where.category = category
  if (minPrice || maxPrice) {
    where.priceCents = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    } as NonNullable<NonNullable<FindManyArgs>['where']>['priceCents']
  }

  const products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  const user = await getUserFromCookie(req)
  try { requireAdmin(user) } catch { return forbidden() }

  const CreateSchema = z.object({
    name: z.string().min(1),
    description: z.string().max(2000).optional().nullable(),
    priceCents: z.number().int().nonnegative(),
    sku: z.string().min(1),
    category: z.string().min(1).optional().nullable(),
    stock: z.number().int().nonnegative().optional(),
  })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }

  const { name, description, priceCents, sku, category, stock } = parsed.data

  const product = await prisma.product.create({ data: { name, description: description ?? null, priceCents, sku, category: category ?? null, stock: stock ?? 0 } })
  return NextResponse.json({ product })
}
