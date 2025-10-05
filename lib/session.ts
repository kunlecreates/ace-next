import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const COOKIE_NAME = process.env.COOKIE_NAME ?? 'acegrocer_auth'
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

type TokenPayload = { sub: number; role: 'CUSTOMER' | 'ADMIN'; email?: string }

export async function getUserFromCookie(req: Request): Promise<{ id: number; role: 'CUSTOMER' | 'ADMIN'; email?: string } | null> {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null
  const cookies = Object.fromEntries(cookieHeader.split(';').map((c) => {
    const [k, ...rest] = c.trim().split('=')
    return [decodeURIComponent(k), decodeURIComponent(rest.join('='))]
  })) as Record<string, string>

  const token = cookies[COOKIE_NAME]
  if (!token) return null
  try {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & TokenPayload
  return { id: Number(decoded.sub), role: decoded.role, email: decoded.email }
  } catch {
    return null
  }
}

export function requireAdmin(user: { role: 'CUSTOMER' | 'ADMIN' } | null) {
  if (!user || user.role !== 'ADMIN') {
    // Throwing bubbles a 500; let callers decide the HTTP response.
    throw new Error('Forbidden')
  }
}

export async function getUserFromCookies(): Promise<{ id: number; role: 'CUSTOMER' | 'ADMIN'; email?: string } | null> {
  try {
    const c = await cookies()
    const token = c.get(COOKIE_NAME)?.value
    if (!token) return null
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & TokenPayload
    return { id: Number(decoded.sub), role: decoded.role, email: decoded.email }
  } catch {
    return null
  }
}
