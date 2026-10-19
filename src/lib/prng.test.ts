import { describe, expect, it } from 'vitest'
import { createPrng } from './prng'

describe('createPrng', () => {
  it('is reproducible for the same seed', () => {
    const a = createPrng('anggrek:2026-10-19')
    const b = createPrng('anggrek:2026-10-19')
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 5 }, createPrng('seed-a'))
    const b = Array.from({ length: 5 }, createPrng('seed-b'))
    expect(a).not.toEqual(b)
  })

  it('stays within [0, 1)', () => {
    const next = createPrng('range-check')
    for (let i = 0; i < 1000; i++) {
      const value = next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
