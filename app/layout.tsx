import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getUserFromCookies } from '@/lib/session'
import LogoutButton from '@/components/LogoutButton'
import CartBadge from '@/components/CartBadge'
import ThemeProvider from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'
import { AppToaster } from '@/components/ui/toaster'
import { Home, Package, LogIn, ListOrdered } from 'lucide-react'
import ActiveLink from '@/components/ActiveLink'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Acegrocer',
  description: 'Acegrocer - Next.js + TypeScript starter',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUserFromCookies()
  const isAdmin = user?.role === 'ADMIN'
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider>
  <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 sm:gap-3">
            <ActiveLink href="/">
              <Home className="h-5 w-5" />
              Home
            </ActiveLink>
            <ActiveLink href="/products">
              <ListOrdered className="h-5 w-5" />
              Catalog
            </ActiveLink>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            <CartBadge />
            {isAdmin ? (
              <>
                <ActiveLink href="/admin/products" className="">Admin</ActiveLink>
                <ActiveLink href="/admin/orders" className="">Admin Orders</ActiveLink>
              </>
            ) : null}
            <span className="ml-auto" />
            {user ? (
              <span className="text-xs text-muted-foreground">
                {user.email ?? 'user'} · {user.role}
              </span>
            ) : null}
            {user ? (
              <LogoutButton />
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">
                  <LogIn className="h-5 w-5" />
                  Sign in
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">Register</Link>
              </>
            )}
            {user ? (
              <ActiveLink href="/orders">
                <Package className="h-5 w-5" />
                Orders
              </ActiveLink>
            ) : null}
            <ThemeToggle />
          </nav>
          </div>
        </header>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
  <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
