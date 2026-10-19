import type { RecipeLine } from './types'

export type RecipeMap = Record<string, RecipeLine[]>

export const RECIPES: RecipeMap = {
  'nachos-bolo': [
    { stockItemId: 'chips', qty: 1 },
    { stockItemId: 'sauce-bolo', qty: 1 },
    { stockItemId: 'pack-food', qty: 1 },
  ],
  'nachos-mush': [
    { stockItemId: 'chips', qty: 1 },
    { stockItemId: 'sauce-mush', qty: 1 },
    { stockItemId: 'pack-food', qty: 1 },
  ],
  'nachos-cheese': [
    { stockItemId: 'chips', qty: 1 },
    { stockItemId: 'sauce-cheese', qty: 1 },
    { stockItemId: 'pack-food', qty: 1 },
  ],
  'tea-cloudy': [
    { stockItemId: 'tea-bag', qty: 1 },
    { stockItemId: 'cheese-foam', qty: 1 },
    { stockItemId: 'pack-drink', qty: 1 },
  ],
  'tea-fizzy': [
    { stockItemId: 'tea-bag', qty: 1 },
    { stockItemId: 'fizzy-base', qty: 1 },
    { stockItemId: 'pack-drink', qty: 1 },
  ],
}

export const COMBO_PACKAGING_LINE: RecipeLine = { stockItemId: 'pack-stack', qty: 1 }
