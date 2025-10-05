'use client'

import React from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
})

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = RegisterSchema.safeParse({ email, name, password })
    if (!parsed.success) {
      setError('Please provide a valid email, name, and password (8+ chars).')
      return
    }
    setError(null)
    setOk(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    if (res.ok) {
      setOk('Account created. Redirecting to sign-in...')
      setTimeout(() => router.push('/login'), 800)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Registration failed')
    }
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {ok ? <p style={{ color: 'green' }}>{ok}</p> : null}
        <button type="submit">Create account</button>
      </form>
    </main>
  )
}
