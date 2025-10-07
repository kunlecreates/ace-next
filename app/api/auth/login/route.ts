import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { badRequest } from '@/lib/http'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = process.env.COOKIE_NAME ?? 'acegrocer_auth'
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

export async function POST(req: Request) {
  const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Invalid payload', parsed.error.flatten())
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' })

  const res = NextResponse.json({ id: user.id, email: user.email, role: user.role })
  // Hint to refresh cached routes in app router after auth state change
  res.headers.set('Cache-Control', 'no-store')
  // Only mark cookie as Secure when using HTTPS. In tests/local HTTP, avoid Secure so the browser sends it.
  const isHttps = (() => {
    try { return new URL(req.url).protocol === 'https:' } catch { return false }
  })()
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    // Use Secure cookies only on HTTPS. Allow override via COOKIE_SECURE if explicitly set to 'true'.
    secure: process.env.COOKIE_SECURE === 'true' ? true : isHttps,
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return res
}
