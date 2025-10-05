import { NextResponse } from 'next/server'

const COOKIE_NAME = process.env.COOKIE_NAME ?? 'acegrocer_auth'

export async function POST(req: Request) {
  // Redirect to home after clearing the cookie so the app UI updates immediately
  const res = NextResponse.redirect(new URL('/', req.url), 303)
  res.headers.set('Cache-Control', 'no-store')
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, expires: new Date(0), path: '/' })
  return res
}
