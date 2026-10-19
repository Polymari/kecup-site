import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Tabs from '@radix-ui/react-tabs'
import { MENU_ITEMS } from '@/data/menu'
import type { MenuItem } from '@/data/types'
import { isOpenNow } from '@/lib/hours'
import { cn } from '@/lib/cn'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { PrintedMenuLightbox } from '@/components/menu/PrintedMenuLightbox'
import { useSelectedOutlet } from '@/store/outlet'
import { useAvailability, useOutlets } from '@/hooks/useOutletLive'

type TabKey = 'combos' | 'snacks' | 'drinks'

const TAB_KINDS: Record<TabKey, MenuItem['kind']> = {
  combos: 'combo',
  snacks: 'snack',
  drinks: 'drink',
}

export default function Menu() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>('combos')
  const slug = useSelectedOutlet((state) => state.slug)
  const setSlug = useSelectedOutlet((state) => state.setSlug)
  const outlets = useOutlets()

  const outlet = outlets.find((entry) => entry.slug === slug) ?? outlets[0]
  const availability = useAvailability(outlet.slug)
  const status = isOpenNow(outlet, new Date())

  const items = MENU_ITEMS.filter((item) => item.kind === TAB_KINDS[tab])

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-script text-3xl text-ketchup">cravings</p>
          <h1 className="font-display text-5xl font-bold text-ink">{t('menu.title')}</h1>
          <p className="mt-1 text-lg text-ink/80">{t('menu.sub')}</p>
        </div>
        <PrintedMenuLightbox />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border-[3px] border-ink bg-cream-deep p-3">
        <label htmlFor="menu-outlet" className="font-display text-sm font-semibold text-ink">
          {t('menu.selectOutlet')}
        </label>
        <select
          id="menu-outlet"
          value={outlet.slug}
          onChange={(event) => setSlug(event.target.value)}
          className="rounded-full border-[3px] border-ink bg-cream px-4 py-1.5 font-display text-sm font-semibold text-ink"
        >
          {outlets.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name}
            </option>
          ))}
        </select>
        <span
          className={cn(
            'rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-bold uppercase',
            status.open ? 'bg-lime text-ink' : 'bg-ketchup text-cream',
          )}
        >
          {status.open ? t('outlets.open') : t('outlets.closed')}
        </span>
      </div>

      <Tabs.Root value={tab} onValueChange={(value) => setTab(value as TabKey)} className="mt-8">
        <Tabs.List className="flex flex-wrap gap-2">
          {(Object.keys(TAB_KINDS) as TabKey[]).map((key) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={cn(
                'rounded-full border-[3px] border-ink px-5 py-2 font-display font-semibold transition-colors',
                tab === key
                  ? 'bg-ketchup text-cream shadow-sticker'
                  : 'bg-cream text-ink hover:bg-butter',
              )}
            >
              {t(`menu.tabs.${key}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value={tab} className="mt-6 outline-none">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                available={availability[item.id] !== false}
              />
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  )
}
