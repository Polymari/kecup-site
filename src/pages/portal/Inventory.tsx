import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { STOCK_BY_ID } from '@/data/stock'
import { formatRupiah, formatRupiahExact } from '@/lib/money'
import { dateKey } from '@/lib/wib'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { usePortal } from '@/store/portal'
import { cn } from '@/lib/cn'

type Action = 'restock' | 'adjust' | 'waste'

export default function Inventory() {
  const { t } = useTranslation()
  const stock = usePortal((state) => state.stock)
  const movements = usePortal((state) => state.movements)
  const restock = usePortal((state) => state.restock)
  const adjust = usePortal((state) => state.adjust)

  const [action, setAction] = useState<Action>('restock')
  const [item, setItem] = useState(stock[0]?.stockItemId ?? 'chips')
  const [qty, setQty] = useState(10)
  const [cost, setCost] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const submit = () => {
    if (action === 'restock') {
      restock(item, qty, cost ?? undefined, note || undefined)
    } else {
      adjust(
        item,
        action === 'waste' ? -Math.abs(qty) : qty,
        action === 'waste' ? 'waste' : 'adjustment',
        note || undefined,
      )
    }
    setNote('')
  }

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-ink">{t('portal.inventory.title')}</h1>

      <Card className="mt-4 overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-[3px] border-ink text-left">
              <th className="py-2 pr-3">{t('portal.inventory.item')}</th>
              <th className="py-2 pr-3">{t('portal.inventory.category')}</th>
              <th className="py-2 pr-3">{t('portal.inventory.onHand')}</th>
              <th className="py-2 pr-3">{t('portal.inventory.threshold')}</th>
              <th className="py-2 pr-3">{t('portal.inventory.unitCost')}</th>
              <th className="py-2">{t('portal.inventory.status')}</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => {
              const status =
                row.qty <= 0
                  ? ({ label: t('status.outOfStock'), tone: 'ketchup' } as const)
                  : row.qty < row.lowThreshold
                    ? ({ label: t('status.lowStock'), tone: 'sun' } as const)
                    : ({ label: t('status.inStock'), tone: 'lime' } as const)
              return (
                <tr key={row.stockItemId} className="border-b border-ink/10">
                  <td className="py-2 pr-3 font-semibold text-ink">
                    {t(STOCK_BY_ID[row.stockItemId].nameKey)}
                  </td>
                  <td className="py-2 pr-3 text-ink/70">{STOCK_BY_ID[row.stockItemId].category}</td>
                  <td className="py-2 pr-3 font-mono">{row.qty}</td>
                  <td className="py-2 pr-3 font-mono text-ink/70">{row.lowThreshold}</td>
                  <td className="py-2 pr-3 font-mono">{formatRupiahExact(row.unitCost)}</td>
                  <td className="py-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="p-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('portal.inventory.restock')}
          </h2>
          <div className="mt-3 flex gap-2">
            {(['restock', 'adjust', 'waste'] as Action[]).map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setAction(entry)}
                className={cn(
                  'flex-1 rounded-full border-2 border-ink px-2 py-1 text-xs font-bold',
                  action === entry ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
                )}
              >
                {t(`portal.inventory.${entry}`)}
              </button>
            ))}
          </div>

          <label className="mt-3 grid gap-1 text-sm font-semibold text-ink">
            {t('portal.inventory.item')}
            <select
              value={item}
              onChange={(event) => setItem(event.target.value)}
              className="rounded-full border-[3px] border-ink bg-cream px-3 py-1.5 text-sm"
            >
              {stock.map((row) => (
                <option key={row.stockItemId} value={row.stockItemId}>
                  {t(STOCK_BY_ID[row.stockItemId].nameKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-2 grid gap-1 text-sm font-semibold text-ink">
            {action === 'waste' ? `-${t('portal.inventory.onHand')}` : t('portal.inventory.onHand')}
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(event) => setQty(Number(event.target.value))}
              className="rounded-full border-[3px] border-ink bg-cream px-3 py-1.5 font-mono text-sm"
            />
          </label>

          {action === 'restock' ? (
            <label className="mt-2 grid gap-1 text-sm font-semibold text-ink">
              {t('portal.inventory.unitCost')}
              <input
                type="number"
                value={cost ?? ''}
                placeholder={t('portal.inventory.weightedAverage')}
                onChange={(event) =>
                  setCost(event.target.value === '' ? null : Number(event.target.value))
                }
                className="rounded-full border-[3px] border-ink bg-cream px-3 py-1.5 font-mono text-sm"
              />
            </label>
          ) : null}

          <label className="mt-2 grid gap-1 text-sm font-semibold text-ink">
            {t('portal.inventory.note')}
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-full border-[3px] border-ink bg-cream px-3 py-1.5 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            className="mt-4 w-full rounded-full border-[3px] border-ink bg-ketchup px-5 py-2.5 font-display font-semibold text-cream shadow-sticker"
          >
            {t('common.save')}
          </button>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            {t('portal.inventory.movements')}
          </h2>
          <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto font-mono text-xs">
            {movements.slice(0, 60).map((movement) => (
              <li key={movement.id} className="flex items-center gap-2 border-b border-ink/10 pb-1">
                <span className="w-24 shrink-0 text-brick">
                  {dateKey(new Date(movement.createdAt))}
                </span>
                <Badge tone={movement.delta < 0 ? 'ketchup' : 'lime'}>{movement.kind}</Badge>
                <span className="min-w-0 flex-1 truncate text-ink">
                  {t(STOCK_BY_ID[movement.stockItemId]?.nameKey ?? movement.stockItemId)}
                </span>
                <span className={cn('font-bold', movement.delta < 0 ? 'text-ketchup' : 'text-ink')}>
                  {movement.delta > 0 ? '+' : ''}
                  {movement.delta}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-4 font-mono text-xs text-brick">
        {t('portal.inventory.stockValue')}: {formatRupiah(stock.reduce((sum, row) => sum + row.qty * row.unitCost, 0))}
      </p>
    </section>
  )
}
