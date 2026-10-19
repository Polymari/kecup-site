export interface CostingLine {
  labelKey: string
  cost: number
  estimate?: boolean
}

export interface CostingEntry {
  stockItemId: string
  nameKey: string
  yield: number
  lines: CostingLine[]
  estimate?: boolean
}

export const COSTING: CostingEntry[] = [
  {
    stockItemId: 'chips',
    nameKey: 'costing.chips',
    yield: 1,
    lines: [{ labelKey: 'costing.lines.tortillaChips', cost: 7000 }],
  },
  {
    stockItemId: 'sauce-bolo',
    nameKey: 'costing.sauceBolo',
    yield: 6,
    lines: [
      { labelKey: 'costing.lines.sauceBase', cost: 24000 },
      { labelKey: 'costing.lines.mincedBeef', cost: 18000 },
      { labelKey: 'costing.lines.onion', cost: 2400 },
    ],
  },
  {
    stockItemId: 'sauce-mush',
    nameKey: 'costing.sauceMush',
    yield: 6,
    lines: [
      { labelKey: 'costing.lines.onion', cost: 1500 },
      { labelKey: 'costing.lines.garlic', cost: 500 },
      { labelKey: 'costing.lines.margarine', cost: 2000 },
      { labelKey: 'costing.lines.mushroom', cost: 9450 },
      { labelKey: 'costing.lines.milk', cost: 3000 },
      { labelKey: 'costing.lines.flour', cost: 1000 },
    ],
  },
  {
    stockItemId: 'sauce-cheese',
    nameKey: 'costing.sauceCheese',
    yield: 6,
    lines: [
      { labelKey: 'costing.lines.cheeseBlock', cost: 8000 },
      { labelKey: 'costing.lines.milk', cost: 2100 },
      { labelKey: 'costing.lines.margarine', cost: 1000 },
    ],
  },
  {
    stockItemId: 'tea-bag',
    nameKey: 'costing.teaBag',
    yield: 1,
    lines: [{ labelKey: 'costing.lines.teaBag', cost: 240 }],
  },
  {
    stockItemId: 'cheese-foam',
    nameKey: 'costing.cheeseFoam',
    yield: 8,
    lines: [
      { labelKey: 'costing.lines.creamCheese', cost: 12000 },
      { labelKey: 'costing.lines.whippingCream', cost: 5600 },
      { labelKey: 'costing.lines.milk', cost: 2400 },
      { labelKey: 'costing.lines.salt', cost: 800 },
    ],
  },
  {
    stockItemId: 'fizzy-base',
    nameKey: 'costing.fizzyBase',
    yield: 1,
    estimate: true,
    lines: [{ labelKey: 'costing.lines.lemonSodaBase', cost: 2600, estimate: true }],
  },
  {
    stockItemId: 'pack-food',
    nameKey: 'costing.packFood',
    yield: 1,
    lines: [{ labelKey: 'costing.lines.foodTray', cost: 1500 }],
  },
  {
    stockItemId: 'pack-drink',
    nameKey: 'costing.packDrink',
    yield: 1,
    lines: [{ labelKey: 'costing.lines.drinkCupSet', cost: 2000 }],
  },
  {
    stockItemId: 'pack-stack',
    nameKey: 'costing.packStack',
    yield: 1,
    lines: [
      { labelKey: 'costing.lines.foodTray', cost: 1500 },
      { labelKey: 'costing.lines.drinkCupSet', cost: 2000 },
    ],
  },
]

export const COSTING_BY_STOCK_ID: Record<string, CostingEntry> = Object.fromEntries(
  COSTING.map((entry) => [entry.stockItemId, entry]),
)

export function batchTotal(entry: CostingEntry): number {
  return entry.lines.reduce((sum, line) => sum + line.cost, 0)
}

export function perPortionCost(entry: CostingEntry): number {
  return batchTotal(entry) / entry.yield
}

export function roundedPortionCost(entry: CostingEntry): number {
  return Math.round(perPortionCost(entry) / 100) * 100
}

// The team's stated per-portion costs (DATA-MODEL §2) — the figures every HPP
// reconciliation uses. Batch math above approximates these; mushroom is the
// only one the team hand-rounded (2.908 → 2.900).
export const DEFAULT_UNIT_COSTS: Record<string, number> = {
  chips: 7000,
  'sauce-bolo': 7400,
  'sauce-mush': 2900,
  'sauce-cheese': 1850,
  'tea-bag': 240,
  'cheese-foam': 2600,
  'fizzy-base': 2600,
  'pack-food': 1500,
  'pack-drink': 2000,
  'pack-stack': 3500,
}
