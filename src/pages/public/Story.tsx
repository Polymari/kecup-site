import { useTranslation } from 'react-i18next'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Drip } from '@/components/brand/Drip'
import { Lips } from '@/components/brand/Lips'
import { Photo } from '@/components/brand/Photo'
import { Sparkle } from '@/components/brand/Sparkle'
import { Card } from '@/components/brand/Card'

const MILESTONES = [
  { year: '2024', titleKey: 'story.title', note: 'A class project gets a name.' },
  { year: '2025', titleKey: 'story.nameTitle', note: 'First booth at BINUS Anggrek.' },
  { year: '2026', titleKey: 'franchise.title', note: 'The Craving Line opens.' },
]

const VALUES = ['One hand', 'Crunch first', 'Share the kecup']

export default function Story() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-5xl font-bold text-ketchup">{t('story.title')}</h1>

      <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
        <Card className="relative p-8">
          <Sparkle className="absolute right-6 top-6 h-6 w-6 text-sun" />
          <h2 className="font-display text-3xl font-semibold text-ink">{t('story.nameTitle')}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">{t('story.name')}</p>
          <Lips className="mt-6 h-8 w-14 text-ketchup" />
        </Card>
        <Photo photoKey="logo" className="mx-auto w-full max-w-sm" />
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-ink">{t('story.values')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {VALUES.map((value) => (
            <span
              key={value}
              className="rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display text-lg font-semibold text-ink shadow-sticker"
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-ink">{t('story.timeline')}</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {MILESTONES.map((milestone) => (
            <li key={milestone.year}>
              <Card className="h-full p-5">
                <p className="font-mono text-sm text-ketchup">{milestone.year}</p>
                <p className="mt-2 font-display text-lg font-semibold text-ink">{milestone.note}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-ink">{t('story.team')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {['team', 'team', 'team', 'team'].map((key, index) => (
            <Photo key={index} photoKey={key} className="rotate-1 bg-cream" />
          ))}
        </div>
      </div>

      <div className="mt-16">
        <Drip color="var(--color-butter)" />
        <CheckerBand cell={22} rows={2} />
      </div>
    </section>
  )
}
