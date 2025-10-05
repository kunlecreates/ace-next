import { headers } from 'next/headers'

export async function getBaseUrl(): Promise<string> {
  // In the browser, relative URLs are fine
  if (typeof window !== 'undefined') return ''

  // On the server, derive from headers (works in Vercel/Proxies) or fallback to env/localhost
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
}

export async function absoluteUrl(path: string): Promise<string> {
  const base = await getBaseUrl()
  return `${base}${path}`
}
