import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CravingLine } from '@/components/outlets/CravingLine'
import { OutletCard } from '@/components/outlets/OutletCard'
import { useOutlets } from '@/hooks/useOutletLive'
import { cn } from '@/lib/cn'

export default function Outlets() {
  const { t } = useTranslation()
  const outlets = useOutlets()
  const [selected, setSelected] = useState(outlets[0].slug)
  const sorted = useMemo(() => [...outlets].sort((a, b) => a.lineOrder - b.lineOrder), [outlets])

  const handleSelect = (slug: string) => {
    setSelected(slug)
    const el = document.getElementById(`outlet-card-${slug}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl font-bold text-ketchup">{t('outlets.title')}</h1>
      <p className="mt-1 text-lg text-ink/80">{t('outlets.sub')}</p>

      <div className="mt-8 rounded-2xl border-[3px] border-ink bg-cream-deep p-6">
        <CravingLine outlets={sorted} onSelect={handleSelect} selectedSlug={selected} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((outlet) => (
          <div
            key={outlet.slug}
            id={`outlet-card-${outlet.slug}`}
            className={cn(
              'rounded-2xl transition-all duration-300',
              outlet.slug === selected ? 'ring-4 ring-ketchup ring-offset-2' : '',
            )}
          >
            <OutletCard outlet={outlet} />
          </div>
        ))}
      </div>
    </section>
  )
}
