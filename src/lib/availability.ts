import { MENU_ITEMS } from '../data/menu'
import { OUTLET_STOCK_LEVELS } from '../data/outlets'
import type { DrinkKey } from '../data/types'
import { checkAvailability, expandLine } from './recipes'

export function computeStockFlags(onHand: Record<string, number>): Record<string, boolean> {
  const maxRequirement = new Map<string, number>()

  for (const item of MENU_ITEMS) {
    const choices: (DrinkKey | undefined)[] =
      item.kind === 'combo' ? (item.drinkChoices ?? [undefined]) : [undefined]
    for (const drinkChoice of choices) {
      for (const line of expandLine({ menuItemId: item.id, qty: 1, drinkChoice })) {
        const current = maxRequirement.get(line.stockItemId) ?? 0
        if (line.qty > current) maxRequirement.set(line.stockItemId, line.qty)
      }
    }
  }

  const flags: Record<string, boolean> = {}
  for (const [stockItemId, requirement] of maxRequirement) {
    flags[stockItemId] = (onHand[stockItemId] ?? 0) >= requirement
  }
  return flags
}

export function onHandForOutlet(outletSlug: string): Record<string, number> {
  const onHand: Record<string, number> = {}
  for (const level of OUTLET_STOCK_LEVELS) {
    if (level.outletSlug === outletSlug) onHand[level.stockItemId] = level.qty
  }
  return onHand
}

export interface OutletAvailability {
  onHand: Record<string, number>
  flags: Record<string, boolean>
  availability: Record<string, boolean>
}

export function outletAvailability(
  outletSlug: string,
  soldOutOverrides: Record<string, boolean> = {},
): OutletAvailability {
  const onHand = onHandForOutlet(outletSlug)
  const flags = computeStockFlags(onHand)
  return { onHand, flags, availability: checkAvailability(flags, soldOutOverrides) }
}
