'use client'

import React, { useState } from 'react'
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
})
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [priceCents, setPriceCents] = useState(0)
  const [stock, setStock] = useState(0)
  const [description, setDescription] = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = ProductSchema.safeParse({ name, sku, priceCents: Number(priceCents), stock: Number(stock), description })
    if (!parsed.success) {
      alert('Please fill out all required fields with valid values.')
      return
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    if (res.ok) router.push('/admin/products')
    else alert('Create failed')
  }

  return (
    <main>
      <h1>New Product</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          SKU
          <input value={sku} onChange={(e) => setSku(e.target.value)} required />
        </label>
        <label>
          Price (cents)
          <input type="number" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} required />
        </label>
        <label>
          Stock
          <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit">Create</button>
      </form>
    </main>
  )
}
