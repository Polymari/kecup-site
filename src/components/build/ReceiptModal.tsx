import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { MENU_BY_ID } from '@/data/menu'
import type { Outlet } from '@/data/types'
import type { CartLine } from '@/store/cart'
import { formatRupiah } from '@/lib/money'
import { buildOrderMessage, buildWhatsAppLink } from '@/lib/whatsapp'
import type { CheckoutDetails } from './CartPanel'
import { cartTotals } from '@/lib/cartTotals'
import { Lips } from '@/components/brand/Lips'

type ReceiptModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lines: CartLine[]
  outlet: Outlet
  details: CheckoutDetails
  code: string
  onSent: () => void
}

export function ReceiptModal({
  open,
  onOpenChange,
  lines,
  outlet,
  details,
  code,
  onSent,
}: ReceiptModalProps) {
  const { t, i18n } = useTranslation()
  const [stamped, setStamped] = useState(false)
  const { total } = cartTotals(lines)
  const locale = i18n.language.startsWith('id') ? 'id' : 'en'

  const message = buildOrderMessage({
    outletName: outlet.name,
    lines: lines.map((line) => ({
      qty: line.qty,
      name: t(MENU_BY_ID[line.menuItemId].nameKey),
      drinkName: line.drinkChoice ? t(MENU_BY_ID[line.drinkChoice].nameKey) : undefined,
      lineTotal: MENU_BY_ID[line.menuItemId].price * line.qty,
    })),
    total,
    pickupTime: details.pickupTime === 'ASAP' ? t('build.asap') : details.pickupTime,
    customerName: details.customerName || '—',
    notes: details.notes,
    code,
    locale,
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border-[3px] border-ink bg-cream p-6">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-2xl font-semibold text-ink">
              {t('build.receipt')}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('common.close')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-ink bg-butter text-ink"
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
          </div>

          <div className="mt-4 animate-[receipt-print_0.6s_ease-out] rounded-xl border-2 border-dashed border-brick bg-cream-deep p-4 font-mono text-sm text-ink">
            <p className="text-center font-bold">KECUP · {outlet.name}</p>
            <p className="text-center text-xs">
              {t('build.orderCode')}: {code}
            </p>
            <hr className="my-3 border-brick/40" />
            {lines.map((line) => (
              <p key={line.lineId} className="flex justify-between gap-3">
                <span>
                  {line.qty}× {t(MENU_BY_ID[line.menuItemId].nameKey)}
                  {line.drinkChoice ? ` (${t(MENU_BY_ID[line.drinkChoice].nameKey)})` : ''}
                </span>
                <span>{formatRupiah(MENU_BY_ID[line.menuItemId].price * line.qty)}</span>
              </p>
            ))}
            <hr className="my-3 border-brick/40" />
            <p className="flex justify-between font-bold">
              <span>{t('common.total')}</span>
              <span>{formatRupiah(total)}</span>
            </p>
            <p className="mt-2 text-xs">
              {t('build.pickup')}:{' '}
              {details.pickupTime === 'ASAP' ? t('build.asap') : details.pickupTime}
            </p>
            <p className="text-xs">
              {t('build.name')}: {details.customerName || '—'}
            </p>
            {details.notes ? (
              <p className="text-xs">
                {t('build.notes')}: {details.notes}
              </p>
            ) : null}
          </div>

          <a
            href={buildWhatsAppLink(outlet.whatsapp, message)}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              setStamped(true)
              onSent()
            }}
            className="relative mt-5 flex w-full items-center justify-center rounded-full border-[3px] border-ink bg-ketchup px-6 py-3 font-display text-lg font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5"
          >
            {t('build.send')}
            {stamped ? (
              <span className="absolute -right-3 -top-4 rotate-12 rounded-full border-[3px] border-ketchup bg-cream px-2 py-0.5 font-display text-sm font-bold text-ketchup">
                KECUP!
                <Lips className="mx-auto h-2.5 w-5 text-ketchup" />
              </span>
            ) : null}
          </a>
        </Dialog.Content>
      </Dialog.Portal>
      <style>{`@keyframes receipt-print { from { transform: translateY(-24px); clip-path: inset(0 0 100% 0) } to { transform: translateY(0); clip-path: inset(0 0 0 0) } }`}</style>
    </Dialog.Root>
  )
}
