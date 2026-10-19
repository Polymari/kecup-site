/**
 * KeCup backend verification — run with `npm run verify:backend`.
 * Signs in with the PUBLISHABLE key + demo credentials and asserts the
 * security model holds. Exits non-zero on any failure.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_UNIT_COSTS } from '../src/data/costing'
import { computeCogs } from '../src/lib/recipes'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
const DEMO_EMAIL = process.env.VITE_DEMO_LOGIN_EMAIL ?? 'anggrek.franchisee@example.com'
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? process.env.VITE_DEMO_LOGIN_PASSWORD ?? ''

if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
  console.error('verify: SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env.local')
  process.exit(2)
}
if (!DEMO_PASSWORD) {
  console.error('verify: SEED_DEMO_PASSWORD (or VITE_DEMO_LOGIN_PASSWORD) must be set')
  process.exit(2)
}

const anon: SupabaseClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const demo: SupabaseClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const results: Array<{ name: string; ok: boolean; detail?: string }> = []

function report(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main(): Promise<void> {
  // 1. Anonymous read model -----------------------------------------------
  const { data: outlets, error: outletsError } = await anon.from('outlets').select('id, slug')
  report('anon can read outlets', !outletsError && (outlets?.length ?? 0) > 0, outletsError?.message)

  const { data: flags, error: flagsError } = await anon.rpc('get_outlet_stock_flags', {
    p_slug: 'anggrek',
  })
  report(
    'anon can read stock flags (booleans only)',
    !flagsError && Array.isArray(flags) && flags.length > 0 && flags.every((row) => typeof row.in_stock === 'boolean'),
    flagsError?.message,
  )

  const { data: anonSales, error: anonSalesError } = await anon.from('sales').select('id')
  report(
    'anon cannot read sales',
    !anonSalesError && (anonSales?.length ?? 0) === 0,
    anonSalesError?.message ?? `rows: ${anonSales?.length ?? 0}`,
  )

  // 2. Demo user sign-in + tenant isolation --------------------------------
  const { data: session, error: signInError } = await demo.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  report('demo user can sign in', !signInError && Boolean(session.user), signInError?.message)
  if (signInError) {
    finish()
    return
  }

  const anggrek = outlets?.find((outlet) => outlet.slug === 'anggrek')
  const otherOutlet = outlets?.find((outlet) => outlet.slug === 'blok-m')
  if (!anggrek || !otherOutlet) {
    report('outlets present', false, 'anggrek/blok-m missing — run the seed first')
    finish()
    return
  }

  const { data: ownSales, error: ownError } = await demo
    .from('sales')
    .select('id')
    .eq('outlet_id', anggrek.id)
  report('member sees own outlet sales', !ownError && (ownSales?.length ?? 0) > 0, ownError?.message)

  const { data: crossSales, error: crossError } = await demo
    .from('sales')
    .select('id')
    .eq('outlet_id', otherOutlet.id)
  report(
    'cross-tenant sales read is empty',
    !crossError && (crossSales?.length ?? 0) === 0,
    crossError?.message ?? `rows: ${crossSales?.length ?? 0}`,
  )

  // 3 + 4. record_sale decrements stock and computes COGS server-side ------
  const orderLines = [{ menuItemId: 'nachos-cheese', qty: 1 }]
  const items = [{ menu_item_id: 'nachos-cheese', qty: 1 }]
  const expectedCogs = computeCogs(orderLines, DEFAULT_UNIT_COSTS)

  const before = await stockSnapshot(demo, anggrek.id)

  const { data: saleData, error: saleError } = await demo.rpc('record_sale', {
    p_outlet: anggrek.id,
    p_payment: 'cash',
    p_cash: 50000,
    p_items: items,
  })
  report('record_sale succeeds', !saleError, saleError?.message)

  if (!saleError && saleData) {
    const payload = saleData as { sale_id: string; total: number; cogs: number; change_due: number }
    report(
      'server-side totals are correct',
      Number(payload.total) === 17000 && Number(payload.change_due) === 33000,
      `total=${payload.total} change=${payload.change_due}`,
    )

    report(
      'COGS matches computeCogs',
      Math.abs(Number(payload.cogs) - expectedCogs) < 1,
      `rpc=${payload.cogs} ts=${expectedCogs}`,
    )

    const after = await stockSnapshot(demo, anggrek.id)
    const deltas = ['chips', 'sauce-cheese', 'pack-food'].map(
      (item) => (before[item] ?? 0) - (after[item] ?? 0),
    )
    report(
      'record_sale decrements exact ingredients',
      deltas.every((delta) => delta === 1),
      `deltas=${JSON.stringify(deltas)}`,
    )

    // 5. void_sale restores stock ------------------------------------------
    const { error: voidError } = await demo.rpc('void_sale', {
      p_sale: payload.sale_id,
      p_reason: 'verify-backend',
    })
    report('void_sale succeeds', !voidError, voidError?.message)

    const restored = await stockSnapshot(demo, anggrek.id)
    report(
      'void restores stock',
      ['chips', 'sauce-cheese', 'pack-food'].every(
        (item) => Math.abs((restored[item] ?? 0) - (before[item] ?? 0)) < 0.001,
      ),
      JSON.stringify(restored),
    )

    const { error: doubleVoid } = await demo.rpc('void_sale', {
      p_sale: payload.sale_id,
      p_reason: 'verify-backend-again',
    })
    report(
      'double void is rejected',
      Boolean(doubleVoid) && (doubleVoid?.message ?? '').includes('ALREADY_VOIDED'),
      doubleVoid?.message,
    )
  }

  // 6. Cross-tenant write is rejected --------------------------------------
  const { error: crossWrite } = await demo.rpc('record_sale', {
    p_outlet: otherOutlet.id,
    p_payment: 'cash',
    p_cash: 50000,
    p_items: [{ menu_item_id: 'tea-fizzy', qty: 1 }],
  })
  report(
    'cross-tenant record_sale is rejected',
    Boolean(crossWrite) && (crossWrite?.message ?? '').includes('NOT_AUTHORIZED'),
    crossWrite?.message,
  )

  // 7. Direct qty updates are blocked by column grants ---------------------
  const { error: directUpdate } = await demo
    .from('outlet_stock')
    .update({ qty: 99999 })
    .eq('outlet_id', anggrek.id)
    .eq('stock_item_id', 'chips')
  report(
    'direct outlet_stock qty update is blocked',
    Boolean(directUpdate),
    directUpdate?.message ?? 'update succeeded — grants are too permissive!',
  )

  finish()
}

async function stockSnapshot(client: SupabaseClient, outletId: string): Promise<Record<string, number>> {
  const { data } = await client
    .from('outlet_stock')
    .select('stock_item_id, qty')
    .eq('outlet_id', outletId)
  return Object.fromEntries((data ?? []).map((row) => [row.stock_item_id, Number(row.qty)]))
}

function finish(): void {
  const failed = results.filter((result) => !result.ok)
  console.log(`\nverify: ${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length > 0) {
    console.error(`verify: ${failed.length} check(s) FAILED`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`verify: crashed — ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
