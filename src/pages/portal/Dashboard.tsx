import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MENU_BY_ID } from '@/data/menu'
import { byDay, summarize } from '@/lib/analytics'
import { dateKey, dateKeyToUtc } from '@/lib/wib'
import { formatRupiah } from '@/lib/money'
import { isOpenNow } from '@/lib/hours'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { KpiCard } from '@/components/portal/KpiCard'
import { usePortal } from '@/store/portal'
import { useOutlet } from '@/hooks/useOutletLive'

export default function Dashboard() {
  const { t } = useTranslation()
  const outletSlug = usePortal((state) => state.outletSlug)
  const outlet = useOutlet(outletSlug)
  const sales = usePortal((state) => state.sales)
  const stock = usePortal((state) => state.stock)
  const updateSettings = usePortal((state) => state.updateSettings)
  const settings = usePortal((state) => state.settings[outletSlug])

  const todayKey = dateKey(new Date())
  const todaySales = useMemo(
    () => sales.filter((sale) => dateKey(new Date(sale.createdAt)) === todayKey),
    [sales, todayKey],
  )
  const today = summarize(todaySales)
  const lowRows = stock.filter((row) => row.qty < row.lowThreshold)

  const last7 = useMemo(() => {
    const from = dateKey(new Date(dateKeyToUtc(todayKey).getTime() - 6 * 86_400_000))
    return byDay(sales, from, todayKey).map((bucket) => ({
      day: bucket.dateKey.slice(5),
      revenue: bucket.revenue,
    }))
  }, [sales, todayKey])

  const status = outlet ? isOpenNow(outlet, new Date()) : null

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{t('portal.dashboard.greeting')}</h1>
          <p className="mt-1 text-ink/70">{outlet?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => updateSettings(outletSlug, { temporarilyClosed: !settings?.temporarilyClosed })}
          className={`rounded-full border-[3px] border-ink px-5 py-2 font-display font-semibold shadow-sticker ${
            settings?.temporarilyClosed ? 'bg-ketchup text-cream' : 'bg-lime text-ink'
          }`}
        >
          {settings?.temporarilyClosed ? t('status.temporarilyClosed') : t('status.open')}
        </button>
      </div>

      <h2 className="mt-6 font-display text-xl font-semibold text-ink">
        {t('portal.dashboard.today')}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('portal.dashboard.revenue')}
          value={formatRupiah(today.revenue)}
          tone="lime"
        />
        <KpiCard label={t('portal.dashboard.orders')} value={today.count} />
        <KpiCard
          label={t('portal.dashboard.avgTicket')}
          value={formatRupiah(today.avgTicket)}
        />
        <KpiCard
          label={t('portal.dashboard.status')}
          value={
            <Badge tone={status?.open ? 'lime' : 'ketchup'}>
              {status?.open ? t('outlets.open') : t('outlets.closed')}
            </Badge>
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-brick">
            {t('portal.dashboard.sparkline')}
          </p>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-ketchup)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-ketchup)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-ketchup)"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-brick">
            {t('portal.dashboard.alerts')}
          </p>
          {lowRows.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">—</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowRows.map((row) => (
                <li key={row.stockItemId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink">{row.stockItemId}</span>
                  <Badge tone={row.qty <= 0 ? 'ketchup' : 'sun'}>
                    {row.qty <= 0 ? t('status.outOfStock') : t('status.lowStock')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-mono text-xs text-brick">
            {t('portal.dashboard.orders')}: {sales.length} ·{' '}
            {sales.filter((sale) => sale.items.some((item) => MENU_BY_ID[item.menuItemId]?.kind === 'combo')).length}{' '}
            combo
          </p>
        </Card>
      </div>
    </section>
  )
}
