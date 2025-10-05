import { NextResponse } from 'next/server'
import { tooMany } from '@/lib/http'
import { recordRequest, recordResponse } from '@/lib/metrics'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limits for selected endpoints (configurable via env)
const LIMIT = Number(process.env.RATE_LIMIT_DEFAULT_LIMIT ?? 30)
const WINDOW = Number(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS ?? 60_000)
const RATE_LIMITS = [
  { path: '/api/auth/login', method: 'POST', limit: Number(process.env.RATE_LIMIT_LOGIN_LIMIT ?? LIMIT), windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS ?? WINDOW) },
  { path: '/api/checkout', method: 'POST', limit: Number(process.env.RATE_LIMIT_CHECKOUT_LIMIT ?? LIMIT), windowMs: Number(process.env.RATE_LIMIT_CHECKOUT_WINDOW_MS ?? WINDOW) },
  { path: '/api/admin/orders', method: 'PATCH', limit: Number(process.env.RATE_LIMIT_ADMIN_ORDERS_LIMIT ?? LIMIT), windowMs: Number(process.env.RATE_LIMIT_ADMIN_ORDERS_WINDOW_MS ?? WINDOW) },
] as const

const buckets = new Map<string, { count: number; resetAt: number }>()

function clientKey(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function matchRule(req: NextRequest) {
  const { pathname } = new URL(req.url)
  const method = req.method.toUpperCase()
  return RATE_LIMITS.find((r) => pathname.startsWith(r.path) && method === r.method)
}

export function middleware(req: NextRequest) {
  const start = Date.now()
  const url = new URL(req.url)
  const routeLabel = `${req.method} ${url.pathname}`
  recordRequest(routeLabel)
  const res = NextResponse.next()

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=()')
  // Basic CSP: adjust as needed; loosened in dev for inline and eval
  const isProd = process.env.NODE_ENV === 'production'
  const csp = [
    "default-src 'self'",
    isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
  ].join('; ')
  res.headers.set('Content-Security-Policy', csp)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // Request id + basic logging
  const rid = Math.random().toString(36).slice(2, 10)
  res.headers.set('x-request-id', rid)
  // eslint-disable-next-line no-console
  console.log(`[${rid}] ${req.method} ${url.pathname}`)

  // Rate limit selected endpoints (opt-in via RATE_LIMIT_ENABLED)
  if (process.env.RATE_LIMIT_ENABLED === 'true') {
    const rule = matchRule(req)
    if (rule) {
      const key = `${clientKey(req)}:${rule.method}:${rule.path}`
      const now = Date.now()
      const entry = buckets.get(key)
      if (!entry || now > entry.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + rule.windowMs })
        res.headers.set('RateLimit-Limit', String(rule.limit))
        res.headers.set('RateLimit-Remaining', String(rule.limit - 1))
      } else {
        if (entry.count >= rule.limit) {
          const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
          const limitRes = tooMany()
          limitRes.headers.set('RateLimit-Limit', String(rule.limit))
          limitRes.headers.set('RateLimit-Remaining', '0')
          limitRes.headers.set('Retry-After', String(retryAfter))
          limitRes.headers.set('x-request-id', rid)
          return limitRes
        }
        entry.count += 1
        res.headers.set('RateLimit-Limit', String(rule.limit))
        res.headers.set('RateLimit-Remaining', String(rule.limit - entry.count))
      }
    }
  }

  const dur = Date.now() - start
  const status = res.status || 200
  recordResponse(status, dur, routeLabel)
  // eslint-disable-next-line no-console
  console.log(`[${rid}] completed ${status} in ${dur}ms`)
  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/cart/:path*',
    '/products/:path*',
    '/orders/:path*',
  ],
}
