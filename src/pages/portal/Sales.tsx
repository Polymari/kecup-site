import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MENU_BY_ID } from '@/data/menu'
import { formatRupiah } from '@/lib/money'
import { formatWibDateTime } from '@/lib/wib'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { usePortal } from '@/store/portal'
import { cn } from '@/lib/cn'

/** Short human-readable code: "demo-anggrek-42" → "#0042", "sale-…-123456" → "#123456". */
function saleCode(id: string): string {
  const tail = id.split('-').pop() ?? id
  return `#${tail.padStart(4, '0')}`
}

export default function Sales() {
  const { t } = useTranslation()
  const sales = usePortal((state) => state.sales)
  const voidSale = usePortal((state) => state.voidSale)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Newest first; the demo dataset is generated oldest → newest.
  const rows = useMemo(
    () => [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 120),
    [sales],
  )

  const exportCsv = () => {
    const header = 'id,created_at,payment_method,total,cogs,voided,items'
    const body = sales
      .map((sale) =>
        [
          sale.id,
          sale.createdAt,
          sale.paymentMethod,
          sale.total,
          sale.cogs,
          sale.voided,
          `"${sale.items
            .map((item) => `${item.qty}x ${item.menuItemId}${item.drinkChoice ? ` (${item.drinkChoice})` : ''}`)
            .join('; ')}"`,
        ].join(','),
      )
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'kecup-sales.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">{t('portal.sales.title')}</h1>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display font-semibold text-ink shadow-sticker"
        >
          {t('portal.sales.export')}
        </button>
      </div>

      <Card className="mt-4 overflow-x-auto p-4">
        {rows.length === 0 ? (
          <p className="text-ink/70">{t('portal.sales.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-[3px] border-ink text-left">
                <th className="py-2 pr-3">{t('portal.sales.date')}</th>
                <th className="py-2 pr-3">{t('build.orderCode')}</th>
                <th className="py-2 pr-3">{t('portal.sales.payment')}</th>
                <th className="py-2 pr-3">{t('portal.sales.total')}</th>
                <th className="py-2">{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sale) => (
                <Fragment key={sale.id}>
                  <tr
                    key={sale.id}
                    className={cn('cursor-pointer border-b border-ink/10', sale.voided && 'opacity-50')}
                    onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                  >
                    <td className="py-2 pr-3 font-mono text-xs">{formatWibDateTime(sale.createdAt)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{saleCode(sale.id)}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={sale.paymentMethod === 'qris' ? 'lime' : 'butter'}>
                        {t(`portal.cashier.${sale.paymentMethod}`)}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono">{formatRupiah(sale.total)}</td>
                    <td className="py-2">
                      {sale.voided ? (
                        <Badge tone="ketchup">{t('portal.sales.voided')}</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            voidSale(sale.id, 'void from sales history')
                          }}
                          className="rounded-full border-2 border-ink px-3 py-1 text-xs font-bold text-ketchup"
                        >
                          {t('portal.sales.void')}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === sale.id ? (
                    <tr key={`${sale.id}-detail`} className="border-b border-ink/10 bg-cream-deep">
                      <td colSpan={5} className="px-4 py-2">
                        <ul className="font-mono text-xs text-ink">
                          {sale.items.map((item, index) => (
                            <li key={index}>
                              {item.qty}× {t(MENU_BY_ID[item.menuItemId].nameKey)}
                              {item.drinkChoice ? ` (${t(MENU_BY_ID[item.drinkChoice].nameKey)})` : ''}{' '}
                              — {formatRupiah(item.unitPrice * item.qty)} · COGS{' '}
                              {formatRupiah(item.lineCogs)}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  )
}
