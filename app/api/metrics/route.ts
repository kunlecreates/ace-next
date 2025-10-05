import { NextResponse } from 'next/server'
import { getMetrics } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // Dev-only endpoint; you can gate behind NODE_ENV if desired
  return NextResponse.json({ metrics: getMetrics() })
}
