import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { badRequest } from '@/lib/http'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }

  const { email, name, password } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, name, passwordHash } })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name })
}
