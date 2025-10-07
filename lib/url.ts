import { headers } from 'next/headers'

export async function getBaseUrl(): Promise<string> {
  // In the browser, relative URLs are fine
  if (typeof window !== 'undefined') return ''

  // On the server, derive from headers (works in Vercel/Proxies) or fallback to env/localhost
  try {
    const h = await headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) return `${proto}://${host}`
  } catch {
    // headers() may throw outside of a request context; ignore
  }
  // Prefer explicit base URL in env (useful for Playwright via PLAYWRIGHT_BASE_URL)
  const envBase = process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (envBase) return envBase
  // Fallback to Next.js dev/prod defaults
  return 'http://localhost:3005'
}

export async function absoluteUrl(path: string): Promise<string> {
  const base = await getBaseUrl()
  return `${base}${path}`
}
