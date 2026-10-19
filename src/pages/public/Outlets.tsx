import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CravingLine } from '@/components/outlets/CravingLine'
import { OutletCard } from '@/components/outlets/OutletCard'
import { useOutlets } from '@/hooks/useOutletLive'

export default function Outlets() {
  const { t } = useTranslation()
  const outlets = useOutlets()
  const [selected, setSelected] = useState(outlets[0].slug)
  const sorted = useMemo(() => [...outlets].sort((a, b) => a.lineOrder - b.lineOrder), [outlets])

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl font-bold text-ketchup">{t('outlets.title')}</h1>
      <p className="mt-1 text-lg text-ink/80">{t('outlets.sub')}</p>

      <div className="mt-8 rounded-2xl border-[3px] border-ink bg-cream-deep p-6">
        <CravingLine outlets={sorted} onSelect={setSelected} selectedSlug={selected} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((outlet) => (
          <OutletCard key={outlet.slug} outlet={outlet} />
        ))}
      </div>
    </section>
  )
}
