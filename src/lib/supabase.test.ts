import { describe, expect, it } from 'vitest'
import { fetchAllRows, isConfigured, parseSaleError, supabase } from './supabase'

describe('parseSaleError', () => {
  it('maps PostgREST error text to typed codes', () => {
    expect(parseSaleError('PGRST202: INSUFFICIENT_STOCK')).toBe('INSUFFICIENT_STOCK')
    expect(parseSaleError('NOT_AUTHORIZED')).toBe('NOT_AUTHORIZED')
    expect(parseSaleError('SOLD_OUT')).toBe('SOLD_OUT')
    expect(parseSaleError('INSUFFICIENT_CASH')).toBe('INSUFFICIENT_CASH')
    expect(parseSaleError('ALREADY_VOIDED')).toBe('ALREADY_VOIDED')
    expect(parseSaleError('something else entirely')).toBe('UNKNOWN')
  })
})

describe('fetchAllRows', () => {
  it('pages through results in 1000-row batches', async () => {
    const total = 2345
    let calls = 0
    const rows = Array.from({ length: total }, (_, index) => ({ id: index }))

    const result = await fetchAllRows<{ id: number }>(async (from, to) => {
      calls += 1
      return { data: rows.slice(from, to + 1), error: null }
    })

    expect(result).toHaveLength(total)
    expect(calls).toBe(3)
  })

  it('throws on query errors', async () => {
    await expect(
      fetchAllRows(async () => ({ data: null, error: { message: 'boom' } })),
    ).rejects.toThrow('boom')
  })
})

describe('client bootstrap', () => {
  it('stays unconfigured without env vars (static fallback mode)', () => {
    expect(isConfigured).toBe(false)
    expect(supabase).toBeNull()
  })
})
