import { describe, expect, it } from 'vitest'
import { hppPercent, pricingInsight, suggestedPrice } from './pricing'

describe('suggestedPrice', () => {
  it('suggests 26.500 for the bolognese nachos', () => {
    expect(suggestedPrice(15900)).toBe(26500)
  })

  it('suggests 17.500 for the golden cheese nachos', () => {
    expect(suggestedPrice(10350)).toBe(17500)
  })

  it('rounds up to the nearest 500', () => {
    expect(suggestedPrice(10000)).toBe(17000)
  })
})

describe('pricingInsight', () => {
  it('flags bolognese nachos above the 60% target', () => {
    const insight = pricingInsight(25000, 15900)
    expect(insight.hppPct).toBeCloseTo(63.6, 1)
    expect(insight.overTarget).toBe(true)
    expect(insight.suggestion).toBe(26500)
  })

  it('flags golden cheese nachos as borderline', () => {
    const insight = pricingInsight(17000, 10350)
    expect(insight.hppPct).toBeCloseTo(60.9, 1)
    expect(insight.overTarget).toBe(true)
    expect(insight.suggestion).toBe(17500)
  })

  it('leaves healthy items alone', () => {
    expect(pricingInsight(20000, 11400).overTarget).toBe(false)
    expect(pricingInsight(35000, 20740).overTarget).toBe(false)
    expect(pricingInsight(17000, 4840).suggestion).toBeNull()
  })

  it('computes HPP percentage', () => {
    expect(hppPercent(17000, 4840)).toBeCloseTo(28.5, 1)
    expect(hppPercent(0, 100)).toBe(0)
  })
})
