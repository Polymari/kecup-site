import { MENU_BY_ID } from '../data/menu'
import { COMBO_PACKAGING_LINE, RECIPES } from '../data/recipes'
import { isPackaging } from '../data/stock'
import type { OrderLine, RecipeLine } from '../data/types'

export interface Requirement {
  stockItemId: string
  qty: number
}

function scaled(lines: RecipeLine[], qty: number): RecipeLine[] {
  return lines.map((line) => ({ stockItemId: line.stockItemId, qty: line.qty * qty }))
}

export function expandLine(line: OrderLine): RecipeLine[] {
  const item = MENU_BY_ID[line.menuItemId]
  if (!item) throw new Error(`Unknown menu item: ${line.menuItemId}`)

  if (item.kind !== 'combo') {
    const recipe = RECIPES[item.id]
    if (!recipe) throw new Error(`Missing recipe for: ${item.id}`)
    return scaled(recipe, line.qty)
  }

  const snackRecipe = RECIPES[item.snackId ?? '']
  if (!snackRecipe) throw new Error(`Missing snack recipe for combo: ${item.id}`)

  const drinkChoice = line.drinkChoice ?? item.drinkChoices?.[0]
  const drinkItem = drinkChoice ? MENU_BY_ID[drinkChoice] : undefined
  if (!drinkItem || drinkItem.kind !== 'drink') {
    throw new Error(`Combo ${item.id} needs a valid drink choice`)
  }
  const drinkRecipe = RECIPES[drinkItem.id]
  if (!drinkRecipe) throw new Error(`Missing drink recipe for: ${drinkItem.id}`)

  const nonPackaging = [...snackRecipe, ...drinkRecipe].filter(
    (recipeLine) => !isPackaging(recipeLine.stockItemId),
  )
  return scaled([...nonPackaging, COMBO_PACKAGING_LINE], line.qty)
}

export function expandRequirements(lines: OrderLine[]): Requirement[] {
  const totals = new Map<string, number>()
  for (const line of lines) {
    for (const expanded of expandLine(line)) {
      totals.set(expanded.stockItemId, (totals.get(expanded.stockItemId) ?? 0) + expanded.qty)
    }
  }
  return [...totals.entries()]
    .map(([stockItemId, qty]) => ({ stockItemId, qty }))
    .sort((a, b) => a.stockItemId.localeCompare(b.stockItemId))
}

export function computeCogs(lines: OrderLine[], unitCosts: Record<string, number>): number {
  return expandRequirements(lines).reduce(
    (sum, requirement) => sum + requirement.qty * (unitCosts[requirement.stockItemId] ?? 0),
    0,
  )
}

export function fulfilCheck(onHand: Record<string, number>, lines: OrderLine[]): boolean {
  return expandRequirements(lines).every(
    (requirement) => (onHand[requirement.stockItemId] ?? 0) >= requirement.qty,
  )
}

export function checkAvailability(
  flags: Record<string, boolean>,
  soldOutOverrides: Record<string, boolean>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {}

  for (const [itemId, item] of Object.entries(MENU_BY_ID)) {
    if (soldOutOverrides[itemId]) {
      result[itemId] = false
      continue
    }

    if (item.kind !== 'combo') {
      const recipe = RECIPES[itemId] ?? []
      result[itemId] = recipe.every((line) => flags[line.stockItemId] === true)
      continue
    }

    result[itemId] = item.drinkChoices?.some((drinkChoice) =>
      isChoiceAvailable(itemId, drinkChoice, flags),
    ) ?? false
  }

  return result
}

export function isChoiceAvailable(
  comboId: string,
  drinkChoice: string,
  flags: Record<string, boolean>,
): boolean {
  const item = MENU_BY_ID[comboId]
  if (!item || item.kind !== 'combo') return false

  let lines: RecipeLine[]
  try {
    lines = expandLine({ menuItemId: comboId, qty: 1, drinkChoice: drinkChoice as never })
  } catch {
    return false
  }
  return lines.every((line) => flags[line.stockItemId] === true)
}
