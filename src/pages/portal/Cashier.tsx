import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MENU_ITEMS, MENU_BY_ID } from '@/data/menu'
import type { DrinkKey, OrderLine } from '@/data/types'
import { expandRequirements } from '@/lib/recipes'
import { formatRupiah } from '@/lib/money'
import { Card } from '@/components/brand/Card'
import { useAvailability } from '@/hooks/useOutletLive'
import { usePortal } from '@/store/portal'
import { cn } from '@/lib/cn'

const TILE_COLORS: Record<string, string> = {
  snack: 'bg-butter',
  drink: 'bg-lime',
  combo: 'bg-ketchup text-cream',
}

type CashierLine = OrderLine

export default function Cashier() {
  const { t } = useTranslation()
  const outletSlug = usePortal((state) => state.outletSlug)
  const availability = useAvailability(outletSlug)
  const recordSale = usePortal((state) => state.recordSale)

  const [lines, setLines] = useState<CashierLine[]>([])
  const [payment, setPayment] = useState<'cash' | 'qris'>('qris')
  const [tendered, setTendered] = useState(0)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const total = lines.reduce((sum, line) => sum + MENU_BY_ID[line.menuItemId].price * line.qty, 0)
  const change = payment === 'cash' ? Math.max(0, tendered - total) : 0

  const deduction = useMemo(() => expandRequirements(lines), [lines])

  const addLine = (menuItemId: string, drinkChoice?: DrinkKey) => {
    setResult(null)
    setLines((current) => {
      const existing = current.find(
        (line) => line.menuItemId === menuItemId && (line.drinkChoice ?? null) === (drinkChoice ?? null),
      )
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, qty: line.qty + 1 } : line,
        )
      }
      return [...current, { menuItemId, drinkChoice, qty: 1 }]
    })
  }

  const setQty = (index: number, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((_, i) => i !== index)
        : current.map((line, i) => (i === index ? { ...line, qty } : line)),
    )
  }

  const charge = () => {
    const outcome = recordSale({
      lines,
      payment,
      cashReceived: payment === 'cash' ? tendered : null,
    })
    if (!outcome.ok) {
      setResult({
        ok: false,
        text:
          outcome.error === 'INSUFFICIENT_STOCK'
            ? t('portal.cashier.insufficientStock')
            : outcome.error,
      })
      return
    }
    setResult({
      ok: true,
      text: `${t('portal.cashier.success')} · ${t('build.orderCode')} ${outcome.sale.id.slice(-6)}`,
    })
    setLines([])
    setTendered(0)
  }

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-ink">{t('portal.cashier.title')}</h1>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MENU_ITEMS.map((item) => {
              const available = availability[item.id] !== false
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-2xl border-[3px] border-ink p-3 shadow-sticker',
                    TILE_COLORS[item.kind],
                    !available && 'opacity-40',
                  )}
                >
                  <p className="font-display text-sm font-semibold leading-tight">
                    {t(item.nameKey)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs">{formatRupiah(item.price)}</p>
                  {item.kind === 'combo' ? (
                    <div className="mt-2 flex gap-1">
                      {(['tea-cloudy', 'tea-fizzy'] as DrinkKey[]).map((drink) => (
                        <button
                          key={drink}
                          type="button"
                          disabled={!available}
                          onClick={() => addLine(item.id, drink)}
                          className="flex-1 rounded-full border-2 border-ink bg-cream px-1 py-1 text-[10px] font-bold text-ink disabled:cursor-not-allowed"
                        >
                          {drink === 'tea-cloudy' ? 'Cloudy' : 'Fizzy'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => addLine(item.id)}
                      className="mt-2 w-full rounded-full border-2 border-ink bg-cream px-2 py-1 text-xs font-bold text-ink disabled:cursor-not-allowed"
                    >
                      {t('common.add')}
                    </button>
                  )}
                  {!available ? (
                    <p className="mt-1 text-[10px] font-bold">{t('menu.soldOut')}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <Card className="flex h-fit flex-col p-4">
          <h2 className="font-display text-xl font-semibold text-ink">{t('build.cart')}</h2>

          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">{t('portal.cashier.cartEmpty')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink/10">
              {lines.map((line, index) => (
                <li key={`${line.menuItemId}-${line.drinkChoice ?? 'x'}`} className="flex items-center gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {t(MENU_BY_ID[line.menuItemId].nameKey)}
                    {line.drinkChoice ? ` (${t(MENU_BY_ID[line.drinkChoice].nameKey)})` : ''}
                  </span>
                  <button
                    type="button"
                    aria-label={t('common.remove')}
                    onClick={() => setQty(index, line.qty - 1)}
                    className="h-6 w-6 rounded-full border-2 border-ink bg-cream font-bold"
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-mono">{line.qty}</span>
                  <button
                    type="button"
                    aria-label={t('common.add')}
                    onClick={() => setQty(index, line.qty + 1)}
                    className="h-6 w-6 rounded-full border-2 border-ink bg-cream font-bold"
                  >
                    +
                  </button>
                  <span className="w-16 text-right font-mono">
                    {formatRupiah(MENU_BY_ID[line.menuItemId].price * line.qty)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {deduction.length > 0 ? (
            <div className="mt-3 rounded-xl border-2 border-dashed border-brick p-2">
              <p className="font-mono text-[10px] uppercase text-brick">
                {t('portal.inventory.onHand')} →
              </p>
              <p className="font-mono text-[11px] text-ink">
                {deduction.map((req) => `-${req.qty} ${req.stockItemId}`).join(' · ')}
              </p>
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between border-t-[3px] border-ink pt-3">
            <span className="font-display font-semibold text-ink">{t('common.total')}</span>
            <span className="font-display text-2xl font-bold text-ketchup">
              {formatRupiah(total)}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            {(['qris', 'cash'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayment(method)}
                className={cn(
                  'flex-1 rounded-full border-[3px] border-ink px-3 py-1.5 font-display text-sm font-semibold',
                  payment === method ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
                )}
              >
                {t(`portal.cashier.${method}`)}
              </button>
            ))}
          </div>

          {payment === 'cash' ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-ink">{t('portal.cashier.tendered')}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[total, 20000, 50000, 100000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTendered(amount)}
                    className={cn(
                      'rounded-full border-2 border-ink px-3 py-1 font-mono text-xs',
                      tendered === amount ? 'bg-butter' : 'bg-cream',
                    )}
                  >
                    {formatRupiah(amount)}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-sm text-ink">
                {t('portal.cashier.change')}: {formatRupiah(change)}
              </p>
            </div>
          ) : null}

          {result ? (
            <p
              role="status"
              className={cn(
                'mt-3 rounded-xl border-2 px-3 py-2 text-sm font-semibold',
                result.ok ? 'border-ink bg-lime text-ink' : 'border-ketchup bg-cream text-ketchup',
              )}
            >
              {result.text}
            </p>
          ) : null}

          <button
            type="button"
            disabled={lines.length === 0}
            onClick={charge}
            className="mt-4 w-full rounded-full border-[3px] border-ink bg-ketchup px-6 py-3 font-display text-lg font-semibold text-cream shadow-sticker disabled:opacity-50"
          >
            {t('portal.cashier.charge')} {formatRupiah(total)}
          </button>
        </Card>
      </div>
    </section>
  )
}
