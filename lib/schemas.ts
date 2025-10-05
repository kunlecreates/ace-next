import { z } from 'zod'

// Auth
export const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
export const RegisterSchema = z.object({ email: z.string().email(), name: z.string().min(1), password: z.string().min(8) })

// Me
export const MePatchSchema = z
  .object({ name: z.string().trim().min(1).optional() })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

// Products
export const ProductCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(2000).optional().nullable(),
  priceCents: z.number().int().nonnegative(),
  sku: z.string().min(1),
  category: z.string().min(1).optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
})

export const ProductUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().max(2000).optional().nullable(),
    priceCents: z.number().int().nonnegative().optional(),
    sku: z.string().min(1).optional(),
    category: z.string().min(1).optional().nullable(),
    stock: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

export const ProductsQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((q) => (q.minPrice !== undefined && q.maxPrice !== undefined ? q.minPrice <= q.maxPrice : true), {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  })

// Admin Orders
export const AdminOrderStatus = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'])
export const AdminOrderPatchSchema = z.object({ id: z.number().int().positive(), status: AdminOrderStatus })

export const AdminOrdersQuerySchema = z.object({
  status: AdminOrderStatus.optional(),
  email: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(['createdAt', 'totalCents', 'status', 'userEmail']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
})

// Cart
export const CartPostSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().min(1).max(100),
})

export const CartPatchSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().max(100),
})

export const CartDeleteSchema = z.object({
  productId: z.number().int().positive(),
})

// Checkout (accepts empty body for now)
export const CheckoutSchema = z.object({}).passthrough()
