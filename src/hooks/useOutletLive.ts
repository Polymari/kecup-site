import { useEffect, useMemo } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { OUTLETS } from '@/data/outlets'
import type { Outlet, OutletHours } from '@/data/types'
import { computeStockFlags, outletAvailability } from '@/lib/availability'
import { checkAvailability } from '@/lib/recipes'
import { isConfigured, supabase } from '@/lib/supabase'
import { usePortal } from '@/store/portal'

let activeChannel: RealtimeChannel | null = null
let subscriberCount = 0

async function hydrateLiveState(): Promise<void> {
  if (!isConfigured || !supabase) return
  try {
    const { data: outletsData } = await supabase.from('outlets').select('*')
    if (outletsData) {
      for (const row of outletsData) {
        usePortal.getState().updateSettings(row.slug, {
          whatsapp: row.whatsapp,
          instagram: row.instagram,
          hours: row.hours,
          temporarilyClosed: row.temporarily_closed,
        })
      }
    }
    const { data: overridesData } = await supabase.from('menu_overrides').select('*')
    if (overridesData) {
      const overridesBySlug: Record<string, Record<string, boolean>> = {}
      for (const row of overridesData) {
        const outlet = OUTLETS.find((o) => o.id === row.outlet_id)
        if (outlet) {
          if (!overridesBySlug[outlet.slug]) overridesBySlug[outlet.slug] = {}
          overridesBySlug[outlet.slug][row.menu_item_id] = row.sold_out
        }
      }
      for (const [slug, soldOut] of Object.entries(overridesBySlug)) {
        usePortal.getState().updateSettings(slug, { soldOut })
      }
    }
  } catch (err) {
    console.error('Failed to hydrate live state from Supabase:', err)
  }
}

export function useRealtimeSync(): void {
  useEffect(() => {
    if (!isConfigured || !supabase) return

    subscriberCount += 1
    if (subscriberCount === 1) {
      void hydrateLiveState()
      activeChannel = supabase
        .channel('public:realtime-outlets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'outlets' },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              slug?: string
              whatsapp?: string
              instagram?: string
              hours?: OutletHours
              temporarily_closed?: boolean
            } | null
            if (row?.slug) {
              usePortal.getState().updateSettings(row.slug, {
                ...(row.whatsapp !== undefined ? { whatsapp: row.whatsapp } : {}),
                ...(row.instagram !== undefined ? { instagram: row.instagram } : {}),
                ...(row.hours !== undefined ? { hours: row.hours } : {}),
                ...(row.temporarily_closed !== undefined
                  ? { temporarilyClosed: row.temporarily_closed }
                  : {}),
              })
            }
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_overrides' },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              outlet_id?: string
              menu_item_id?: string
              sold_out?: boolean
            } | null
            if (!row || !row.outlet_id || !row.menu_item_id) return
            const outlet = OUTLETS.find((o) => o.id === row.outlet_id)
            if (outlet) {
              const current = usePortal.getState().settings[outlet.slug]?.soldOut ?? {}
              const isSoldOut = payload.eventType === 'DELETE' ? false : Boolean(row.sold_out)
              usePortal.getState().updateSettings(outlet.slug, {
                soldOut: { ...current, [row.menu_item_id]: isSoldOut },
              })
            }
          },
        )
        .subscribe()
    }

    return () => {
      subscriberCount -= 1
      if (subscriberCount === 0 && activeChannel) {
        if (supabase) {
          void supabase.removeChannel(activeChannel)
        }
        activeChannel = null
      }
    }
  }, [])
}

export function useOutlets(): Outlet[] {
  useRealtimeSync()
  const settings = usePortal((state) => state.settings)
  return useMemo(
    () =>
      OUTLETS.map((outlet) => {
        const outletSettings = settings[outlet.slug]
        if (!outletSettings) return outlet
        return {
          ...outlet,
          whatsapp: outletSettings.whatsapp,
          instagram: outletSettings.instagram,
          hours: outletSettings.hours,
          temporarilyClosed: outletSettings.temporarilyClosed,
        }
      }),
    [settings],
  )
}

export function useOutlet(slug: string): Outlet | undefined {
  const outlets = useOutlets()
  return outlets.find((outlet) => outlet.slug === slug)
}

const NO_OVERRIDES: Record<string, boolean> = {}

export function useAvailability(slug: string): Record<string, boolean> {
  useRealtimeSync()
  const outletSlug = usePortal((state) => state.outletSlug)
  const stock = usePortal((state) => state.stock)
  const soldOut = usePortal((state) => state.settings[slug]?.soldOut ?? NO_OVERRIDES)

  return useMemo(() => {
    const overrides = soldOut
    if (slug === outletSlug) {
      const onHand = Object.fromEntries(stock.map((row) => [row.stockItemId, row.qty]))
      return checkAvailability(computeStockFlags(onHand), overrides)
    }
    return outletAvailability(slug, overrides).availability
  }, [slug, outletSlug, stock, soldOut])
}
