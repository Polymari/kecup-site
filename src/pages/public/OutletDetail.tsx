import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { MENU_ITEMS } from '@/data/menu'
import type { DayKey } from '@/data/types'
import { DAY_KEYS, dayKey } from '@/lib/wib'
import { isOpenNow } from '@/lib/hours'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { useAvailability, useOutlet } from '@/hooks/useOutletLive'
import NotFound from './NotFound'

export default function OutletDetail() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const outlet = useOutlet(slug)
  const availability = useAvailability(slug)

  if (!outlet) return <NotFound />

  const status = isOpenNow(outlet, new Date())
  const today = dayKey(new Date())
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.mapsQuery)}`
  const whatsappLink = `https://wa.me/${outlet.whatsapp.replace(/\D/g, '')}`

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-5xl font-bold text-ketchup">{outlet.name}</h1>
        <Badge tone={status.open ? 'lime' : 'ketchup'}>
          {status.open ? t('outlets.open') : t('outlets.closed')}
        </Badge>
        {status.reason === 'temporarily-closed' ? (
          <Badge tone="butter">{t('status.temporarilyClosed')}</Badge>
        ) : null}
      </div>
      <p className="mt-2 text-lg text-ink/80">{outlet.area}</p>
      <p className="text-ink">{outlet.address}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border-[3px] border-ink bg-ketchup px-5 py-2 font-display font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5"
        >
          {t('outlets.whatsapp')}
        </a>
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
        >
          {t('outlets.map')}
        </a>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-2xl font-semibold text-ink">{t('outlets.hours')}</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {DAY_KEYS.map((day: DayKey) => {
                const entry = outlet.hours[day]
                return (
                  <tr
                    key={day}
                    className={cn(
                      'border-b border-ink/10',
                      day === today && 'bg-butter/40 font-semibold',
                    )}
                  >
                    <td className="py-1.5">
                      {t(`days.${day}`)}
                      {day === today ? ` · ${t('outlets.today')}` : ''}
                    </td>
                    <td className="py-1.5 text-right font-mono">
                      {entry.closed ? t('status.closed') : `${entry.open} – ${entry.close}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-2xl font-semibold text-ink">{t('menu.title')}</h2>
          <ul className="mt-3 space-y-1.5">
            {MENU_ITEMS.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{t(item.nameKey)}</span>
                <Badge tone={availability[item.id] !== false ? 'lime' : 'ketchup'}>
                  {availability[item.id] !== false ? t('status.inStock') : t('menu.soldOut')}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}
