import { create } from 'zustand'
import { MENU_BY_ID } from '@/data/menu'
import { OUTLETS_BY_SLUG } from '@/data/outlets'
import type { DayKey, DrinkKey, OutletHours } from '@/data/types'
import {
  demoSales,
  initialMovements,
  initialStock,
  unitCostMap,
} from '@/lib/demoData'
import type { Movement, PortalSale, StockRow } from '@/lib/demoData'
import { computeCogs, expandRequirements, fulfilCheck } from '@/lib/recipes'
import type { OrderLine } from '@/data/types'

export interface OutletSettings {
  whatsapp: string
  instagram: string
  hours: OutletHours
  temporarilyClosed: boolean
  soldOut: Record<string, boolean>
}

export interface RecordSaleInput {
  lines: OrderLine[]
  payment: 'cash' | 'qris'
  cashReceived: number | null
}

export type SaleFailure =
  | 'NOT_AUTHORIZED'
  | 'INSUFFICIENT_STOCK'
  | 'SOLD_OUT'
  | 'INSUFFICIENT_CASH'
  | 'UNKNOWN_ITEM'
  | 'ALREADY_VOIDED'

export type SaleOutcome =
  | { ok: true; sale: PortalSale; lowStock: string[] }
  | { ok: false; error: SaleFailure }

interface PortalState {
  outletSlug: string
  stock: StockRow[]
  sales: PortalSale[]
  movements: Movement[]
  settings: Record<string, OutletSettings>

  setOutlet: (slug: string) => void
  recordSale: (input: RecordSaleInput) => SaleOutcome
  voidSale: (saleId: string, reason: string) => SaleOutcome
  restock: (stockItemId: string, qty: number, unitCost?: number, note?: string) => void
  adjust: (stockItemId: string, delta: number, kind: 'adjustment' | 'waste', note?: string) => void
  updateSettings: (slug: string, patch: Partial<OutletSettings>) => void
  resetDemo: () => void
}

function settingsFor(slug: string): OutletSettings {
  const outlet = OUTLETS_BY_SLUG[slug]
  return {
    whatsapp: outlet.whatsapp,
    instagram: outlet.instagram,
    hours: structuredClone(outlet.hours),
    temporarilyClosed: false,
    soldOut: {},
  }
}

function initState(outletSlug: string) {
  const outlet = OUTLETS_BY_SLUG[outletSlug]
  return {
    outletSlug,
    stock: initialStock(outlet),
    sales: demoSales(outlet),
    movements: initialMovements(outlet),
    settings: Object.fromEntries(
      Object.keys(OUTLETS_BY_SLUG).map((slug) => [slug, settingsFor(slug)]),
    ),
  }
}

function lowStockRows(stock: StockRow[]): string[] {
  return stock.filter((row) => row.qty < row.lowThreshold).map((row) => row.stockItemId)
}

export const usePortal = create<PortalState>()((set, get) => ({
  ...initState('anggrek'),

  setOutlet: (slug) => set(() => ({ ...initState(slug) })),

  recordSale: (input) => {
    const state = get()
    const settings = state.settings[state.outletSlug]

    for (const line of input.lines) {
      if (!MENU_BY_ID[line.menuItemId]) return { ok: false, error: 'UNKNOWN_ITEM' }
      if (settings?.soldOut[line.menuItemId]) return { ok: false, error: 'SOLD_OUT' }
    }

    const onHand = Object.fromEntries(state.stock.map((row) => [row.stockItemId, row.qty]))
    if (!fulfilCheck(onHand, input.lines)) return { ok: false, error: 'INSUFFICIENT_STOCK' }

    const costs = unitCostMap(state.stock)
    const total = input.lines.reduce((sum, line) => {
      const item = MENU_BY_ID[line.menuItemId]
      return sum + item.price * line.qty
    }, 0)
    const cogs = computeCogs(input.lines, costs)

    if (input.payment === 'cash') {
      if ((input.cashReceived ?? 0) < total) return { ok: false, error: 'INSUFFICIENT_CASH' }
    }

    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    const requirements = expandRequirements(input.lines)
    const createdAt = new Date().toISOString()

    const sale: PortalSale = {
      id: saleId,
      outletId: OUTLETS_BY_SLUG[state.outletSlug].id,
      createdAt,
      paymentMethod: input.payment,
      total,
      cogs,
      cashReceived: input.payment === 'cash' ? input.cashReceived : null,
      changeDue:
        input.payment === 'cash' ? (input.cashReceived ?? 0) - total : null,
      voided: false,
      items: input.lines.map((line) => ({
        menuItemId: line.menuItemId,
        qty: line.qty,
        drinkChoice: line.drinkChoice as DrinkKey | undefined,
        unitPrice: MENU_BY_ID[line.menuItemId].price,
        lineCogs: computeCogs([line], costs),
      })),
    }

    const stock = state.stock.map((row) => {
      const requirement = requirements.find((req) => req.stockItemId === row.stockItemId)
      return requirement ? { ...row, qty: row.qty - requirement.qty } : row
    })

    const movements: Movement[] = requirements.map((requirement, index) => ({
      id: `${saleId}-m${index}`,
      stockItemId: requirement.stockItemId,
      kind: 'sale',
      delta: -requirement.qty,
      refSaleId: saleId,
      createdAt,
    }))

    set({
      sales: [sale, ...state.sales],
      stock,
      movements: [...movements, ...state.movements],
    })

    return { ok: true, sale, lowStock: lowStockRows(stock) }
  },

  voidSale: (saleId, reason) => {
    const state = get()
    const sale = state.sales.find((entry) => entry.id === saleId)
    if (!sale) return { ok: false, error: 'UNKNOWN_ITEM' }
    if (sale.voided) return { ok: false, error: 'ALREADY_VOIDED' }

    const requirements = expandRequirements(
      sale.items.map((item) => ({
        menuItemId: item.menuItemId,
        qty: item.qty,
        drinkChoice: item.drinkChoice,
      })),
    )
    const createdAt = new Date().toISOString()
    const stock = state.stock.map((row) => {
      const requirement = requirements.find((req) => req.stockItemId === row.stockItemId)
      return requirement ? { ...row, qty: row.qty + requirement.qty } : row
    })
    const movements: Movement[] = requirements.map((requirement, index) => ({
      id: `${saleId}-v${index}`,
      stockItemId: requirement.stockItemId,
      kind: 'void',
      delta: requirement.qty,
      refSaleId: saleId,
      note: reason,
      createdAt,
    }))

    set({
      sales: state.sales.map((entry) =>
        entry.id === saleId ? { ...entry, voided: true, voidReason: reason } : entry,
      ),
      stock,
      movements: [...movements, ...state.movements],
    })

    return { ok: true, sale, lowStock: lowStockRows(stock) }
  },

  restock: (stockItemId, qty, unitCost, note) => {
    const state = get()
    const createdAt = new Date().toISOString()
    set({
      stock: state.stock.map((row) => {
        if (row.stockItemId !== stockItemId) return row
        const weighted =
          unitCost === undefined
            ? row.unitCost
            : row.qty > 0
              ? (row.qty * row.unitCost + qty * unitCost) / (row.qty + qty)
              : unitCost
        return { ...row, qty: row.qty + qty, unitCost: weighted }
      }),
      movements: [
        {
          id: `restock-${Date.now()}`,
          stockItemId,
          kind: 'restock',
          delta: qty,
          note,
          createdAt,
        },
        ...state.movements,
      ],
    })
  },

  adjust: (stockItemId, delta, kind, note) => {
    const state = get()
    const createdAt = new Date().toISOString()
    set({
      stock: state.stock.map((row) =>
        row.stockItemId === stockItemId
          ? { ...row, qty: Math.max(0, row.qty + delta) }
          : row,
      ),
      movements: [
        {
          id: `adjust-${Date.now()}`,
          stockItemId,
          kind,
          delta,
          note,
          createdAt,
        },
        ...state.movements,
      ],
    })
  },

  updateSettings: (slug, patch) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [slug]: { ...state.settings[slug], ...patch },
      },
    })),

  resetDemo: () => set(() => ({ ...initState(get().outletSlug) })),
}))

export function settingsHours(settings: OutletSettings | undefined, day: DayKey) {
  return settings?.hours[day]
}
