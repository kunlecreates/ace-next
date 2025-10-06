import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getUserFromCookies } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getUserFromCookies()
  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }
  const sp = await searchParams
  const activeStatus = typeof sp?.status === 'string' ? sp.status : ''
  const activeEmail = typeof sp?.email === 'string' ? sp.email : ''
  const from = typeof sp?.from === 'string' ? sp.from : ''
  const to = typeof sp?.to === 'string' ? sp.to : ''
  const sort = typeof sp?.sort === 'string' ? sp.sort : ''
  const order = typeof sp?.order === 'string' ? sp.order : ''
  const page = typeof sp?.page === 'string' ? sp.page : '1'
  const pageSize = typeof sp?.pageSize === 'string' ? sp.pageSize : '20'
  const qs = new URLSearchParams()
  if (activeStatus) qs.set('status', activeStatus)
  if (activeEmail) qs.set('email', activeEmail)
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  if (sort) qs.set('sort', sort)
  if (order) qs.set('order', order)
  if (page) qs.set('page', page)
  if (pageSize) qs.set('pageSize', pageSize)

  // Build Prisma query based on filters
  type FindManyArgs = Parameters<typeof prisma.order.findMany>[0]
  const where: NonNullable<FindManyArgs>['where'] = {}
  if (activeStatus) {
    where.status = activeStatus
  }
  if (activeEmail) {
    const u = await prisma.user.findUnique({ where: { email: activeEmail }, select: { id: true } })
    if (!u) {
      return (
        <main>
          <h1>Admin: Orders</h1>
          <p>No orders.</p>
        </main>
      )
    }
    where.userId = u.id
  }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  const sortField = (sort || 'createdAt') as 'createdAt' | 'totalCents' | 'status' | 'userEmail'
  const sortOrder = (order || 'desc') as 'asc' | 'desc'
  let orderBy: NonNullable<FindManyArgs>['orderBy'] = { createdAt: sortOrder }
  if (sortField === 'totalCents') orderBy = { totalCents: sortOrder }
  else if (sortField === 'status') orderBy = { status: sortOrder }
  else if (sortField === 'userEmail') orderBy = { user: { email: sortOrder } } as any

  const currentPage = Number(page || '1')
  const currentPageSize = Number(pageSize || '20')
  const skip = (currentPage - 1) * currentPageSize
  const take = currentPageSize

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        status: true,
        totalCents: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / currentPageSize))

  const badge = (status: string) => {
    const map: Record<string, { bg: string; fg: string }> = {
      PENDING: { bg: '#fff7ed', fg: '#c2410c' },
      PAID: { bg: '#ecfeff', fg: '#0369a1' },
      SHIPPED: { bg: '#eff6ff', fg: '#1d4ed8' },
      DELIVERED: { bg: '#ecfdf5', fg: '#065f46' },
      CANCELED: { bg: '#fef2f2', fg: '#991b1b' },
    }
    const { bg, fg } = map[status] ?? { bg: '#eee', fg: '#333' }
    return <span data-testid="order-status-badge" style={{ background: bg, color: fg, padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>{status}</span>
  }

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold">Admin: Orders</h1>
      <section className="mt-3 flex flex-wrap items-center gap-2">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label>
            Status
            <select name="status" defaultValue={activeStatus} className="ml-1 rounded-md border px-2 py-1 text-sm">
              <option value="">All</option>
              {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Email
            <input type="text" name="email" defaultValue={activeEmail} placeholder="user@example.com" className="ml-1 w-56 rounded-md border px-2 py-1 text-sm" />
          </label>
          <label>
            From
            <input type="datetime-local" name="from" defaultValue={from} className="ml-1 rounded-md border px-2 py-1 text-sm" />
          </label>
          <label>
            To
            <input type="datetime-local" name="to" defaultValue={to} className="ml-1 rounded-md border px-2 py-1 text-sm" />
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={sort} className="ml-1 rounded-md border px-2 py-1 text-sm">
              <option value="">createdAt</option>
              <option value="totalCents">totalCents</option>
              <option value="status">status</option>
              <option value="userEmail">userEmail</option>
            </select>
          </label>
          <label>
            Order
            <select name="order" defaultValue={order || 'desc'} className="ml-1 rounded-md border px-2 py-1 text-sm">
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>
          </label>
          <label>
            Page
            <input type="number" name="page" defaultValue={page} min={1} className="ml-1 w-20 rounded-md border px-2 py-1 text-sm" />
          </label>
          <label>
            Page Size
            <input type="number" name="pageSize" defaultValue={pageSize} min={1} max={100} className="ml-1 w-24 rounded-md border px-2 py-1 text-sm" />
          </label>
          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Apply</button>
          <a href="/admin/orders" className="ml-2 text-sm text-primary hover:underline">Reset</a>
        </form>
        {activeEmail ? (
          <span className="ml-2 text-xs text-muted-foreground">Filter email: {activeEmail}</span>
        ) : null}
      </section>

      {orders.length === 0 ? (
        <p>No orders.</p>
      ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2 text-left">ID</th>
              <th className="px-2 py-2 text-left">User</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Total</th>
              <th className="px-2 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} data-testid="order-row" data-order-id={o.id} data-user-email={o.user.email} className="border-b">
                <td className="px-2 py-2">{o.id}</td>
                <td className="px-2 py-2">{o.user.email}</td>
                <td className="px-2 py-2">{badge(o.status)}</td>
                <td className="px-2 py-2">${(o.totalCents / 100).toFixed(2)}</td>
                <td className="px-2 py-2">
                  <form action={async (formData: FormData) => {
                    'use server'
                    const status = formData.get('orderStatus') as string
                    const actingUser = await getUserFromCookies()
                    if (!actingUser || actingUser.role !== 'ADMIN') {
                      redirect('/login')
                    }
                    await prisma.order.update({
                      where: { id: o.id },
                      data: { status: status as any },
                    })
                    // Ensure the page reflects the latest data
                    revalidatePath('/admin/orders')
                    // Preserve active filters on reload
                    const filterStatus = formData.get('filterStatus') as string | null
                    const filterEmail = formData.get('filterEmail') as string | null
                    const filterFrom = formData.get('filterFrom') as string | null
                    const filterTo = formData.get('filterTo') as string | null
                    const filterSort = formData.get('filterSort') as string | null
                    const filterOrder = formData.get('filterOrder') as string | null
                    const filterPage = formData.get('filterPage') as string | null
                    const filterPageSize = formData.get('filterPageSize') as string | null
                    const qs = new URLSearchParams()
                    if (filterStatus) qs.set('status', filterStatus)
                    if (filterEmail) qs.set('email', filterEmail)
                    if (filterFrom) qs.set('from', filterFrom)
                    if (filterTo) qs.set('to', filterTo)
                    if (filterSort) qs.set('sort', filterSort)
                    if (filterOrder) qs.set('order', filterOrder)
                    if (filterPage) qs.set('page', filterPage)
                    if (filterPageSize) qs.set('pageSize', filterPageSize)
                    redirect('/admin/orders' + (qs.toString() ? `?${qs.toString()}` : ''))
                  }}>
                    <input type="hidden" name="filterStatus" value={activeStatus} />
                    <input type="hidden" name="filterEmail" value={activeEmail} />
                    <input type="hidden" name="filterFrom" value={from} />
                    <input type="hidden" name="filterTo" value={to} />
                    <input type="hidden" name="filterSort" value={sort} />
                    <input type="hidden" name="filterOrder" value={order || 'desc'} />
                    <input type="hidden" name="filterPage" value={page} />
                    <input type="hidden" name="filterPageSize" value={pageSize} />
                    <select name="orderStatus" data-testid="order-row-status" data-order-id={o.id} defaultValue={o.status} className="mr-2 rounded-md border px-2 py-1 text-sm">
                      {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button type="submit" data-testid="order-row-update" data-order-id={o.id} className="rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-3 flex items-center gap-2">
        <span>Page {currentPage} of {totalPages} ({total} total)</span>
        <div className="ml-auto">
          {currentPage > 1 ? (
            <a className="text-primary hover:underline" href={`/admin/orders?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(currentPage - 1) }).toString()}`}>Prev</a>
          ) : null}
          {currentPage < totalPages ? (
            <a className="ml-3 text-primary hover:underline" href={`/admin/orders?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(currentPage + 1) }).toString()}`}>Next</a>
          ) : null}
        </div>
      </div>
    </main>
  )
}
