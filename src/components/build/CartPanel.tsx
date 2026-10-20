import { useTranslation } from 'react-i18next'
import type { CartLine } from '@/store/cart'
import { MENU_BY_ID } from '@/data/menu'
import type { Outlet } from '@/data/types'
import { formatK, formatRupiah } from '@/lib/money'
import { isOpenNow, pickupSlots } from '@/lib/hours'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { useSelectedOutlet } from '@/store/outlet'
import { cartTotals } from '@/lib/cartTotals'
import { useOutlets } from '@/hooks/useOutletLive'

export interface CheckoutDetails {
  customerName: string
  pickupTime: string
  notes: string
}

type CartPanelProps = {
  lines: CartLine[]
  outlet: Outlet
  details: CheckoutDetails
  onDetailsChange: (details: CheckoutDetails) => void
  onQtyChange: (lineId: string, qty: number) => void
  onCheckout: () => void
}

export function CartPanel({
  lines,
  outlet,
  details,
  onDetailsChange,
  onQtyChange,
  onCheckout,
}: CartPanelProps) {
  const { t } = useTranslation()
  const setSlug = useSelectedOutlet((state) => state.setSlug)
  const outlets = useOutlets()
  const status = isOpenNow(outlet, new Date())
  const slots = pickupSlots(outlet, new Date())
  const { total, savings } = cartTotals(lines)

  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl font-semibold text-ink">{t('build.cart')}</h2>

      {lines.length === 0 ? (
        <p className="mt-3 text-ink/70">{t('build.empty')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10">
          {lines.map((line) => {
            const item = MENU_BY_ID[line.menuItemId]
            return (
              <li key={line.lineId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{t(item.nameKey)}</p>
                  {line.drinkChoice ? (
                    <p className="text-xs text-ink/70">{t(MENU_BY_ID[line.drinkChoice].nameKey)}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`${t('common.remove')} ${t(item.nameKey)}`}
                    onClick={() => onQtyChange(line.lineId, line.qty - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-cream font-bold text-ink transition-transform active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm">{line.qty}</span>
                  <button
                    type="button"
                    aria-label={`${t('common.add')} ${t(item.nameKey)}`}
                    onClick={() => onQtyChange(line.lineId, line.qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-cream font-bold text-ink transition-transform active:scale-95"
                  >
                    +
                  </button>
                </div>
                <span className="w-14 text-right font-mono text-sm text-ink">
                  {formatK(item.price * line.qty)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {savings > 0 ? (
        <p className="mt-3">
          <Badge tone="ketchup">
            {t('build.saved', { amount: formatRupiah(savings).replace('Rp ', '') })}
          </Badge>
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-semibold text-ink">
          {t('build.outlet')}
          <select
            value={outlet.slug}
            onChange={(event) => setSlug(event.target.value)}
            className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-display text-sm font-semibold text-ink"
          >
            {outlets.map((entry) => {
              const entryStatus = isOpenNow(entry, new Date())
              return (
                <option key={entry.slug} value={entry.slug}>
                  {`${entry.name} — ${entryStatus.open ? t('outlets.open') : t('outlets.closed')}`}
                </option>
              )
            })}
          </select>
        </label>

        {!status.open ? (
          <p className="rounded-xl border-2 border-brick bg-butter/40 px-3 py-2 text-sm text-brick">
            {t('build.closedNotice')}
          </p>
        ) : null}

        <label className="grid gap-1 text-sm font-semibold text-ink">
          {t('build.name')}
          <input
            type="text"
            value={details.customerName}
            onChange={(event) => onDetailsChange({ ...details, customerName: event.target.value })}
            className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-ink">
          {t('build.pickup')}
          <select
            value={details.pickupTime}
            onChange={(event) => onDetailsChange({ ...details, pickupTime: event.target.value })}
            className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-mono text-sm"
          >
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot === 'ASAP' ? t('build.asap') : slot}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-semibold text-ink">
          {t('build.notes')}
          <textarea
            rows={2}
            value={details.notes}
            onChange={(event) => onDetailsChange({ ...details, notes: event.target.value })}
            className="rounded-xl border-[3px] border-ink bg-cream px-4 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between border-t-[3px] border-ink pt-3">
        <span className="font-display text-lg font-semibold text-ink">{t('common.total')}</span>
        <span className="font-display text-2xl font-bold text-ketchup">{formatRupiah(total)}</span>
      </div>

      <button
        type="button"
        disabled={lines.length === 0}
        onClick={onCheckout}
        className="mt-4 w-full rounded-full border-[3px] border-ink bg-ketchup px-6 py-3 font-display text-lg font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
      >
        {t('build.checkout')}
      </button>
    </Card>
  )
}
