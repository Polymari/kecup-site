import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts'
import { MENU_BY_ID, MENU_ITEMS } from '@/data/menu'
import {
  COSTING,
  batchTotal,
  perPortionCost,
  roundedPortionCost,
} from '@/data/costing'
import {
  byDay,
  hourMatrix,
  paymentSplit,
  productMix,
  summarize,
  topItems,
} from '@/lib/analytics'
import { dateKey } from '@/lib/wib'
import { computeCogs } from '@/lib/recipes'
import { formatRupiah, formatRupiahExact } from '@/lib/money'
import { pricingInsight } from '@/lib/pricing'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { KpiCard } from '@/components/portal/KpiCard'
import { usePortal } from '@/store/portal'
import { cn } from '@/lib/cn'

const PIE_COLORS = ['var(--color-ketchup)', 'var(--color-sun)', 'var(--color-lime)']
const HEAT_COLORS = ['#F2E6C9', '#F7D774', '#F2B705', '#E8641E', '#E23B2E']

function daysAgoKey(days: number): string {
  return dateKey(new Date(Date.now() - days * 86_400_000))
}

export default function Analytics() {
  const { t } = useTranslation()
  const sales = usePortal((state) => state.sales)
  const stock = usePortal((state) => state.stock)
  const restock = usePortal((state) => state.restock)
  const [rangeDays, setRangeDays] = useState(30)
  const [whatIf, setWhatIf] = useState<Record<string, number>>({})

  const from = daysAgoKey(rangeDays - 1)
  const to = dateKey(new Date())
  const inRange = useMemo(
    () => sales.filter((sale) => dateKey(new Date(sale.createdAt)) >= from),
    [sales, from],
  )

  const summary = summarize(inRange)
  const daily = byDay(inRange, from, to).map((bucket) => ({
    day: bucket.dateKey.slice(5),
    revenue: bucket.revenue,
    profit: bucket.profit,
  }))
  const top = topItems(inRange, 5).map((entry) => ({
    name: t(MENU_BY_ID[entry.menuItemId].nameKey),
    revenue: entry.revenue,
  }))
  const mix = productMix(inRange, (id) => MENU_BY_ID[id].kind)
  const split = paymentSplit(inRange)
  const heat = hourMatrix(inRange).matrix

  const unitCosts = Object.fromEntries(stock.map((row) => [row.stockItemId, row.unitCost]))
  const unitRows = MENU_ITEMS.map((item) => {
    const sold = inRange
      .flatMap((sale) => sale.items)
      .filter((entry) => entry.menuItemId === item.id)
      .reduce((sum, entry) => sum + entry.qty, 0)
    const hpp = computeCogs([{ menuItemId: item.id, qty: 1 }], unitCosts)
    return { item, hpp, sold, insight: pricingInsight(item.price, hpp) }
  })

  const avgComboProfit = 13950
  const paybackCups = (capital: number) => Math.ceil(capital / avgComboProfit)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">{t('portal.analytics.title')}</h1>
        <div className="flex gap-2">
          {[7, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className={cn(
                'rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-sm font-semibold',
                rangeDays === days ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
              )}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('portal.dashboard.revenue')} value={formatRupiah(summary.revenue)} tone="lime" />
        <KpiCard label={t('franchise.calculator.cogs')} value={formatRupiah(summary.cogs)} />
        <KpiCard label={t('franchise.calculator.gross')} value={formatRupiah(summary.grossProfit)} tone="butter" />
        <KpiCard label={t('portal.dashboard.orders')} value={summary.count} />
      </div>

      <Card className="mt-4 p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-brick">
          {t('portal.analytics.revenueTrend')}
        </p>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-lime)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-lime)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,21,18,0.15)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.floor(daily.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} width={70} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(value) => formatRupiah(Number(value))} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-ketchup)" strokeWidth={2} fill="rgba(226,59,46,0.12)" />
              <Area type="monotone" dataKey="profit" stroke="var(--color-brick)" strokeWidth={2} fill="url(#profit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-brick">
            {t('portal.analytics.topItems')}
          </p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,21,18,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} width={60} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                <Bar dataKey="revenue" fill="var(--color-ketchup)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex gap-6">
            <div className="flex-1">
              <p className="font-mono text-xs uppercase tracking-wide text-brick">
                {t('portal.analytics.mix')}
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'combo', value: mix.combo },
                        { name: 'snack', value: mix.snack },
                        { name: 'drink', value: mix.drink },
                      ]}
                      dataKey="value"
                      innerRadius={35}
                      outerRadius={65}
                    >
                      {PIE_COLORS.map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-mono text-xs uppercase tracking-wide text-brick">
                {t('portal.analytics.payments')}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge tone="lime">{t('portal.cashier.qris')}</Badge>
                  <span className="font-mono">{formatRupiah(split.qris.revenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone="butter">{t('portal.cashier.cash')}</Badge>
                  <span className="font-mono">{formatRupiah(split.cash.revenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-brick">
          {t('portal.analytics.heatmap')}
        </p>
        <div className="mt-2 overflow-x-auto">
          <div className="grid min-w-[620px] grid-cols-[28px_repeat(24,1fr)] gap-0.5">
            {heat.map((row, weekday) =>
              row.map((cell, hour) => {
                const intensity = cell.count === 0 ? 0 : Math.min(4, Math.ceil(cell.count / 1.5))
                return (
                  <div
                    key={`${weekday}-${hour}`}
                    title={`${weekday} ${hour}:00 — ${cell.count} orders`}
                    className="aspect-square rounded-[2px]"
                    style={{ backgroundColor: HEAT_COLORS[intensity] }}
                  />
                )
              }),
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-x-auto p-4">
        <p className="font-mono text-xs uppercase tracking-wide text-brick">
          {t('portal.analytics.unitEcon')}
        </p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b-[3px] border-ink text-left">
              <th className="py-2 pr-3">{t('portal.inventory.item')}</th>
              <th className="py-2 pr-3">{t('portal.analytics.price')}</th>
              <th className="py-2 pr-3">{t('portal.analytics.hpp')}</th>
              <th className="py-2 pr-3">{t('portal.analytics.hppPct')}</th>
              <th className="py-2 pr-3">{t('portal.analytics.profit')}</th>
              <th className="py-2 pr-3">{t('portal.analytics.units')}</th>
              <th className="py-2">{t('portal.analytics.suggest')}</th>
            </tr>
          </thead>
          <tbody>
            {unitRows.map(({ item, hpp, sold, insight }) => (
              <tr key={item.id} className="border-b border-ink/10">
                <td className="py-2 pr-3 font-semibold text-ink">{t(item.nameKey)}</td>
                <td className="py-2 pr-3 font-mono">{formatRupiah(item.price)}</td>
                <td className="py-2 pr-3 font-mono">{formatRupiah(hpp)}</td>
                <td className="py-2 pr-3">
                  <span className={cn(insight.overTarget && 'font-bold text-ketchup')}>
                    {insight.hppPct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 pr-3 font-mono">{formatRupiah(item.price - hpp)}</td>
                <td className="py-2 pr-3 font-mono">{sold}</td>
                <td className="py-2">
                  {insight.suggestion ? (
                    <Badge tone="ketchup">{formatRupiah(insight.suggestion)}</Badge>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-brick">
            {t('portal.analytics.payback')}
          </p>
          {[500000, 1000000, 2000000].map((capital) => (
            <div key={capital} className="mt-2 flex items-center justify-between text-sm">
              <span className="font-mono">{formatRupiah(capital)}</span>
              <Badge tone="butter">{paybackCups(capital)} cups</Badge>
            </div>
          ))}
          <p className="mt-3 text-xs text-brick">{t('franchise.disclaimer')}</p>
        </Card>

        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-brick">
            {t('portal.analytics.whatIf')}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {COSTING.slice(0, 6).map((entry) => {
              const override = whatIf[entry.stockItemId]
              const linesTotal = entry.lines.reduce(
                (sum, line) => sum + (override && line === entry.lines[0] ? override : line.cost),
                0,
              )
              const portion = linesTotal / entry.yield
              return (
                <div key={entry.stockItemId} className="rounded-xl border-2 border-ink bg-cream-deep p-2">
                  <p className="text-xs font-semibold text-ink">{t(entry.nameKey)}</p>
                  <p className="font-mono text-[11px] text-brick">
                    {formatRupiahExact(batchTotal(entry))} / {entry.yield} = {formatRupiahExact(perPortionCost(entry))}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="number"
                      value={override ?? entry.lines[0].cost}
                      onChange={(event) =>
                        setWhatIf((current) => ({
                          ...current,
                          [entry.stockItemId]: Number(event.target.value),
                        }))
                      }
                      className="w-24 rounded-full border-2 border-ink px-2 py-0.5 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => restock(entry.stockItemId, 0, roundedPortionCost({ ...entry, lines: [{ ...entry.lines[0], cost: override ?? entry.lines[0].cost }] }), 'what-if applied')}
                      className="rounded-full border-2 border-ink bg-butter px-2 py-0.5 text-[10px] font-bold"
                    >
                      {t('costing.applyCost')}
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-brick">
                    {t('costing.perPortion')}: {formatRupiahExact(portion)}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </section>
  )
}
