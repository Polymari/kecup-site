import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MENU_ITEMS } from '@/data/menu'
import type { DayKey } from '@/data/types'
import { DAY_KEYS } from '@/lib/wib'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { usePortal } from '@/store/portal'
import { useOutlet } from '@/hooks/useOutletLive'
import { cn } from '@/lib/cn'

export default function Settings() {
  const { t } = useTranslation()
  const outletSlug = usePortal((state) => state.outletSlug)
  const settings = usePortal((state) => state.settings[outletSlug])
  const updateSettings = usePortal((state) => state.updateSettings)
  const outlet = useOutlet(outletSlug)
  const [saved, setSaved] = useState(false)

  if (!settings) return null

  const markSaved = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">{t('portal.settings.title')}</h1>
        {saved ? <Badge tone="lime">{t('portal.settings.saved')}</Badge> : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('portal.settings.profile')}
          </h2>
          <p className="mt-1 text-sm text-ink/70">{outlet?.name}</p>

          <label className="mt-3 grid gap-1 text-sm font-semibold text-ink">
            {t('portal.settings.whatsapp')}
            <input
              type="text"
              value={settings.whatsapp}
              onChange={(event) => updateSettings(outletSlug, { whatsapp: event.target.value })}
              onBlur={markSaved}
              className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-mono text-sm"
            />
          </label>

          <label className="mt-2 grid gap-1 text-sm font-semibold text-ink">
            {t('portal.settings.instagram')}
            <input
              type="text"
              value={settings.instagram}
              onChange={(event) => updateSettings(outletSlug, { instagram: event.target.value })}
              onBlur={markSaved}
              className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
            />
          </label>

          <div className="mt-4 flex items-center justify-between rounded-xl border-[3px] border-ink bg-cream-deep px-4 py-3">
            <span className="font-semibold text-ink">{t('portal.settings.tempClosed')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.temporarilyClosed}
              onClick={() => {
                updateSettings(outletSlug, { temporarilyClosed: !settings.temporarilyClosed })
                markSaved()
              }}
              className={cn(
                'h-7 w-12 rounded-full border-[3px] border-ink transition-colors',
                settings.temporarilyClosed ? 'bg-ketchup' : 'bg-lime',
              )}
            >
              <span
                className={cn(
                  'block h-4 w-4 rounded-full bg-cream transition-transform',
                  settings.temporarilyClosed ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('portal.settings.soldOut')}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {MENU_ITEMS.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{t(item.nameKey)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(settings.soldOut[item.id])}
                  onClick={() => {
                    updateSettings(outletSlug, {
                      soldOut: { ...settings.soldOut, [item.id]: !settings.soldOut[item.id] },
                    })
                    markSaved()
                  }}
                  className={cn(
                    'h-6 w-11 rounded-full border-2 border-ink transition-colors',
                    settings.soldOut[item.id] ? 'bg-ketchup' : 'bg-lime',
                  )}
                >
                  <span
                    className={cn(
                      'block h-3.5 w-3.5 rounded-full bg-cream transition-transform',
                      settings.soldOut[item.id] ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <h2 className="font-display text-xl font-semibold text-ink">{t('portal.settings.hours')}</h2>
        <div className="mt-3 grid gap-2">
          {DAY_KEYS.map((day: DayKey) => {
            const entry = settings.hours[day]
            return (
              <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-12 font-semibold capitalize text-ink">{day}</span>
                <input
                  type="time"
                  value={entry.open}
                  disabled={entry.closed}
                  onChange={(event) => {
                    updateSettings(outletSlug, {
                      hours: { ...settings.hours, [day]: { ...entry, open: event.target.value } },
                    })
                    markSaved()
                  }}
                  className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-xs disabled:opacity-40"
                />
                <span className="text-brick">–</span>
                <input
                  type="time"
                  value={entry.close}
                  disabled={entry.closed}
                  onChange={(event) => {
                    updateSettings(outletSlug, {
                      hours: { ...settings.hours, [day]: { ...entry, close: event.target.value } },
                    })
                    markSaved()
                  }}
                  className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-xs disabled:opacity-40"
                />
                <label className="ml-2 flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(entry.closed)}
                    onChange={(event) => {
                      updateSettings(outletSlug, {
                        hours: {
                          ...settings.hours,
                          [day]: {
                            ...entry,
                            closed: event.target.checked,
                            open: entry.open || '10:00',
                            close: entry.close || '20:00',
                          },
                        },
                      })
                      markSaved()
                    }}
                  />
                  {t('status.closed')}
                </label>
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
