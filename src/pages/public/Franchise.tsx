import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Accordion from '@radix-ui/react-accordion'
import { FRANCHISE_PACKAGES } from '@/data/packages'
import { formatRupiah } from '@/lib/money'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { Sticker } from '@/components/brand/Sticker'
import { EarningsCalculator } from '@/components/franchise/EarningsCalculator'
import { ApplyForm } from '@/components/franchise/ApplyForm'

export default function Franchise() {
  const { t } = useTranslation()
  const [selectedPackage, setSelectedPackage] = useState<'regular' | 'large' | 'jumbo'>('regular')
  const faqItems = (t('franchise.faq', { returnObjects: true }) ?? []) as Array<{ q: string; a: string }>

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl font-bold text-ketchup">{t('franchise.title')}</h1>
      <p className="mt-1 text-lg text-ink/80">{t('franchise.sub')}</p>

      <div className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">
          {t('franchise.packages.title')}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {FRANCHISE_PACKAGES.map((pkg, index) => (
            <Card key={pkg.id} className="relative flex flex-col p-6">
              {index === 1 ? (
                <div className="absolute -right-2 -top-3">
                  <Sticker tone="lime">{t('combo.bestValue')}</Sticker>
                </div>
              ) : null}
              <h3 className="font-display text-2xl font-semibold text-ink">{t(pkg.nameKey)}</h3>
              <Badge tone="ink">{t(pkg.formatKey)}</Badge>
              <p className="mt-3 font-mono text-sm text-brick">
                {formatRupiah(pkg.investmentMin)} – {formatRupiah(pkg.investmentMax)}
              </p>
              <dl className="mt-3 space-y-1 text-sm text-ink/80">
                <div className="flex justify-between gap-2">
                  <dt>{t('franchise.spaceLabel')}</dt>
                  <dd>{t(pkg.spaceKey)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t('franchise.staffLabel')}</dt>
                  <dd>{t(pkg.staffKey)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-ink/70">{t(pkg.inclusionsKey)}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPackage(pkg.id)
                  document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="mt-4 rounded-full border-[3px] border-ink bg-butter px-4 py-2 font-display font-semibold text-ink shadow-sticker"
              >
                {t('franchise.pickPackage')}
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <EarningsCalculator />
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{t('franchise.faqTitle')}</h2>
          <Accordion.Root type="single" collapsible className="mt-4">
            {faqItems.map((entry) => (
              <Accordion.Item
                key={entry.q}
                value={entry.q}
                className="mb-2 rounded-xl border-[3px] border-ink bg-cream"
              >
                <Accordion.Trigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-display font-semibold text-ink">
                  {entry.q}
                  <span aria-hidden>+</span>
                </Accordion.Trigger>
                <Accordion.Content className="px-4 pb-3 text-sm text-ink/80">
                  {entry.a}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        <div id="apply">
          <ApplyForm defaultPackage={selectedPackage} />
        </div>
      </div>

      <p className="mt-10 text-sm text-brick">{t('franchise.disclaimer')}</p>
    </section>
  )
}
