/**
 * KeCup demo seed — run with `npm run seed` (needs .env.local).
 * Uses the service-role key, server-side only. Idempotent upserts; pass
 * --reset to wipe sales/movements/overrides first. All timestamps are
 * converted from Asia/Jakarta wall-clock times to UTC instants.
 */
import { createClient } from '@supabase/supabase-js'
import { MENU_ITEMS } from '../src/data/menu'
import { STOCK_ITEMS } from '../src/data/stock'
import { COMBO_PACKAGING_LINE, RECIPES } from '../src/data/recipes'
import { OUTLETS, OUTLET_STOCK_LEVELS } from '../src/data/outlets'
import type { DayKey, DrinkKey } from '../src/data/types'
import { createPrng } from '../src/lib/prng'
import { computeCogs } from '../src/lib/recipes'
import { outletAvailability } from '../src/lib/availability'
import { dateKeyToUtc, wibParts } from '../src/lib/wib'
import en from '../src/i18n/en.json'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD
const DEMO_EMAIL = process.env.VITE_DEMO_LOGIN_EMAIL ?? 'anggrek.franchisee@example.com'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'seed: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY must be set in .env.local',
  )
  process.exit(2)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const RESET = process.argv.includes('--reset')
const DAYS = 30

interface VolumeProfile {
  base: number
  weekendMult: number
  profile: 'campus' | 'mall'
}

const VOLUMES: Record<string, VolumeProfile> = {
  anggrek: { base: 45, weekendMult: 0.4, profile: 'campus' },
  kemanggisan: { base: 26, weekendMult: 1.1, profile: 'campus' },
  'blok-m': { base: 30, weekendMult: 1.4, profile: 'mall' },
  'kelapa-gading': { base: 28, weekendMult: 1.5, profile: 'mall' },
  rawamangun: { base: 22, weekendMult: 1.0, profile: 'campus' },
  bsd: { base: 20, weekendMult: 1.3, profile: 'mall' },
}

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

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function openHoursFor(outlet: (typeof OUTLETS)[number], weekday: number): Array<[number, number]> {
  const day = outlet.hours[DAY_KEYS[weekday]]
  if (!day || day.closed) return []
  const [oh, om] = day.open.split(':').map(Number)
  const [ch, cm] = day.close.split(':').map(Number)
  return [[oh * 60 + om, ch * 60 + cm]]
}

function toRow(menuItemId: string, drinkChoice: string | undefined, qty: number) {
  return { menu_item_id: menuItemId, drink_choice: drinkChoice, qty }
}

async function main(): Promise<void> {
  console.log('seed: starting…')

  if (RESET) {
    for (const table of ['sale_items', 'sales', 'stock_movements', 'menu_overrides']) {
      const { error } = await db.from(table).delete().neq('id', '')
      if (error && table !== 'sale_items') {
        const { error: alt } = await db.from(table).delete().gte('updated_at', '1970-01-01')
        if (alt) console.warn(`seed: could not clear ${table}: ${alt.message}`)
      }
    }
    console.log('seed: reset complete')
  }

  // Brand-level reference data --------------------------------------------
  const menuNames = en.menu.items as Record<string, { name: string }>
  const { error: menuError } = await db.from('menu_items').upsert(
    MENU_ITEMS.map((item) => ({
      id: item.id,
      kind: item.kind,
      name: menuNames[item.nameKey.replace(/^menu\.items\./, '').replace(/\.name$/, '')].name,
      price: item.price,
      compare_price: item.comparePrice ?? null,
      flavor_key: item.flavorKey ?? null,
      drink_key: item.drinkKey ?? null,
      photo_key: item.photoKey,
      sort_order: item.sortOrder,
      active: true,
    })),
  )
  if (menuError) throw new Error(`menu_items: ${menuError.message}`)

  const { error: stockError } = await db.from('stock_items').upsert(
    STOCK_ITEMS.map((item) => ({
      id: item.id,
      name: item.id,
      category: item.category,
      unit: item.unit,
    })),
  )
  if (stockError) throw new Error(`stock_items: ${stockError.message}`)

  const recipeRows = Object.entries(RECIPES).flatMap(([menuItemId, lines]) =>
    lines.map((line) => ({
      menu_item_id: menuItemId,
      stock_item_id: line.stockItemId,
      qty: line.qty,
    })),
  )
  for (const item of MENU_ITEMS.filter((entry) => entry.kind === 'combo')) {
    recipeRows.push({
      menu_item_id: item.id,
      stock_item_id: COMBO_PACKAGING_LINE.stockItemId,
      qty: COMBO_PACKAGING_LINE.qty,
    })
  }
  const { error: recipeError } = await db.from('recipe_lines').upsert(recipeRows)
  if (recipeError) throw new Error(`recipe_lines: ${recipeError.message}`)

  // Outlets ---------------------------------------------------------------
  const { data: outletRows, error: outletError } = await db
    .from('outlets')
    .upsert(
      OUTLETS.map((outlet) => ({
        slug: outlet.slug,
        name: outlet.name,
        area: outlet.area,
        address: outlet.address,
        maps_query: outlet.mapsQuery,
        whatsapp: outlet.whatsapp,
        instagram: outlet.instagram,
        hours: outlet.hours,
        line_order: outlet.lineOrder,
        is_flagship: outlet.isFlagship,
        temporarily_closed: false,
      })),
      { onConflict: 'slug' },
    )
    .select('id, slug')
  if (outletError) throw new Error(`outlets: ${outletError.message}`)

  const outletIdBySlug = new Map<string, string>()
  for (const row of outletRows ?? []) {
    outletIdBySlug.set(row.slug, row.id)
  }
  for (const outlet of OUTLETS) {
    if (!outletIdBySlug.has(outlet.slug)) {
      throw new Error(`outlets: missing returned id for slug ${outlet.slug}`)
    }
  }

  // Demo franchisee + membership -----------------------------------------
  let demoUserId: string | null = null
  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 })
  const existing = users?.users.find((user) => user.email === DEMO_EMAIL)
  if (existing) {
    demoUserId = existing.id
    if (DEMO_PASSWORD) {
      await db.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD })
    }
  } else if (DEMO_PASSWORD) {
    const { data: created, error } = await db.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`create demo user: ${error.message}`)
    demoUserId = created.user.id
  } else {
    console.warn('seed: SEED_DEMO_PASSWORD not set — skipping demo user')
  }

  if (demoUserId) {
    const { error } = await db.from('outlet_members').upsert({
      outlet_id: outletIdBySlug.get('anggrek'),
      user_id: demoUserId,
      role: 'owner',
    })
    if (error) throw new Error(`outlet_members: ${error.message}`)
  }

  // Stock levels + seed movements ----------------------------------------
  const stockRows = OUTLET_STOCK_LEVELS.map((level) => ({
    outlet_id: outletIdBySlug.get(level.outletSlug),
    stock_item_id: level.stockItemId,
    qty: level.qty,
    low_threshold: level.lowThreshold,
    unit_cost: level.unitCost,
  }))
  const { error: stockLevelError } = await db
    .from('outlet_stock')
    .upsert(stockRows, { onConflict: 'outlet_id,stock_item_id' })
  if (stockLevelError) throw new Error(`outlet_stock: ${stockLevelError.message}`)

  const { error: seedMoveError } = await db.from('stock_movements').insert(
    OUTLET_STOCK_LEVELS.map((level) => ({
      outlet_id: outletIdBySlug.get(level.outletSlug),
      stock_item_id: level.stockItemId,
      kind: 'seed',
      delta: level.qty,
      note: 'seed',
    })),
  )
  if (seedMoveError) throw new Error(`seed movements: ${seedMoveError.message}`)

  // Stock-based sold-out overrides ---------------------------------------
  const overrideRows: Array<{ outlet_id: string; menu_item_id: string; sold_out: boolean }> = []
  for (const outlet of OUTLETS) {
    const { availability } = outletAvailability(outlet.slug)
    for (const [menuItemId, available] of Object.entries(availability)) {
      if (!available) {
        overrideRows.push({
          outlet_id: outletIdBySlug.get(outlet.slug)!,
          menu_item_id: menuItemId,
          sold_out: true,
        })
      }
    }
  }
  if (overrideRows.length) {
    const { error } = await db.from('menu_overrides').upsert(overrideRows)
    if (error) throw new Error(`menu_overrides: ${error.message}`)
  }

  // Synthetic sales history ----------------------------------------------
  const today = new Date()
  const todayKey = `${today.toISOString().slice(0, 10)}`

  interface SaleRow {
    id: string
    outlet_id: string
    cashier_id: string | null
    payment_method: 'cash' | 'qris'
    total: number
    cogs: number
    cash_received: number | null
    change_due: number | null
    voided: boolean
    void_reason: string | null
    created_at: string
  }
  interface SaleItemRow {
    sale_id: string
    menu_item_id: string
    drink_choice: string | null
    qty: number
    unit_price: number
    line_cogs: number
  }

  const saleRows: SaleRow[] = []
  const saleItemRows: SaleItemRow[] = []
  let voidCount = 0

  for (const outlet of OUTLETS) {
    const volume = VOLUMES[outlet.slug]
    const unitCosts: Record<string, number> = {}
    for (const level of OUTLET_STOCK_LEVELS.filter((l) => l.outletSlug === outlet.slug)) {
      unitCosts[level.stockItemId] = level.unitCost
    }

    for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
      const daySeed = new Date(dateKeyToUtc(todayKey).getTime() - daysAgo * 86_400_000)
      const parts = wibParts(daySeed)
      const weekday = parts.weekday
      const hours = openHoursFor(outlet, weekday)
      if (hours.length === 0) continue

      const rng = createPrng(`${outlet.slug}:${parts.year}-${parts.month}-${parts.day}`)
      const trend = 0.85 + 0.3 * ((DAYS - daysAgo) / DAYS)
      const promo = daysAgo === 6 ? 1.6 : 1
      const noise = 0.9 + rng() * 0.2
      const weekend = weekday === 0 || weekday === 6
      const expected =
        volume.base * (weekend ? volume.weekendMult : 1) * trend * promo * noise
      const count = Math.max(0, Math.round(expected))

      for (let i = 0; i < count; i++) {
        // Pick an open minute weighted by the outlet profile.
        let minuteOfDay = 0
        for (let attempt = 0; attempt < 20; attempt++) {
          const [openMin, closeMin] = hours[0]
          minuteOfDay = openMin + Math.floor(rng() * (closeMin - openMin))
          const hour = Math.floor(minuteOfDay / 60)
          const accept = rng() * 3 < hourWeight(volume.profile, hour)
          if (accept) break
        }

        const createdAt = new Date(
          dateKeyToUtc(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`).getTime() +
            minuteOfDay * 60_000 +
            Math.floor(rng() * 60_000),
        )

        const lines = []
        const combo = rng() < 0.55
        if (combo) {
          const flavors = ['bolo', 'mush', 'cheese'] as const
          const flavor = flavors[Math.floor(rng() * flavors.length)]
          const drink: DrinkKey = rng() < 0.5 ? 'tea-cloudy' : 'tea-fizzy'
          lines.push(toRow(`combo-${flavor}`, drink, rng() < 0.12 ? 2 : 1))
          if (rng() < 0.18) lines.push(toRow('tea-fizzy', undefined, 1))
        } else {
          const snackRoll = rng()
          const snack =
            snackRoll < 0.4 ? 'nachos-bolo' : snackRoll < 0.7 ? 'nachos-mush' : 'nachos-cheese'
          const drink: DrinkKey = rng() < 0.5 ? 'tea-cloudy' : 'tea-fizzy'
          if (rng() < 0.6) lines.push(toRow(snack, undefined, 1))
          if (rng() < 0.7) lines.push(toRow(drink, undefined, 1))
          if (lines.length === 0) lines.push(toRow(snack, undefined, 1))
        }

        const total = lines.reduce((sum, line) => {
          const item = MENU_ITEMS.find((entry) => entry.id === line.menu_item_id)!
          return sum + item.price * line.qty
        }, 0)
        const cogs = computeCogs(
          lines.map((line) => ({
            menuItemId: line.menu_item_id,
            qty: line.qty,
            drinkChoice: line.drink_choice as DrinkKey | undefined,
          })),
          unitCosts,
        )
        const isQris = rng() < 0.65
        const cash = isQris ? null : Math.ceil(total / 1000) * 1000
        const voided = rng() < 0.01
        if (voided) voidCount += 1

        const saleId = crypto.randomUUID()
        saleRows.push({
          id: saleId,
          outlet_id: outletIdBySlug.get(outlet.slug)!,
          cashier_id: demoUserId,
          payment_method: isQris ? 'qris' : 'cash',
          total,
          cogs,
          cash_received: cash,
          change_due: cash === null ? null : cash - total,
          voided,
          void_reason: voided ? 'Seeded void (demo)' : null,
          created_at: createdAt.toISOString(),
        })
        for (const line of lines) {
          const item = MENU_ITEMS.find((entry) => entry.id === line.menu_item_id)!
          saleItemRows.push({
            sale_id: saleId,
            menu_item_id: line.menu_item_id,
            drink_choice: line.drink_choice ?? null,
            qty: line.qty,
            unit_price: item.price,
            line_cogs: computeCogs(
              [
                {
                  menuItemId: line.menu_item_id,
                  qty: line.qty,
                  drinkChoice: line.drink_choice as DrinkKey | undefined,
                },
              ],
              unitCosts,
            ),
          })
        }
      }
    }
  }

  for (let i = 0; i < saleRows.length; i += 250) {
    const { error } = await db.from('sales').insert(saleRows.slice(i, i + 250))
    if (error) throw new Error(`sales: ${error.message}`)
  }
  for (let i = 0; i < saleItemRows.length; i += 500) {
    const { error } = await db.from('sale_items').insert(saleItemRows.slice(i, i + 500))
    if (error) throw new Error(`sale_items: ${error.message}`)
  }

  // Summary ---------------------------------------------------------------
  const revenue = saleRows.filter((row) => !row.voided).reduce((sum, row) => sum + row.total, 0)
  const cogs = saleRows.filter((row) => !row.voided).reduce((sum, row) => sum + row.cogs, 0)

  console.log('seed: done')
  console.log(`  outlets:        ${OUTLETS.length}`)
  console.log(`  menu items:     ${MENU_ITEMS.length}`)
  console.log(`  stock items:    ${STOCK_ITEMS.length}`)
  console.log(`  sales:          ${saleRows.length} (${voidCount} voided)`)
  console.log(`  sale items:     ${saleItemRows.length}`)
  console.log(`  revenue:        Rp ${Math.round(revenue).toLocaleString('id-ID')}`)
  console.log(`  cogs:           Rp ${Math.round(cogs).toLocaleString('id-ID')}`)
  console.log(`  demo login:     ${DEMO_EMAIL}`)
  if (DEMO_PASSWORD) console.log(`  demo password:  (from SEED_DEMO_PASSWORD)`)
}

main().catch((error) => {
  console.error(`seed: failed — ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
