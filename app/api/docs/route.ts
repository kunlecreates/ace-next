import { NextResponse } from 'next/server'
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import {
  LoginSchema,
  RegisterSchema,
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductsQuerySchema,
  AdminOrderPatchSchema,
  MePatchSchema,
  AdminOrdersQuerySchema,
  CartPostSchema,
  CartPatchSchema,
  CartDeleteSchema,
  CheckoutSchema,
} from '@/lib/schemas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const registry = new OpenAPIRegistry()

  registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    request: { body: { content: { 'application/json': { schema: LoginSchema } } } },
    responses: { 200: { description: 'Login success' }, 400: { description: 'Invalid payload' } },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    request: { body: { content: { 'application/json': { schema: RegisterSchema } } } },
    responses: { 200: { description: 'Register success' }, 400: { description: 'Invalid payload' } },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/products',
    request: { query: ProductsQuerySchema },
    responses: { 200: { description: 'List products' }, 400: { description: 'Invalid query' } },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/products',
    request: { body: { content: { 'application/json': { schema: ProductCreateSchema } } } },
    responses: { 200: { description: 'Created' }, 400: { description: 'Invalid payload' }, 403: { description: 'Forbidden' } },
  })
  registry.registerPath({
    method: 'patch',
    path: '/api/products/{id}',
    request: { body: { content: { 'application/json': { schema: ProductUpdateSchema } } } },
    responses: { 200: { description: 'Updated' }, 400: { description: 'Invalid payload' }, 403: { description: 'Forbidden' } },
  })
  registry.registerPath({
    method: 'patch',
    path: '/api/admin/orders',
    request: { body: { content: { 'application/json': { schema: AdminOrderPatchSchema } } } },
    responses: { 200: { description: 'Updated' }, 400: { description: 'Invalid payload' }, 403: { description: 'Forbidden' } },
  })

  // Me
  registry.registerPath({
    method: 'patch',
    path: '/api/me',
    request: { body: { content: { 'application/json': { schema: MePatchSchema } } } },
    responses: { 200: { description: 'Updated' }, 400: { description: 'Invalid payload' }, 401: { description: 'Unauthorized' } },
  })

  // Cart
  registry.registerPath({
    method: 'get',
    path: '/api/cart',
    responses: { 200: { description: 'Get cart' }, 401: { description: 'Unauthorized' } },
  })
  registry.registerPath({
    method: 'post',
    path: '/api/cart',
    request: { body: { content: { 'application/json': { schema: CartPostSchema } } } },
    responses: { 200: { description: 'Added' }, 400: { description: 'Invalid payload' }, 401: { description: 'Unauthorized' } },
  })
  registry.registerPath({
    method: 'patch',
    path: '/api/cart',
    request: { body: { content: { 'application/json': { schema: CartPatchSchema } } } },
    responses: { 200: { description: 'Updated' }, 400: { description: 'Invalid payload' }, 401: { description: 'Unauthorized' } },
  })
  registry.registerPath({
    method: 'delete',
    path: '/api/cart',
    request: { body: { content: { 'application/json': { schema: CartDeleteSchema } } } },
    responses: { 200: { description: 'Deleted' }, 400: { description: 'Invalid payload' }, 401: { description: 'Unauthorized' } },
  })
  registry.registerPath({
    method: 'get',
    path: '/api/cart/count',
    responses: { 200: { description: 'Count' } },
  })

  // Checkout
  registry.registerPath({
    method: 'post',
    path: '/api/checkout',
    request: { body: { content: { 'application/json': { schema: CheckoutSchema } } } },
    responses: { 303: { description: 'Redirect to cart' }, 401: { description: 'Unauthorized' }, 400: { description: 'Invalid payload' } },
  })

  // Admin orders GET
  registry.registerPath({
    method: 'get',
    path: '/api/admin/orders',
    request: { query: AdminOrdersQuerySchema },
    responses: { 200: { description: 'List admin orders' }, 400: { description: 'Invalid query' }, 403: { description: 'Forbidden' } },
  })

  const generator = new OpenApiGeneratorV31(registry.definitions)
  const doc = generator.generateDocument({
    openapi: '3.1.0',
    info: { title: 'Acegrocer API (dev)', version: '0.1.0' },
    servers: [{ url: 'http://localhost:3000' }],
  })

  return NextResponse.json(doc)
}
