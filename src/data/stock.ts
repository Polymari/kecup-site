import type { StockItem } from './types'

export const STOCK_ITEMS: StockItem[] = [
  { id: 'chips', nameKey: 'stock.items.chips', category: 'food', unit: 'portion' },
  { id: 'sauce-bolo', nameKey: 'stock.items.sauceBolo', category: 'food', unit: 'portion' },
  { id: 'sauce-mush', nameKey: 'stock.items.sauceMush', category: 'food', unit: 'portion' },
  { id: 'sauce-cheese', nameKey: 'stock.items.sauceCheese', category: 'food', unit: 'portion' },
  { id: 'tea-bag', nameKey: 'stock.items.teaBag', category: 'drink', unit: 'portion' },
  { id: 'cheese-foam', nameKey: 'stock.items.cheeseFoam', category: 'drink', unit: 'portion' },
  { id: 'fizzy-base', nameKey: 'stock.items.fizzyBase', category: 'drink', unit: 'portion' },
  { id: 'pack-food', nameKey: 'stock.items.packFood', category: 'packaging', unit: 'piece' },
  { id: 'pack-drink', nameKey: 'stock.items.packDrink', category: 'packaging', unit: 'piece' },
  { id: 'pack-stack', nameKey: 'stock.items.packStack', category: 'packaging', unit: 'set' },
]

export const STOCK_BY_ID: Record<string, StockItem> = Object.fromEntries(
  STOCK_ITEMS.map((item) => [item.id, item]),
)

export function isPackaging(stockItemId: string): boolean {
  return STOCK_BY_ID[stockItemId]?.category === 'packaging'
}
