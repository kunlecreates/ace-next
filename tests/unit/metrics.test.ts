import { describe, it, expect, beforeEach } from 'vitest'
import { recordRequest, recordResponse, getMetrics, _resetMetricsForTest } from '../../lib/metrics'

describe('metrics recorders', () => {
  beforeEach(() => {
    _resetMetricsForTest()
  })

  it('tracks requests and responses', () => {
    recordRequest()
    recordRequest()
    recordResponse(200, 50)
    recordResponse(404, 10)
    recordResponse(500, 100)
    const m = getMetrics()
    expect(m.requests).toBe(2)
    expect(m.responses).toBe(3)
    expect(m.errors4xx).toBe(1)
    expect(m.errors5xx).toBe(1)
  })

  it('computes min/max/avg correctly', () => {
    recordResponse(200, 30)
    recordResponse(200, 70)
    recordResponse(200, 50)
    const m = getMetrics()
    expect(m.minMs).toBe(30)
    expect(m.maxMs).toBe(70)
    expect(Math.round(m.avgMs)).toBe(50)
  })

  it('avg and min are 0 when no durations recorded', () => {
    const m = getMetrics()
    expect(m.avgMs).toBe(0)
    expect(m.minMs).toBe(0)
  })
})
