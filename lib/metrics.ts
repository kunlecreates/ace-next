export type Metrics = {
  requests: number
  responses: number
  errors4xx: number
  errors5xx: number
  totalDurationMs: number
  countDuration: number
  minMs: number
  maxMs: number
  routes?: Record<string, RouteStats>
}

export type RouteStats = {
  requests: number
  responses: number
  errors4xx: number
  errors5xx: number
  totalDurationMs: number
  countDuration: number
}

const metrics: Metrics = {
  requests: 0,
  responses: 0,
  errors4xx: 0,
  errors5xx: 0,
  totalDurationMs: 0,
  countDuration: 0,
  minMs: Number.POSITIVE_INFINITY,
  maxMs: 0,
  routes: {},
}

function ensureRoute(label?: string): RouteStats | undefined {
  if (!label) return undefined
  if (!metrics.routes) metrics.routes = {}
  if (!metrics.routes[label]) {
    metrics.routes[label] = { requests: 0, responses: 0, errors4xx: 0, errors5xx: 0, totalDurationMs: 0, countDuration: 0 }
  }
  return metrics.routes[label]
}

export function recordRequest(label?: string) {
  metrics.requests += 1
  const r = ensureRoute(label)
  if (r) r.requests += 1
}

export function recordResponse(status: number, durationMs?: number, label?: string) {
  metrics.responses += 1
  if (status >= 400 && status < 500) metrics.errors4xx += 1
  if (status >= 500) metrics.errors5xx += 1
  if (typeof durationMs === 'number' && Number.isFinite(durationMs)) {
    metrics.totalDurationMs += durationMs
    metrics.countDuration += 1
    if (durationMs < metrics.minMs) metrics.minMs = durationMs
    if (durationMs > metrics.maxMs) metrics.maxMs = durationMs
  }
  const r = ensureRoute(label)
  if (r) {
    r.responses += 1
    if (status >= 400 && status < 500) r.errors4xx += 1
    if (status >= 500) r.errors5xx += 1
    if (typeof durationMs === 'number' && Number.isFinite(durationMs)) {
      r.totalDurationMs += durationMs
      r.countDuration += 1
    }
  }
}

export function getMetrics() {
  const avg = metrics.countDuration ? metrics.totalDurationMs / metrics.countDuration : 0
  const routes: Record<string, RouteStats> = {}
  if (metrics.routes) {
    for (const [k, v] of Object.entries(metrics.routes)) routes[k] = { ...v }
  }
  return { ...metrics, routes, avgMs: avg, minMs: isFinite(metrics.minMs) ? metrics.minMs : 0 }
}

// Test-only helper to reset metrics between unit tests
export function _resetMetricsForTest() {
  metrics.requests = 0
  metrics.responses = 0
  metrics.errors4xx = 0
  metrics.errors5xx = 0
  metrics.totalDurationMs = 0
  metrics.countDuration = 0
  metrics.minMs = Number.POSITIVE_INFINITY
  metrics.maxMs = 0
  metrics.routes = {}
}
