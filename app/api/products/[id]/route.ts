import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromCookie, requireAdmin } from '@/lib/session'
import { badRequest, forbidden, notFound } from '@/lib/http'
import { z } from 'zod'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isFinite(id) || id <= 0) {
    return badRequest('Invalid id')
  }
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return notFound()
  return NextResponse.json({ product })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookie(req)
  try { requireAdmin(user) } catch { return forbidden() }

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isFinite(id) || id <= 0) {
    return badRequest('Invalid id')
  }
  const UpdateSchema = z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().max(2000).optional().nullable(),
      priceCents: z.number().int().nonnegative().optional(),
      sku: z.string().min(1).optional(),
      category: z.string().min(1).optional().nullable(),
      stock: z.number().int().nonnegative().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }
  const data = parsed.data
  const product = await prisma.product.update({ where: { id }, data })
  return NextResponse.json({ product })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookie(req)
  try { requireAdmin(user) } catch { return forbidden() }

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isFinite(id) || id <= 0) {
    return badRequest('Invalid id')
  }
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
