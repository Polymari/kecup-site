import { useTranslation } from 'react-i18next'
import { Arch } from '@/components/brand/Arch'
import { Badge } from '@/components/brand/Badge'
import { Button } from '@/components/brand/Button'
import { Card } from '@/components/brand/Card'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Drip } from '@/components/brand/Drip'
import { Lips } from '@/components/brand/Lips'
import { Placeholder } from '@/components/brand/Placeholder'
import { PriceTag } from '@/components/brand/PriceTag'
import { Sparkle } from '@/components/brand/Sparkle'
import { Sticker } from '@/components/brand/Sticker'
import { Wordmark } from '@/components/brand/Wordmark'
import { DEFAULT_UNIT_COSTS } from '@/data/costing'
import { MENU_ITEMS } from '@/data/menu'
import { computeCogs } from '@/lib/recipes'
import { formatRupiah } from '@/lib/money'
import { pricingInsight } from '@/lib/pricing'

const PALETTE = [
  ['cream', '#FBF4E3'],
  ['cream-deep', '#F2E6C9'],
  ['butter', '#F7D774'],
  ['sun', '#F2B705'],
  ['ketchup', '#E23B2E'],
  ['checker', '#B01E2E'],
  ['ink', '#4A1512'],
  ['brick', '#7A1F1A'],
  ['tangerine', '#E8641E'],
  ['gold', '#E0A32E'],
  ['lime', '#CBE07A'],
] as const

function UnitEconomicsTable() {
  const { t } = useTranslation()
  const rows = MENU_ITEMS.map((item) => {
    const hpp = computeCogs([{ menuItemId: item.id, qty: 1 }], DEFAULT_UNIT_COSTS)
    return { item, hpp, insight: pricingInsight(item.price, hpp) }
  })

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="mb-2 text-left font-mono text-xs uppercase tracking-wide text-brick">
        {t('portal.analytics.unitEcon')} — DATA-MODEL §4
      </caption>
      <thead>
        <tr className="border-b-[3px] border-ink text-left">
          <th className="py-1 pr-3">Item</th>
          <th className="py-1 pr-3">{t('portal.analytics.price')}</th>
          <th className="py-1 pr-3">{t('portal.analytics.hpp')}</th>
          <th className="py-1 pr-3">{t('portal.analytics.hppPct')}</th>
          <th className="py-1 pr-3">{t('portal.analytics.profit')}</th>
          <th className="py-1">{t('portal.analytics.suggest')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ item, hpp, insight }) => (
          <tr key={item.id} className="border-b border-ink/20">
            <td className="py-1 pr-3 font-semibold">{t(`${item.nameKey}`)}</td>
            <td className="py-1 pr-3">{formatRupiah(item.price)}</td>
            <td className="py-1 pr-3">{formatRupiah(hpp)}</td>
            <td className="py-1 pr-3">
              <span className={insight.overTarget ? 'font-bold text-ketchup' : ''}>
                {insight.hppPct.toFixed(1)}%
              </span>
            </td>
            <td className="py-1 pr-3">{formatRupiah(item.price - hpp)}</td>
            <td className="py-1">{insight.suggestion ? formatRupiah(insight.suggestion) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function BrandLab() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-ketchup">Brand Lab</h1>
      <p className="mt-1 text-ink/70">Styleguide — primitives, tokens, and unit economics.</p>

      <h2 className="mt-10 font-display text-2xl font-semibold">Palette</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {PALETTE.map(([name, hex]) => (
          <div key={name} className="text-center">
            <div
              className="h-16 w-16 rounded-xl border-[3px] border-ink"
              style={{ backgroundColor: hex }}
            />
            <p className="mt-1 font-mono text-xs">{name}</p>
            <p className="font-mono text-[10px] text-brick">{hex}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Typography</h2>
      <div className="mt-3 space-y-2">
        <p className="font-display text-4xl font-semibold">Fredoka display</p>
        <p className="font-chunky text-4xl">Lilita One chunky</p>
        <p className="font-fat text-3xl">Bagel Fat One</p>
        <p className="font-script text-4xl text-ketchup">Sacramento script</p>
        <p className="text-lg">Plus Jakarta Sans body copy in maroon ink.</p>
        <p className="font-mono text-sm">Space Mono — receipts &amp; data</p>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Primitives</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 p-5">
          <Wordmark className="h-10 w-auto" />
          <p className="font-mono text-xs text-brick">Wordmark</p>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-5">
          <Lips className="h-8 w-14 text-ketchup" />
          <Sparkle className="h-6 w-6 text-sun" />
          <p className="font-mono text-xs text-brick">Lips + Sparkle</p>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-5">
          <Sticker tone="lime">BEST VALUE</Sticker>
          <Sticker tone="ketchup" rotate={5}>
            NEW!
          </Sticker>
          <p className="font-mono text-xs text-brick">Sticker</p>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-5">
          <PriceTag price="25k" />
          <PriceTag price="35k" compare="42k" />
          <p className="font-mono text-xs text-brick">PriceTag</p>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-5">
          <div className="flex gap-2">
            <Badge tone="ink">INK</Badge>
            <Badge tone="lime">LIME</Badge>
            <Badge tone="ketchup">KETCHUP</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
          </div>
          <p className="font-mono text-xs text-brick">Badge + Button</p>
        </Card>
        <Card className="flex flex-col items-center gap-3 p-5">
          <Arch className="flex h-28 w-32 items-center justify-center">
            <Lips className="h-6 w-11 text-ketchup" />
          </Arch>
          <p className="font-mono text-xs text-brick">Arch</p>
        </Card>
        <Placeholder label="combo-bolo" ratio="1 / 1" />
        <div className="overflow-hidden rounded-xl border-[3px] border-ink">
          <CheckerBand cell={18} rows={2} />
          <div className="p-4">
            <p className="font-mono text-xs text-brick">CheckerBand + Drip</p>
          </div>
          <Drip color="var(--color-ketchup)" flip />
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Unit economics</h2>
      <Card className="mt-4 overflow-x-auto p-5">
        <UnitEconomicsTable />
      </Card>
    </section>
  )
}
