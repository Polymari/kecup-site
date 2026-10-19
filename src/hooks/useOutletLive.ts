import { useMemo } from 'react'
import { OUTLETS } from '@/data/outlets'
import type { Outlet } from '@/data/types'
import { computeStockFlags, outletAvailability } from '@/lib/availability'
import { checkAvailability } from '@/lib/recipes'
import { usePortal } from '@/store/portal'

export function useOutlets(): Outlet[] {
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
