import { describe, expect, it } from 'vitest'
import { computeStockFlags, onHandForOutlet, outletAvailability } from './availability'

describe('computeStockFlags', () => {
  it('marks a stock item out of flag when on hand is below the largest requirement', () => {
    const flags = computeStockFlags({ 'tea-bag': 0.5, 'cheese-foam': 1, 'pack-drink': 1 })
    expect(flags['tea-bag']).toBe(false)
    expect(flags['cheese-foam']).toBe(true)
  })

  it('treats missing rows as out of stock', () => {
    expect(computeStockFlags({}).chips).toBe(false)
  })
})

describe('outletAvailability (static dataset)', () => {
  it('is fully available at the flagship except demo low-stock items', () => {
    const { availability } = outletAvailability('anggrek')
    expect(availability['combo-bolo']).toBe(true)
    expect(availability['nachos-bolo']).toBe(true)
  })

  it('auto-sells-out mushroom items at Blok M where sauce-mush is zero', () => {
    const { flags, availability } = outletAvailability('blok-m')
    expect(onHandForOutlet('blok-m')['sauce-mush']).toBe(0)
    expect(flags['sauce-mush']).toBe(false)
    expect(availability['nachos-mush']).toBe(false)
    expect(availability['combo-mush']).toBe(false)
    expect(availability['nachos-bolo']).toBe(true)
    expect(availability['combo-mush']).toBe(false)
  })

  it('keeps combos available when only one drink base is missing', () => {
    const flags = computeStockFlags({
      chips: 1,
      'sauce-bolo': 1,
      'tea-bag': 1,
      'pack-stack': 1,
      'cheese-foam': 0,
      'fizzy-base': 1,
    })
    expect(flags['cheese-foam']).toBe(false)
    expect(flags['fizzy-base']).toBe(true)
  })

  it('honors manual sold-out overrides', () => {
    const { availability } = outletAvailability('anggrek', { 'combo-bolo': true })
    expect(availability['combo-bolo']).toBe(false)
  })
})
