import type { DrinkKey, Outlet } from '../data/types'
import { MENU_ITEMS } from '../data/menu'
import { createPrng } from './prng'
import { dateKeyToUtc, wibParts } from './wib'

export interface SimSaleLine {
  menuItemId: string
  qty: number
  drinkChoice?: DrinkKey
}

export interface SimSale {
  lines: SimSaleLine[]
  createdAt: Date
  payment: 'cash' | 'qris'
  cashReceived: number | null
  voided: boolean
}

export interface VolumeProfile {
  base: number
  weekendMult: number
  profile: 'campus' | 'mall'
}

export const VOLUME_PROFILES: Record<string, VolumeProfile> = {
  anggrek: { base: 45, weekendMult: 0.4, profile: 'campus' },
  kemanggisan: { base: 26, weekendMult: 1.1, profile: 'campus' },
  'blok-m': { base: 30, weekendMult: 1.4, profile: 'mall' },
  'kelapa-gading': { base: 28, weekendMult: 1.5, profile: 'mall' },
  rawamangun: { base: 22, weekendMult: 1.0, profile: 'campus' },
  bsd: { base: 20, weekendMult: 1.3, profile: 'mall' },
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function hourWeight(profile: 'campus' | 'mall', hour: number): number {
  if (profile === 'campus') {
    if (hour === 12 || hour === 13) return 3
    if (hour === 15 || hour === 16) return 2.4
    if (hour === 10 || hour === 11) return 1.6
    if (hour === 14 || hour === 17) return 1.2
    return 0.4
  }
  if (hour === 12 || hour === 13) return 2.4
  if (hour >= 18 && hour <= 20) return 2.6
  if (hour === 16 || hour === 17) return 1.6
  if (hour === 11 || hour === 14 || hour === 15) return 1
  return 0.4
}

function openMinutesFor(outlet: Outlet, weekday: number): [number, number] | null {
  const day = outlet.hours[DAY_KEYS[weekday]]
  if (!day || day.closed) return null
  const [oh, om] = day.open.split(':').map(Number)
  const [ch, cm] = day.close.split(':').map(Number)
  return [oh * 60 + om, ch * 60 + cm]
}

function priceOf(menuItemId: string): number {
  return MENU_ITEMS.find((item) => item.id === menuItemId)?.price ?? 0
}

export function simulateSales(
  outlet: Outlet,
  options: { days: number; today?: Date },
): SimSale[] {
  const today = options.today ?? new Date()
  const volume = VOLUME_PROFILES[outlet.slug] ?? { base: 20, weekendMult: 1, profile: 'mall' as const }
  const sales: SimSale[] = []

  for (let daysAgo = options.days - 1; daysAgo >= 0; daysAgo--) {
    const dayInstant = new Date(dateKeyToUtc(wibDateKey(today)).getTime() - daysAgo * 86_400_000)
    const parts = wibParts(dayInstant)
    const openMinutes = openMinutesFor(outlet, parts.weekday)
    if (!openMinutes) continue

    const rng = createPrng(
      `${outlet.slug}:${parts.year}-${parts.month}-${parts.day}`,
    )
    const trend = 0.85 + 0.3 * ((options.days - daysAgo) / options.days)
    const promo = daysAgo === 6 ? 1.6 : 1
    const noise = 0.9 + rng() * 0.2
    const weekend = parts.weekday === 0 || parts.weekday === 6
    const expected = volume.base * (weekend ? volume.weekendMult : 1) * trend * promo * noise
    const count = Math.max(0, Math.round(expected))

    for (let i = 0; i < count; i++) {
      let minuteOfDay = 0
      for (let attempt = 0; attempt < 20; attempt++) {
        minuteOfDay =
          openMinutes[0] + Math.floor(rng() * (openMinutes[1] - openMinutes[0]))
        const hour = Math.floor(minuteOfDay / 60)
        if (rng() * 3 < hourWeight(volume.profile, hour)) break
      }

      const createdAt = new Date(
        dayInstant.getTime() + minuteOfDay * 60_000 + Math.floor(rng() * 60_000),
      )

      const lines: SimSaleLine[] = []
      const combo = rng() < 0.55
      if (combo) {
        const flavors = ['bolo', 'mush', 'cheese'] as const
        const flavor = flavors[Math.floor(rng() * flavors.length)]
        const drink: DrinkKey = rng() < 0.5 ? 'tea-cloudy' : 'tea-fizzy'
        lines.push({ menuItemId: `combo-${flavor}`, drinkChoice: drink, qty: rng() < 0.12 ? 2 : 1 })
        if (rng() < 0.18) lines.push({ menuItemId: 'tea-fizzy', qty: 1 })
      } else {
        const snackRoll = rng()
        const snack =
          snackRoll < 0.4 ? 'nachos-bolo' : snackRoll < 0.7 ? 'nachos-mush' : 'nachos-cheese'
        const drink: DrinkKey = rng() < 0.5 ? 'tea-cloudy' : 'tea-fizzy'
        if (rng() < 0.6) lines.push({ menuItemId: snack, qty: 1 })
        if (rng() < 0.7) lines.push({ menuItemId: drink, qty: 1 })
        if (lines.length === 0) lines.push({ menuItemId: snack, qty: 1 })
      }

      const total = lines.reduce((sum, line) => sum + priceOf(line.menuItemId) * line.qty, 0)
      const isQris = rng() < 0.65
      const cash = isQris ? null : Math.ceil(total / 1000) * 1000

      sales.push({
        lines,
        createdAt,
        payment: isQris ? 'qris' : 'cash',
        cashReceived: cash,
        voided: rng() < 0.01,
      })
    }
  }

  return sales
}

function wibDateKey(date: Date): string {
  const parts = wibParts(date)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}
