import type { MenuItem } from './types'

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'nachos-bolo',
    kind: 'snack',
    nameKey: 'menu.items.nachosBolo.name',
    descKey: 'menu.items.nachosBolo.desc',
    price: 25000,
    flavorKey: 'bolo',
    photoKey: 'nachos-bolo',
    sortOrder: 10,
  },
  {
    id: 'nachos-mush',
    kind: 'snack',
    nameKey: 'menu.items.nachosMush.name',
    descKey: 'menu.items.nachosMush.desc',
    price: 20000,
    flavorKey: 'mush',
    photoKey: 'nachos-mush',
    sortOrder: 20,
  },
  {
    id: 'nachos-cheese',
    kind: 'snack',
    nameKey: 'menu.items.nachosCheese.name',
    descKey: 'menu.items.nachosCheese.desc',
    price: 17000,
    flavorKey: 'cheese',
    photoKey: 'nachos-cheese',
    sortOrder: 30,
  },
  {
    id: 'tea-cloudy',
    kind: 'drink',
    nameKey: 'menu.items.teaCloudy.name',
    descKey: 'menu.items.teaCloudy.desc',
    price: 17000,
    drinkKey: 'tea-cloudy',
    photoKey: 'tea-cloudy',
    sortOrder: 40,
  },
  {
    id: 'tea-fizzy',
    kind: 'drink',
    nameKey: 'menu.items.teaFizzy.name',
    descKey: 'menu.items.teaFizzy.desc',
    price: 17000,
    drinkKey: 'tea-fizzy',
    photoKey: 'tea-fizzy',
    sortOrder: 50,
  },
  {
    id: 'combo-bolo',
    kind: 'combo',
    nameKey: 'menu.items.comboBolo.name',
    descKey: 'menu.items.comboBolo.desc',
    price: 35000,
    comparePrice: 42000,
    flavorKey: 'bolo',
    snackId: 'nachos-bolo',
    drinkChoices: ['tea-cloudy', 'tea-fizzy'],
    photoKey: 'combo-bolo',
    sortOrder: 60,
  },
  {
    id: 'combo-mush',
    kind: 'combo',
    nameKey: 'menu.items.comboMush.name',
    descKey: 'menu.items.comboMush.desc',
    price: 31000,
    comparePrice: 37000,
    flavorKey: 'mush',
    snackId: 'nachos-mush',
    drinkChoices: ['tea-cloudy', 'tea-fizzy'],
    photoKey: 'combo-mush',
    sortOrder: 70,
  },
  {
    id: 'combo-cheese',
    kind: 'combo',
    nameKey: 'menu.items.comboCheese.name',
    descKey: 'menu.items.comboCheese.desc',
    price: 28000,
    comparePrice: 34000,
    flavorKey: 'cheese',
    snackId: 'nachos-cheese',
    drinkChoices: ['tea-cloudy', 'tea-fizzy'],
    photoKey: 'combo-cheese',
    sortOrder: 80,
  },
]

export const MENU_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU_ITEMS.map((item) => [item.id, item]),
)

export function getMenuItem(id: string): MenuItem {
  const item = MENU_BY_ID[id]
  if (!item) throw new Error(`Unknown menu item: ${id}`)
  return item
}

export function itemsByKind(kind: MenuItem['kind']): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.kind === kind)
}
