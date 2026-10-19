import { describe, expect, it } from 'vitest'
import {
  COSTING_BY_STOCK_ID,
  DEFAULT_UNIT_COSTS,
  perPortionCost,
  roundedPortionCost,
} from '../data/costing'
import { MENU_ITEMS } from '../data/menu'
import { STOCK_ITEMS } from '../data/stock'
import {
  checkAvailability,
  computeCogs,
  expandLine,
  expandRequirements,
  fulfilCheck,
  isChoiceAvailable,
} from './recipes'

const UNIT_COSTS = DEFAULT_UNIT_COSTS

describe('costing reconciliation', () => {
  it('uses the team per-portion figures as unit costs', () => {
    expect(DEFAULT_UNIT_COSTS).toEqual({
      chips: 7000,
      'sauce-bolo': 7400,
      'sauce-mush': 2900,
      'sauce-cheese': 1850,
      'tea-bag': 240,
      'cheese-foam': 2600,
      'fizzy-base': 2600,
      'pack-food': 1500,
      'pack-drink': 2000,
      'pack-stack': 3500,
    })
    for (const item of STOCK_ITEMS) {
      expect(DEFAULT_UNIT_COSTS[item.id]).toBeDefined()
    }
  })

  it('reconciles batch math with the stated figures', () => {
    expect(perPortionCost(COSTING_BY_STOCK_ID['sauce-bolo'])).toBe(7400)
    expect(perPortionCost(COSTING_BY_STOCK_ID['sauce-cheese'])).toBe(1850)
    expect(perPortionCost(COSTING_BY_STOCK_ID['cheese-foam'])).toBe(2600)

    const mushroom = COSTING_BY_STOCK_ID['sauce-mush']
    expect(perPortionCost(mushroom)).toBeCloseTo(2908.33, 1)
    expect(roundedPortionCost(mushroom)).toBe(DEFAULT_UNIT_COSTS['sauce-mush'])
  })
})

describe('expandLine', () => {
  it('expands a snack recipe', () => {
    expect(expandLine({ menuItemId: 'nachos-bolo', qty: 1 })).toEqual([
      { stockItemId: 'chips', qty: 1 },
      { stockItemId: 'sauce-bolo', qty: 1 },
      { stockItemId: 'pack-food', qty: 1 },
    ])
  })

  it('expands combos without the component packaging, plus the stacked set', () => {
    const lines = expandLine({ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-fizzy' })
    expect(lines).toEqual([
      { stockItemId: 'chips', qty: 1 },
      { stockItemId: 'sauce-bolo', qty: 1 },
      { stockItemId: 'tea-bag', qty: 1 },
      { stockItemId: 'fizzy-base', qty: 1 },
      { stockItemId: 'pack-stack', qty: 1 },
    ])
  })

  it('defaults the combo drink to its first choice', () => {
    const lines = expandLine({ menuItemId: 'combo-mush', qty: 2 })
    expect(lines).toContainEqual({ stockItemId: 'cheese-foam', qty: 2 })
  })

  it('rejects a drink choice that is not a drink', () => {
    expect(() =>
      expandLine({ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'nachos-bolo' as never }),
    ).toThrow(/drink choice/)
  })
})

describe('expandRequirements', () => {
  it('aggregates duplicate stock items across lines', () => {
    const requirements = expandRequirements([
      { menuItemId: 'nachos-bolo', qty: 2 },
      { menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-cloudy' },
    ])
    expect(requirements).toEqual([
      { stockItemId: 'cheese-foam', qty: 1 },
      { stockItemId: 'chips', qty: 3 },
      { stockItemId: 'pack-food', qty: 2 },
      { stockItemId: 'pack-stack', qty: 1 },
      { stockItemId: 'sauce-bolo', qty: 3 },
      { stockItemId: 'tea-bag', qty: 1 },
    ])
  })
})

describe('HPP reconciliation (DATA-MODEL §3-4)', () => {
  const hpp = (menuItemId: string, drinkChoice?: never) =>
    computeCogs([{ menuItemId, qty: 1, drinkChoice }], UNIT_COSTS)

  it('matches the a-la-carte HPP figures', () => {
    expect(hpp('nachos-bolo')).toBe(15900)
    expect(hpp('nachos-mush')).toBe(11400)
    expect(hpp('nachos-cheese')).toBe(10350)
    expect(hpp('tea-cloudy')).toBe(4840)
    expect(hpp('tea-fizzy')).toBe(4840)
  })

  it('matches the combo HPP figures', () => {
    expect(hpp('combo-bolo')).toBe(20740)
    expect(hpp('combo-mush')).toBe(16240)
    expect(hpp('combo-cheese')).toBe(15190)
  })

  it('computes the same HPP for either drink choice', () => {
    expect(computeCogs([{ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-cloudy' }], UNIT_COSTS)).toBe(20740)
    expect(computeCogs([{ menuItemId: 'combo-bolo', qty: 1, drinkChoice: 'tea-fizzy' }], UNIT_COSTS)).toBe(20740)
  })
})

describe('fulfilCheck', () => {
  it('passes when every requirement fits on hand', () => {
    expect(
      fulfilCheck({ chips: 1, 'sauce-bolo': 1, 'pack-food': 1 }, [{ menuItemId: 'nachos-bolo', qty: 1 }]),
    ).toBe(true)
  })

  it('fails on fractional shortfalls', () => {
    expect(
      fulfilCheck({ 'tea-bag': 0.5, 'cheese-foam': 1, 'pack-drink': 1 }, [{ menuItemId: 'tea-cloudy', qty: 1 }]),
    ).toBe(false)
  })

  it('treats missing stock rows as unavailable', () => {
    expect(fulfilCheck({}, [{ menuItemId: 'nachos-bolo', qty: 1 }])).toBe(false)
  })
})

describe('checkAvailability', () => {
  const allFlags = (value = true): Record<string, boolean> =>
    Object.fromEntries(STOCK_ITEMS.map((item) => [item.id, value]))

  it('marks everything available when stock flags are up', () => {
    const result = checkAvailability(allFlags(true), {})
    expect(Object.values(result).every(Boolean)).toBe(true)
  })

  it('sells out the items that depend on a missing ingredient', () => {
    const flags = { ...allFlags(true), 'sauce-mush': false }
    const result = checkAvailability(flags, {})
    expect(result['nachos-mush']).toBe(false)
    expect(result['combo-mush']).toBe(false)
    expect(result['nachos-bolo']).toBe(true)
  })

  it('keeps a combo available while one drink choice still works', () => {
    const flags = { ...allFlags(true), 'cheese-foam': false }
    const result = checkAvailability(flags, {})
    expect(result['combo-bolo']).toBe(true)
    expect(isChoiceAvailable('combo-bolo', 'tea-cloudy', flags)).toBe(false)
    expect(isChoiceAvailable('combo-bolo', 'tea-fizzy', flags)).toBe(true)
  })

  it('honors manual sold-out overrides', () => {
    const result = checkAvailability(allFlags(true), { 'nachos-bolo': true })
    expect(result['nachos-bolo']).toBe(false)
    expect(result['combo-bolo']).toBe(true)
  })

  it('treats missing flags as out of stock', () => {
    const result = checkAvailability({}, {})
    expect(Object.values(result).every((value) => value === false)).toBe(true)
  })

  it('covers every menu item', () => {
    const result = checkAvailability(allFlags(true), {})
    expect(Object.keys(result).sort()).toEqual(MENU_ITEMS.map((item) => item.id).sort())
  })
})
