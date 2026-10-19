import { useTranslation } from 'react-i18next'
import type { Outlet } from '@/data/types'
import { isOpenNow } from '@/lib/hours'
import { formatK } from '@/lib/money'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { TransitionLink } from '@/anim/TransitionLink'
import { useAvailability } from '@/hooks/useOutletLive'

type OutletCardProps = {
  outlet: Outlet
}

function mapsLink(outlet: Outlet): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.mapsQuery)}`
}

function whatsappLink(outlet: Outlet): string {
  return `https://wa.me/${outlet.whatsapp.replace(/\D/g, '')}`
}

export function OutletCard({ outlet }: OutletCardProps) {
  const { t } = useTranslation()
  const status = isOpenNow(outlet, new Date())
  const availability = useAvailability(outlet.slug)
  const soldOutCount = Object.values(availability).filter((available) => !available).length

  return (
    <Card as="article" className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink">{outlet.name}</h3>
          <p className="text-sm text-ink/70">{outlet.area}</p>
        </div>
        <Badge tone={status.open ? 'lime' : 'ketchup'}>
          <span
            aria-hidden
            className={`inline-block h-2 w-2 rounded-full ${status.open ? 'bg-ink' : 'bg-cream'}`}
          />
          {status.open ? t('outlets.open') : t('outlets.closed')}
        </Badge>
      </div>

      <p className="text-sm text-ink/80">{outlet.address}</p>

      <div className="flex flex-wrap items-center gap-2">
        {status.reason === 'temporarily-closed' ? (
          <Badge tone="butter">{t('status.temporarilyClosed')}</Badge>
        ) : null}
        {soldOutCount > 0 ? (
          <Badge tone="sun">{`${soldOutCount} ${t('menu.soldOut')}`}</Badge>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <TransitionLink
          to={`/outlets/${outlet.slug}`}
          className="rounded-full border-[3px] border-ink bg-butter px-4 py-1.5 font-display text-sm font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
        >
          {t('outlets.details')}
        </TransitionLink>
        <a
          href={whatsappLink(outlet)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border-[3px] border-ink bg-cream px-4 py-1.5 font-display text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          {t('outlets.whatsapp')}
        </a>
        <a
          href={mapsLink(outlet)}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border-[3px] border-ink bg-cream px-4 py-1.5 font-display text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
        >
          {t('outlets.map')}
        </a>
      </div>

      <p className="font-mono text-xs text-brick">
        {t('combo.title')}: {formatK(28000)}–{formatK(35000)}
      </p>
    </Card>
  )
}
