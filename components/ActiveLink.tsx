'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  children: ReactNode
  className?: string
  onPrimary?: boolean // when placed on a colored header (e.g., bg-primary)
}

export default function ActiveLink({ href, children, className, onPrimary }: Props) {
  const pathname = usePathname()
  const isActive = (() => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  })()

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
        onPrimary
          ? 'text-primary-foreground hover:bg-white/10'
          : 'text-foreground hover:bg-muted',
        isActive && (onPrimary ? 'bg-white/20 font-semibold' : 'bg-primary/10 text-primary font-semibold'),
        className,
      )}
    >
      {children}
    </Link>
  )
}
