import type { Outlet } from '../data/types'
import { MENU_BY_ID } from '../data/menu'
import { OUTLET_STOCK_LEVELS } from '../data/outlets'
import { computeCogs } from './recipes'
import type { SaleItem } from './analytics'
import { simulateSales } from './salesim'

export type PortalSaleItem = SaleItem

export interface PortalSale {
  id: string
  outletId: string
  createdAt: string
  paymentMethod: 'cash' | 'qris'
  total: number
  cogs: number
  cashReceived: number | null
  changeDue: number | null
  voided: boolean
  voidReason?: string
  items: PortalSaleItem[]
}

export interface StockRow {
  stockItemId: string
  qty: number
  lowThreshold: number
  unitCost: number
}

export type MovementKind = 'sale' | 'restock' | 'adjustment' | 'waste' | 'void' | 'seed'

export interface Movement {
  id: string
  stockItemId: string
  kind: MovementKind
  delta: number
  refSaleId?: string
  note?: string
  createdAt: string
}

export function initialStock(outlet: Outlet): StockRow[] {
  return OUTLET_STOCK_LEVELS.filter((level) => level.outletSlug === outlet.slug).map((level) => ({
    stockItemId: level.stockItemId,
    qty: level.qty,
    lowThreshold: level.lowThreshold,
    unitCost: level.unitCost,
  }))
}

export function initialMovements(outlet: Outlet): Movement[] {
  return initialStock(outlet).map((row) => ({
    id: `seed-${outlet.slug}-${row.stockItemId}`,
    stockItemId: row.stockItemId,
    kind: 'seed' as const,
    delta: row.qty,
    note: 'seed',
    createdAt: new Date().toISOString(),
  }))
}

export function unitCostMap(stock: StockRow[]): Record<string, number> {
  return Object.fromEntries(stock.map((row) => [row.stockItemId, row.unitCost]))
}

export function demoSales(outlet: Outlet): PortalSale[] {
  const costs = unitCostMap(initialStock(outlet))

  return simulateSales(outlet, { days: 30 }).map((sale, index) => {
    const items: PortalSaleItem[] = sale.lines.map((line) => ({
      menuItemId: line.menuItemId,
      qty: line.qty,
      drinkChoice: line.drinkChoice,
      unitPrice: MENU_BY_ID[line.menuItemId].price,
      lineCogs: computeCogs(
        [{ menuItemId: line.menuItemId, qty: line.qty, drinkChoice: line.drinkChoice }],
        costs,
      ),
    }))

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
    const cogs = items.reduce((sum, item) => sum + item.lineCogs, 0)

    return {
      id: `demo-${outlet.slug}-${index}`,
      outletId: outlet.id,
      createdAt: sale.createdAt.toISOString(),
      paymentMethod: sale.payment,
      total,
      cogs,
      cashReceived: sale.cashReceived,
      changeDue: sale.cashReceived === null ? null : sale.cashReceived - total,
      voided: sale.voided,
      voidReason: sale.voided ? 'Seeded void (demo)' : undefined,
      items,
    }
  })
}
