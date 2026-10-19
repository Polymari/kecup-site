import { beforeEach, describe, expect, it } from 'vitest'
import { MENU_BY_ID } from '@/data/menu'
import { OUTLETS_BY_SLUG } from '@/data/outlets'
import { demoSales, initialStock, unitCostMap } from '@/lib/demoData'
import { computeCogs } from '@/lib/recipes'
import { usePortal } from './portal'

describe('portal store — transactional POS semantics', () => {
  beforeEach(() => {
    usePortal.setState({
      ...usePortal.getState(),
      stock: initialStock(OUTLETS_BY_SLUG['anggrek']),
      sales: [],
    })
  })

  it('starts with the seeded demo dataset', () => {
    usePortal.getState().resetDemo()
    const state = usePortal.getState()
    expect(state.stock).toHaveLength(10)
    expect(state.sales.length).toBeGreaterThan(100)
  })

  it('generates deterministic demo sales', () => {
    const a = demoSales(OUTLETS_BY_SLUG['anggrek'])
    const b = demoSales(OUTLETS_BY_SLUG['anggrek'])
    expect(a.length).toBe(b.length)
    expect(a[0].createdAt).toBe(b[0].createdAt)
    expect(a[0].total).toBe(b[0].total)
  })

  it('records a sale atomically: COGS computed, stock decremented, movements logged', () => {
    const state = usePortal.getState()
    const costs = unitCostMap(state.stock)
    const before = Object.fromEntries(state.stock.map((row) => [row.stockItemId, row.qty]))

    const outcome = state.recordSale({
      lines: [{ menuItemId: 'combo-bolo', drinkChoice: 'tea-cloudy', qty: 1 }],
      payment: 'cash',
      cashReceived: 50000,
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.sale.total).toBe(35000)
    expect(outcome.sale.cogs).toBe(computeCogs([{ menuItemId: 'combo-bolo', drinkChoice: 'tea-cloudy', qty: 1 }], costs))
    expect(outcome.sale.changeDue).toBe(15000)

    const after = Object.fromEntries(
      usePortal.getState().stock.map((row) => [row.stockItemId, row.qty]),
    )
    for (const id of ['chips', 'sauce-bolo', 'tea-bag', 'cheese-foam', 'pack-stack']) {
      expect(after[id]).toBe((before[id] ?? 0) - 1)
    }
    const saleMoves = usePortal
      .getState()
      .movements.filter((movement) => movement.kind === 'sale')
    expect(saleMoves).toHaveLength(5)
  })

  it('rejects sales with insufficient stock and changes nothing', () => {
    usePortal.setState({
      ...usePortal.getState(),
      stock: usePortal.getState().stock.map((row) =>
        row.stockItemId === 'chips' ? { ...row, qty: 0 } : row,
      ),
    })
    const outcome = usePortal.getState().recordSale({
      lines: [{ menuItemId: 'nachos-bolo', qty: 1 }],
      payment: 'qris',
      cashReceived: null,
    })
    expect(outcome).toEqual({ ok: false, error: 'INSUFFICIENT_STOCK' })
    expect(usePortal.getState().sales).toHaveLength(0)
  })

  it('rejects cash sales below the total', () => {
    const outcome = usePortal.getState().recordSale({
      lines: [{ menuItemId: 'combo-bolo', drinkChoice: 'tea-fizzy', qty: 1 }],
      payment: 'cash',
      cashReceived: 20000,
    })
    expect(outcome).toEqual({ ok: false, error: 'INSUFFICIENT_CASH' })
  })

  it('rejects items marked sold out via overrides', () => {
    usePortal.getState().updateSettings('anggrek', { soldOut: { 'combo-bolo': true } })
    const outcome = usePortal.getState().recordSale({
      lines: [{ menuItemId: 'combo-bolo', drinkChoice: 'tea-cloudy', qty: 1 }],
      payment: 'qris',
      cashReceived: null,
    })
    expect(outcome).toEqual({ ok: false, error: 'SOLD_OUT' })
    usePortal.getState().updateSettings('anggrek', { soldOut: {} })
  })

  it('voids a sale and restores stock, refusing double voids', () => {
    const before = Object.fromEntries(
      usePortal.getState().stock.map((row) => [row.stockItemId, row.qty]),
    )
    const outcome = usePortal.getState().recordSale({
      lines: [{ menuItemId: 'nachos-cheese', qty: 2 }],
      payment: 'qris',
      cashReceived: null,
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const voidOutcome = usePortal.getState().voidSale(outcome.sale.id, 'test void')
    expect(voidOutcome.ok).toBe(true)

    const after = Object.fromEntries(
      usePortal.getState().stock.map((row) => [row.stockItemId, row.qty]),
    )
    for (const id of ['chips', 'sauce-cheese', 'pack-food']) {
      expect(after[id]).toBe(before[id])
    }

    const second = usePortal.getState().voidSale(outcome.sale.id, 'again')
    expect(second).toEqual({ ok: false, error: 'ALREADY_VOIDED' })
  })

  it('restocks with weighted-average cost', () => {
    const state = usePortal.getState()
    const chips = state.stock.find((row) => row.stockItemId === 'chips')!
    state.restock('chips', 10, 9000)
    const updated = usePortal.getState().stock.find((row) => row.stockItemId === 'chips')!
    const expected = (chips.qty * chips.unitCost + 10 * 9000) / (chips.qty + 10)
    expect(updated.qty).toBe(chips.qty + 10)
    expect(updated.unitCost).toBeCloseTo(expected, 3)
    expect(usePortal.getState().movements[0].kind).toBe('restock')
  })

  it('logs waste as negative movement and floors at zero', () => {
    usePortal.getState().adjust('chips', -5, 'waste', 'stale')
    expect(usePortal.getState().movements[0]).toMatchObject({ kind: 'waste', delta: -5 })
    usePortal.getState().adjust('chips', -100000, 'waste')
    expect(usePortal.getState().stock.find((row) => row.stockItemId === 'chips')!.qty).toBe(0)
  })
})

describe('menu price integrity', () => {
  it('prices the demo sales from the menu table', () => {
    const sales = demoSales(OUTLETS_BY_SLUG['anggrek']).slice(0, 50)
    for (const sale of sales) {
      const expected = sale.items.reduce(
        (sum, item) => sum + MENU_BY_ID[item.menuItemId].price * item.qty,
        0,
      )
      expect(sale.total).toBe(expected)
    }
  })
})
