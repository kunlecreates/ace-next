import { NextResponse } from 'next/server'
type InitLike = number | { status?: number; headers?: Record<string, string> }
import type { ZodError } from 'zod'

type Json = Record<string, any>

export function ok<T extends Json>(data: T, init?: InitLike, options?: { noStore?: boolean }) {
  const res = NextResponse.json(data, typeof init === 'number' ? { status: init } : init)
  if (options?.noStore) res.headers.set('Cache-Control', 'no-store')
  return res
}

export function err(status: number, message: string, opts?: { code?: string; issues?: any; noStore?: boolean }) {
  const payload = { error: { message, ...(opts?.code ? { code: opts.code } : {}), ...(opts?.issues ? { issues: opts.issues } : {}) } }
  const res = NextResponse.json(payload, { status })
  if (opts?.noStore) res.headers.set('Cache-Control', 'no-store')
  return res
}

export function zodIssues(error: ZodError) {
  return error.flatten()
}

// Common shortcuts
export const unauthorized = (msg = 'Unauthorized') => err(401, msg)
export const forbidden = (msg = 'Forbidden') => err(403, msg)
export const badRequest = (msg = 'Bad Request', issues?: any) => err(400, msg, { issues })
export const notFound = (msg = 'Not Found') => err(404, msg)
export const tooMany = (msg = 'Too Many Requests') => err(429, msg)
