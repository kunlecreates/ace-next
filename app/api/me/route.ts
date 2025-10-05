import { NextResponse } from 'next/server'
import { badRequest, unauthorized } from '@/lib/http'
import { getUserFromCookie } from '@/lib/session'
import { prisma } from '@/lib/db'
import { MePatchSchema } from '@/lib/schemas'

export async function GET(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return NextResponse.json({ user: null })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, name: true, role: true } })
  return NextResponse.json({ user: dbUser })
}

export async function PATCH(req: Request) {
  const user = await getUserFromCookie(req)
  if (!user) return unauthorized()

  const BodySchema = MePatchSchema
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
  const { name } = parsed.data
  const updated = await prisma.user.update({ where: { id: user.id }, data: { name: name ?? undefined } })
  return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role })
}
