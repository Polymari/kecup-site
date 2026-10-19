import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isConfigured = Boolean(supabaseUrl && publishableKey)

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl!, publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export type SaleErrorCode =
  | 'NOT_AUTHORIZED'
  | 'INSUFFICIENT_STOCK'
  | 'SOLD_OUT'
  | 'INSUFFICIENT_CASH'
  | 'ALREADY_VOIDED'
  | 'UNKNOWN_ITEM'
  | 'UNKNOWN_DRINK_CHOICE'
  | 'INVALID_PAYMENT'
  | 'EMPTY_ORDER'
  | 'UNKNOWN_SALE'
  | 'UNKNOWN_STOCK_ITEM'
  | 'INVALID_QTY'
  | 'INVALID_KIND'
  | 'WASTE_MUST_BE_NEGATIVE'
  | 'UNKNOWN'

export interface RecordSaleInput {
  outletId: string
  payment: 'cash' | 'qris'
  cashReceived: number | null
  items: Array<{ menu_item_id: string; drink_choice?: string; qty: number }>
}

export interface RecordSaleResult {
  ok: boolean
  error?: SaleErrorCode
  saleId?: string
  total?: number
  cogs?: number
  changeDue?: number
  lowStock: string[]
}

export function parseSaleError(message: string): SaleErrorCode {
  const codes: SaleErrorCode[] = [
    'NOT_AUTHORIZED',
    'INSUFFICIENT_STOCK',
    'SOLD_OUT',
    'INSUFFICIENT_CASH',
    'ALREADY_VOIDED',
    'UNKNOWN_ITEM',
    'UNKNOWN_DRINK_CHOICE',
    'INVALID_PAYMENT',
    'EMPTY_ORDER',
    'UNKNOWN_SALE',
    'UNKNOWN_STOCK_ITEM',
    'INVALID_QTY',
    'INVALID_KIND',
    'WASTE_MUST_BE_NEGATIVE',
  ]
  return codes.find((code) => message.includes(code)) ?? 'UNKNOWN'
}

export async function recordSale(input: RecordSaleInput): Promise<RecordSaleResult> {
  if (!supabase) return { ok: false, error: 'UNKNOWN', lowStock: [] }
  const { data, error } = await supabase.rpc('record_sale', {
    p_outlet: input.outletId,
    p_payment: input.payment,
    p_cash: input.cashReceived,
    p_items: input.items,
  })
  if (error) {
    return { ok: false, error: parseSaleError(error.message), lowStock: [] }
  }
  const payload = data as {
    sale_id: string
    total: number
    cogs: number
    change_due: number
    low_stock: string[]
  }
  return {
    ok: true,
    saleId: payload.sale_id,
    total: Number(payload.total),
    cogs: Number(payload.cogs),
    changeDue: Number(payload.change_due),
    lowStock: payload.low_stock ?? [],
  }
}

export async function voidSale(saleId: string, reason: string): Promise<SaleErrorCode | null> {
  if (!supabase) return 'UNKNOWN'
  const { error } = await supabase.rpc('void_sale', { p_sale: saleId, p_reason: reason })
  return error ? parseSaleError(error.message) : null
}

export async function restockStock(input: {
  outletId: string
  stockItemId: string
  qty: number
  unitCost?: number
  note?: string
}): Promise<SaleErrorCode | null> {
  if (!supabase) return 'UNKNOWN'
  const { error } = await supabase.rpc('restock_stock', {
    p_outlet: input.outletId,
    p_item: input.stockItemId,
    p_qty: input.qty,
    p_unit_cost: input.unitCost ?? null,
    p_note: input.note ?? null,
  })
  return error ? parseSaleError(error.message) : null
}

export async function adjustStock(input: {
  outletId: string
  stockItemId: string
  delta: number
  kind: 'adjustment' | 'waste'
  note?: string
}): Promise<SaleErrorCode | null> {
  if (!supabase) return 'UNKNOWN'
  const { error } = await supabase.rpc('adjust_stock', {
    p_outlet: input.outletId,
    p_item: input.stockItemId,
    p_delta: input.delta,
    p_kind: input.kind,
    p_note: input.note ?? null,
  })
  return error ? parseSaleError(error.message) : null
}

export async function getOutletStockFlags(
  slug: string,
): Promise<Record<string, boolean> | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_outlet_stock_flags', { p_slug: slug })
  if (error || !data) return null
  const flags: Record<string, boolean> = {}
  for (const row of data as Array<{ stock_item_id: string; in_stock: boolean }>) {
    flags[row.stock_item_id] = Boolean(row.in_stock)
  }
  return flags
}

// PostgREST caps single responses at 1000 rows — page through with .range().
export async function fetchAllRows<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return rows
}
