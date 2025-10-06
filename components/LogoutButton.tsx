'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
  await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' })
      router.replace('/')
      router.refresh()
    } catch (e) {
      // noop — optional toast here
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15 disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Logout'}
    </button>
  )
}
