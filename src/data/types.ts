export type MenuKind = 'snack' | 'drink' | 'combo'
export type FlavorKey = 'bolo' | 'mush' | 'cheese'
export type DrinkKey = 'tea-cloudy' | 'tea-fizzy'
export type StockCategory = 'food' | 'drink' | 'packaging'
export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface MenuItem {
  id: string
  kind: MenuKind
  nameKey: string
  descKey: string
  price: number
  comparePrice?: number
  flavorKey?: FlavorKey
  drinkKey?: DrinkKey
  snackId?: string
  drinkChoices?: DrinkKey[]
  photoKey: string
  sortOrder: number
}

export interface StockItem {
  id: string
  nameKey: string
  category: StockCategory
  unit: 'portion' | 'piece' | 'set'
}

export interface RecipeLine {
  stockItemId: string
  qty: number
}

export interface OrderLine {
  menuItemId: string
  qty: number
  drinkChoice?: DrinkKey
}

export interface OutletHoursDay {
  open: string
  close: string
  closed?: boolean
}

export type OutletHours = Record<DayKey, OutletHoursDay>

export interface Outlet {
  id: string
  slug: string
  name: string
  area: string
  address: string
  mapsQuery: string
  whatsapp: string
  instagram: string
  hours: OutletHours
  lineOrder: number
  isFlagship: boolean
  temporarilyClosed?: boolean
}

export interface OutletStockLevel {
  outletSlug: string
  stockItemId: string
  qty: number
  lowThreshold: number
  unitCost: number
}
