import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getUserFromCookies } from '@/lib/session'
import LogoutButton from '@/components/LogoutButton'
import CartBadge from '@/components/CartBadge'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Acegrocer',
  description: 'Acegrocer - Next.js + TypeScript starter',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUserFromCookies()
  const isAdmin = user?.role === 'ADMIN'
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/">Home</Link>
            <Link href="/products">Products</Link>
            <CartBadge />
            {isAdmin ? (
              <>
                <Link href="/admin/products">Admin</Link>
                <Link href="/admin/orders">Admin Orders</Link>
              </>
            ) : null}
            <span style={{ marginLeft: 'auto' }} />
            {user ? (
              <span style={{ fontSize: 12, color: '#555' }}>
                {user.email ?? 'user'} · {user.role}
              </span>
            ) : null}
            {user ? (
              <LogoutButton />
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link href="/register">Register</Link>
              </>
            )}
            {user ? <Link href="/orders">My Orders</Link> : null}
          </nav>
        </header>
        <div style={{ padding: 16 }}>{children}</div>
      </body>
    </html>
  )
}
