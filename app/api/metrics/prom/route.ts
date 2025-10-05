import { NextResponse } from 'next/server'
import { getMetrics } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function toPrometheus() {
  const m = getMetrics()
  const lines = [
    '# HELP ace_requests_total Total number of requests',
    '# TYPE ace_requests_total counter',
    `ace_requests_total ${m.requests}`,
    '# HELP ace_responses_total Total number of responses',
    '# TYPE ace_responses_total counter',
    `ace_responses_total ${m.responses}`,
    '# HELP ace_errors4xx_total Total number of 4xx responses',
    '# TYPE ace_errors4xx_total counter',
    `ace_errors4xx_total ${m.errors4xx}`,
    '# HELP ace_errors5xx_total Total number of 5xx responses',
    '# TYPE ace_errors5xx_total counter',
    `ace_errors5xx_total ${m.errors5xx}`,
    '# HELP ace_request_duration_ms Summary of request duration (ms)',
    '# TYPE ace_request_duration_ms summary',
    `ace_request_duration_ms_sum ${m.totalDurationMs}`,
    `ace_request_duration_ms_count ${m.countDuration}`,
    '# HELP ace_request_duration_ms_min Minimum observed duration (ms)',
    '# TYPE ace_request_duration_ms_min gauge',
    `ace_request_duration_ms_min ${m.minMs}`,
    '# HELP ace_request_duration_ms_max Maximum observed duration (ms)',
    '# TYPE ace_request_duration_ms_max gauge',
    `ace_request_duration_ms_max ${m.maxMs}`,
    '# HELP ace_request_duration_ms_avg Average observed duration (ms)',
    '# TYPE ace_request_duration_ms_avg gauge',
    `ace_request_duration_ms_avg ${m.avgMs}`,
  ]
  return lines.join('\n') + '\n'
}

export async function GET() {
  const body = toPrometheus()
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; version=0.0.4', 'Cache-Control': 'no-store' } })
}
