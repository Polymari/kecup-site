import type { DrinkKey } from '../data/types'
import { dateKey, dateKeyToUtc } from './wib'

export interface SaleItem {
  menuItemId: string
  qty: number
  unitPrice: number
  lineCogs: number
  drinkChoice?: DrinkKey
}

export interface Sale {
  id: string
  outletId: string
  createdAt: string
  paymentMethod: 'cash' | 'qris'
  total: number
  cogs: number
  voided: boolean
  items: SaleItem[]
}

export function activeSales(sales: Sale[]): Sale[] {
  return sales.filter((sale) => !sale.voided)
}

export interface Summary {
  count: number
  revenue: number
  cogs: number
  grossProfit: number
  avgTicket: number
}

export function summarize(sales: Sale[]): Summary {
  const active = activeSales(sales)
  const revenue = active.reduce((sum, sale) => sum + sale.total, 0)
  const cogs = active.reduce((sum, sale) => sum + sale.cogs, 0)
  return {
    count: active.length,
    revenue,
    cogs,
    grossProfit: revenue - cogs,
    avgTicket: active.length ? revenue / active.length : 0,
  }
}

export interface DayBucket {
  dateKey: string
  count: number
  revenue: number
  cogs: number
  profit: number
}

export function byDay(sales: Sale[], fromKey: string, toKey: string): DayBucket[] {
  const buckets = new Map<string, DayBucket>()
  let cursor = dateKeyToUtc(fromKey)
  const end = dateKeyToUtc(toKey)
  while (cursor.getTime() <= end.getTime()) {
    const key = dateKey(cursor)
    buckets.set(key, { dateKey: key, count: 0, revenue: 0, cogs: 0, profit: 0 })
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }

  for (const sale of activeSales(sales)) {
    const key = dateKey(new Date(sale.createdAt))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.count += 1
    bucket.revenue += sale.total
    bucket.cogs += sale.cogs
    bucket.profit += sale.total - sale.cogs
  }

  return [...buckets.values()]
}

export interface HourCell {
  count: number
  revenue: number
}

export interface HourMatrix {
  weekdays: number[]
  matrix: HourCell[][]
}

export function hourMatrix(sales: Sale[]): HourMatrix {
  const matrix: HourCell[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ count: 0, revenue: 0 })),
  )
  for (const sale of activeSales(sales)) {
    const date = new Date(sale.createdAt)
    const local = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    const weekday = local.getUTCDay()
    const hour = local.getUTCHours()
    matrix[weekday][hour].count += 1
    matrix[weekday][hour].revenue += sale.total
  }
  return { weekdays: [0, 1, 2, 3, 4, 5, 6], matrix }
}

export interface TopItem {
  menuItemId: string
  qty: number
  revenue: number
}

export function topItems(sales: Sale[], limit = 5): TopItem[] {
  const totals = new Map<string, TopItem>()
  for (const sale of activeSales(sales)) {
    for (const item of sale.items) {
      const entry = totals.get(item.menuItemId) ?? {
        menuItemId: item.menuItemId,
        qty: 0,
        revenue: 0,
      }
      entry.qty += item.qty
      entry.revenue += item.qty * item.unitPrice
      totals.set(item.menuItemId, entry)
    }
  }
  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export interface ProductMix {
  combo: number
  snack: number
  drink: number
}

export function productMix(
  sales: Sale[],
  kindOf: (menuItemId: string) => 'snack' | 'drink' | 'combo',
): ProductMix {
  const mix: ProductMix = { combo: 0, snack: 0, drink: 0 }
  for (const sale of activeSales(sales)) {
    for (const item of sale.items) {
      mix[kindOf(item.menuItemId)] += item.qty * item.unitPrice
    }
  }
  return mix
}

export interface PaymentSplit {
  cash: { count: number; revenue: number }
  qris: { count: number; revenue: number }
}

export function paymentSplit(sales: Sale[]): PaymentSplit {
  const split: PaymentSplit = {
    cash: { count: 0, revenue: 0 },
    qris: { count: 0, revenue: 0 },
  }
  for (const sale of activeSales(sales)) {
    split[sale.paymentMethod].count += 1
    split[sale.paymentMethod].revenue += sale.total
  }
  return split
}

export interface UnitEconomicsRow {
  menuItemId: string
  price: number
  hpp: number
  profitPerUnit: number
  units: number
  revenue: number
  cogs: number
}

export function unitEconomics(
  sales: Sale[],
  priceOf: (menuItemId: string) => number,
  hppOf: (menuItemId: string) => number,
): UnitEconomicsRow[] {
  const rows = new Map<string, UnitEconomicsRow>()
  for (const sale of activeSales(sales)) {
    for (const item of sale.items) {
      const price = priceOf(item.menuItemId)
      const hpp = hppOf(item.menuItemId)
      const row = rows.get(item.menuItemId) ?? {
        menuItemId: item.menuItemId,
        price,
        hpp,
        profitPerUnit: price - hpp,
        units: 0,
        revenue: 0,
        cogs: 0,
      }
      row.units += item.qty
      row.revenue += item.qty * item.unitPrice
      row.cogs += item.lineCogs
      rows.set(item.menuItemId, row)
    }
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue)
}
