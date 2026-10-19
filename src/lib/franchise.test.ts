import { describe, expect, it } from 'vitest'
import { FRANCHISE_PACKAGES } from '../data/packages'
import { calculateEarnings, defaultEarningsInput } from './franchise'

function inputForPackage(id: 'regular' | 'large' | 'jumbo') {
  const pkg = FRANCHISE_PACKAGES.find((entry) => entry.id === id)!
  return defaultEarningsInput({
    investment: pkg.investmentMid,
    dailyCups: pkg.defaults.dailyCups,
    daysPerMonth: pkg.defaults.daysPerMonth,
    comboMixPct: pkg.defaults.comboMixPct,
    rent: pkg.defaults.rent,
    staffing: pkg.defaults.staffing,
    utilities: pkg.defaults.utilities,
    royaltyPct: pkg.defaults.royaltyPct,
    marketingPct: pkg.defaults.marketingPct,
  })
}

describe('calculateEarnings', () => {
  it('matches the Regular tier expectations (~3.7 month payback)', () => {
    const result = calculateEarnings(inputForPackage('regular'))
    expect(result.monthlyCups).toBe(1040)
    expect(result.comboCups).toBe(572)
    expect(result.revenue).toBeCloseTo(26_908_076, -2)
    expect(result.cogs).toBeCloseTo(14_377_168, -2)
    expect(result.grossProfit).toBeCloseTo(12_530_908, -2)
    expect(result.netProfit).toBeCloseTo(5_397_343, -2)
    expect(result.paybackMonths).toBeCloseTo(3.71, 1)
    expect(result.breakevenCupsPerDay).toBeCloseTo(19.7, 1)
  })

  it('matches the Large tier expectations (≈ Rp 12 jt net / month)', () => {
    const result = calculateEarnings(inputForPackage('large'))
    expect(result.monthlyCups).toBe(2340)
    expect(result.netProfit).toBeCloseTo(11_956_521, -2)
    expect(result.paybackMonths).toBeCloseTo(4.6, 1)
  })

  it('matches the Jumbo tier expectations (~9.6 month payback)', () => {
    const result = calculateEarnings(inputForPackage('jumbo'))
    expect(result.monthlyCups).toBe(5200)
    expect(result.netProfit).toBeCloseTo(16_636_713, -2)
    expect(result.paybackMonths).toBeCloseTo(9.62, 1)
  })

  it('returns no payback when the business does not cover costs', () => {
    const result = calculateEarnings({
      ...inputForPackage('regular'),
      dailyCups: 1,
      investment: 20_000_000,
    })
    expect(result.netProfit).toBeLessThan(0)
    expect(result.paybackMonths).toBeNull()
    expect(result.breakevenCupsPerDay).toBeGreaterThan(0)
  })
})
