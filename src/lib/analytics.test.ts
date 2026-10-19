import { describe, expect, it } from 'vitest'
import { MENU_BY_ID } from '../data/menu'
import type { Sale } from './analytics'
import {
  activeSales,
  byDay,
  hourMatrix,
  paymentSplit,
  productMix,
  summarize,
  topItems,
  unitEconomics,
} from './analytics'

const sales: Sale[] = [
  {
    id: 'sale-1',
    outletId: 'outlet-anggrek',
    createdAt: '2026-10-19T05:00:00Z', // Mon 12:00 WIB
    paymentMethod: 'cash',
    total: 35000,
    cogs: 20740,
    voided: false,
    items: [{ menuItemId: 'combo-bolo', qty: 1, unitPrice: 35000, lineCogs: 20740 }],
  },
  {
    id: 'sale-2',
    outletId: 'outlet-anggrek',
    createdAt: '2026-10-19T10:30:00Z', // Mon 17:30 WIB
    paymentMethod: 'qris',
    total: 25000,
    cogs: 15900,
    voided: false,
    items: [{ menuItemId: 'nachos-bolo', qty: 1, unitPrice: 25000, lineCogs: 15900 }],
  },
  {
    id: 'sale-3',
    outletId: 'outlet-anggrek',
    createdAt: '2026-10-19T05:05:00Z',
    paymentMethod: 'qris',
    total: 17000,
    cogs: 4840,
    voided: true,
    items: [{ menuItemId: 'tea-fizzy', qty: 1, unitPrice: 17000, lineCogs: 4840 }],
  },
  {
    id: 'sale-4',
    outletId: 'outlet-anggrek',
    createdAt: '2026-10-19T17:30:00Z', // Tue 00:30 WIB on Oct 20
    paymentMethod: 'qris',
    total: 17000,
    cogs: 4840,
    voided: false,
    items: [{ menuItemId: 'tea-cloudy', qty: 1, unitPrice: 17000, lineCogs: 4840 }],
  },
]

describe('activeSales / summarize', () => {
  it('excludes voided sales everywhere', () => {
    expect(activeSales(sales)).toHaveLength(3)
    const summary = summarize(sales)
    expect(summary.count).toBe(3)
    expect(summary.revenue).toBe(77000)
    expect(summary.cogs).toBe(41480)
    expect(summary.grossProfit).toBe(35520)
    expect(summary.avgTicket).toBeCloseTo(25666.67, 1)
    expect(summary.revenue).not.toBe(94000)
  })
})

describe('byDay', () => {
  it('zero-fills and buckets by WIB date', () => {
    const buckets = byDay(sales, '2026-10-19', '2026-10-20')
    expect(buckets).toHaveLength(2)
    expect(buckets[0]).toMatchObject({ dateKey: '2026-10-19', count: 2, revenue: 60000 })
    expect(buckets[1]).toMatchObject({ dateKey: '2026-10-20', count: 1, revenue: 17000 })
    expect(buckets[0].profit).toBe(60000 - 36640)
  })

  it('fills zero-activity days', () => {
    const buckets = byDay(sales, '2026-10-21', '2026-10-22')
    expect(buckets.every((bucket) => bucket.count === 0 && bucket.revenue === 0)).toBe(true)
  })
})

describe('hourMatrix', () => {
  it('buckets by WIB weekday and hour', () => {
    const { matrix } = hourMatrix(sales)
    expect(matrix[1][12]).toEqual({ count: 1, revenue: 35000 })
    expect(matrix[1][17]).toEqual({ count: 1, revenue: 25000 })
    expect(matrix[2][0]).toEqual({ count: 1, revenue: 17000 })
    expect(matrix[1][12].count).toBe(1)
  })
})

describe('topItems', () => {
  it('ranks by revenue and ignores voids', () => {
    const items = topItems(sales, 5)
    expect(items[0]).toEqual({ menuItemId: 'combo-bolo', qty: 1, revenue: 35000 })
    expect(items.map((item) => item.menuItemId)).not.toContain('tea-fizzy')
  })
})

describe('productMix and paymentSplit', () => {
  it('splits revenue by menu kind', () => {
    const mix = productMix(sales, (id) => MENU_BY_ID[id].kind)
    expect(mix).toEqual({ combo: 35000, snack: 25000, drink: 17000 })
  })

  it('splits by payment method', () => {
    const split = paymentSplit(sales)
    expect(split.cash).toEqual({ count: 1, revenue: 35000 })
    expect(split.qris).toEqual({ count: 2, revenue: 42000 })
  })
})

describe('unitEconomics', () => {
  it('reports per-item economics with units sold', () => {
    const rows = unitEconomics(
      sales,
      (id) => MENU_BY_ID[id].price,
      (id) => (id === 'combo-bolo' ? 20740 : id === 'nachos-bolo' ? 15900 : 4840),
    )
    expect(rows).toHaveLength(3)
    const combo = rows.find((row) => row.menuItemId === 'combo-bolo')!
    expect(combo).toMatchObject({
      price: 35000,
      hpp: 20740,
      profitPerUnit: 14260,
      units: 1,
      revenue: 35000,
    })
  })
})
