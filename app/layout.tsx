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
import { LogIn } from 'lucide-react'
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
  <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-primary/15 via-accent/10 to-transparent backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link href="/" className="mr-2 inline-flex items-center gap-2 rounded-md px-2 py-1 text-base font-semibold">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
              Acegrocer
            </Link>
            <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">Home</Link>
            <Link href="/products" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">Catalog</Link>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            <CartBadge />
            {isAdmin ? (
              <>
                <Link href="/admin/products" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">Admin</Link>
                <Link href="/admin/orders" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">Admin Orders</Link>
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
                <Link href="/login" className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary">
                  <LogIn className="h-5 w-5 text-accent" />
                  Sign in
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary">Register</Link>
              </>
            )}
            {user ? (
              <Link href="/orders" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">Orders</Link>
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
