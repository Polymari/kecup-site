import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DrinkKey } from '@/data/types'

export interface CartLine {
  lineId: string
  menuItemId: string
  qty: number
  drinkChoice?: DrinkKey
}

interface CartState {
  lines: CartLine[]
  add: (line: Omit<CartLine, 'lineId'>) => void
  setQty: (lineId: string, qty: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

function sameLine(line: CartLine, candidate: Omit<CartLine, 'lineId'>): boolean {
  return (
    line.menuItemId === candidate.menuItemId &&
    (line.drinkChoice ?? null) === (candidate.drinkChoice ?? null)
  )
}

function makeLineId(candidate: Omit<CartLine, 'lineId'>): string {
  return `${candidate.menuItemId}::${candidate.drinkChoice ?? 'default'}`
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (candidate) =>
        set((state) => {
          const existing = state.lines.find((line) => sameLine(line, candidate))
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.lineId === existing.lineId ? { ...line, qty: line.qty + candidate.qty } : line,
              ),
            }
          }
          return {
            lines: [...state.lines, { ...candidate, lineId: makeLineId(candidate) }],
          }
        }),
      setQty: (lineId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((line) => line.lineId !== lineId)
              : state.lines.map((line) => (line.lineId === lineId ? { ...line, qty } : line)),
        })),
      remove: (lineId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'kecup.cart' },
  ),
)
