import { MENU_BY_ID } from '@/data/menu'
import type { CartLine } from '@/store/cart'

export function cartTotals(lines: CartLine[]) {
  let total = 0
  let compareTotal = 0
  for (const line of lines) {
    const item = MENU_BY_ID[line.menuItemId]
    if (!item) continue
    total += item.price * line.qty
    compareTotal += (item.comparePrice ?? item.price) * line.qty
  }
  return { total, compareTotal, savings: compareTotal - total }
}
