import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, ShoppingBag, Smartphone } from 'lucide-react'
import { TransitionLink } from '@/anim/TransitionLink'
import { Badge } from '@/components/brand/Badge'
import { Card } from '@/components/brand/Card'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Drip } from '@/components/brand/Drip'
import { Marquee } from '@/components/brand/Marquee'
import { Photo } from '@/components/brand/Photo'
import { Sparkle } from '@/components/brand/Sparkle'
import { Sticker } from '@/components/brand/Sticker'
import { Preloader } from '@/components/home/Preloader'
import { HeroAssembly } from '@/components/home/HeroAssembly'
import { MenuItemCard } from '@/components/menu/MenuItemCard'
import { MENU_BY_ID, MENU_ITEMS } from '@/data/menu'
import type { FlavorKey } from '@/data/types'
import { isOpenNow } from '@/lib/hours'
import { formatK } from '@/lib/money'
import { cn } from '@/lib/cn'
import { useAvailability, useOutlets } from '@/hooks/useOutletLive'

const CupCanvas = lazy(() => import('@/three/CupCanvas'))

const FLAVORS: { key: FlavorKey; itemId: string; color: string }[] = [
  { key: 'bolo', itemId: 'nachos-bolo', color: 'var(--color-checker)' },
  { key: 'mush', itemId: 'nachos-mush', color: '#8B5E34' },
  { key: 'cheese', itemId: 'nachos-cheese', color: 'var(--color-sun)' },
]

export default function Home() {
  const { t } = useTranslation()
  const [flavor, setFlavor] = useState<FlavorKey>('bolo')
  const [heroReady, setHeroReady] = useState(false)
  const activeFlavor = FLAVORS.find((entry) => entry.key === flavor) ?? FLAVORS[0]
  const activeItem = MENU_BY_ID[activeFlavor.itemId]
  const combos = MENU_ITEMS.filter((item) => item.kind === 'combo')
  const outlets = useOutlets()
  const anggrek = outlets[0]
  const availability = useAvailability(anggrek.slug)

  return (
    <>
      <Preloader onComplete={() => setHeroReady(true)} />
      <HeroAssembly ready={heroReady} />

      <div className="border-y-[3px] border-ink bg-ketchup py-3">
        <Marquee speed={22}>
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className="font-chunky text-2xl uppercase tracking-wide text-cream"
            >
              {t('scroll.end')} ✦
            </span>
          ))}
        </Marquee>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-4xl font-bold text-ink">
          {t('flavors.title')}
        </h2>
        <p className="mt-2 text-center text-ink/70">{t('flavors.sub')}</p>

        <div
          className="mt-8 grid items-center gap-6 rounded-[2rem] border-[3px] border-ink p-6 transition-colors duration-500 md:grid-cols-2 md:p-8"
          style={{
            backgroundColor: `color-mix(in srgb, ${activeFlavor.color} 16%, var(--color-cream-deep))`,
          }}
        >
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs">
            <Suspense fallback={null}>
              <CupCanvas flavor={flavor} drink="tea-cloudy" draggable className="absolute inset-0" />
            </Suspense>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center gap-4" role="group" aria-label={t('flavors.title')}>
              {FLAVORS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setFlavor(entry.key)}
                  aria-pressed={flavor === entry.key}
                  aria-label={t(MENU_BY_ID[entry.itemId].nameKey)}
                  title={t(MENU_BY_ID[entry.itemId].nameKey)}
                  className={cn(
                    'h-20 w-20 rounded-full border-[3px] border-ink transition-transform',
                    flavor === entry.key ? 'scale-110 shadow-sticker' : 'hover:-translate-y-1',
                  )}
                  style={{ backgroundColor: entry.color }}
                />
              ))}
            </div>
            <p className="mt-6 text-center font-display text-2xl font-semibold text-ink" aria-live="polite">
              {t(activeItem.nameKey)}
            </p>
            <p className="mt-2 text-center text-ink/80">{t(activeItem.descKey)}</p>
          </div>
        </div>
      </section>

      <Drip color="var(--color-butter)" />

      <section className="bg-butter/30 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-3 py-1 shadow-sm">
              <Sparkle className="h-4 w-4 text-sun" />
              <span className="font-mono text-xs font-bold uppercase tracking-wide text-ink">KeCup Innovation</span>
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">{t('scroll.end')}</h2>
            <p className="mt-4 text-lg text-ink/80">{t('explode.cup')}</p>
            <TransitionLink
              to="/build"
              className="mt-6 inline-flex rounded-full border-[3px] border-ink bg-ketchup px-7 py-3 font-display text-lg font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              {t('hero.ctaOrder')}
            </TransitionLink>
          </div>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-script text-4xl text-ketchup">{t('home.oneHand.title')}</p>
              <Sparkle className="h-6 w-6 text-sun" />
            </div>
            <p className="mt-2 text-sm text-ink/70">
              {t('explode.cup')}
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-cream p-3 shadow-sticker transition-transform hover:-translate-y-0.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-butter text-ink">
                  <Smartphone size={20} />
                </span>
                <span className="font-display font-semibold text-ink">{t('home.oneHand.text')}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-cream p-3 shadow-sticker transition-transform hover:-translate-y-0.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-lime text-ink">
                  <MessageCircle size={20} />
                </span>
                <span className="font-display font-semibold text-ink">{t('home.oneHand.scroll')}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-cream p-3 shadow-sticker transition-transform hover:-translate-y-0.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-tangerine/30 text-ink">
                  <ShoppingBag size={20} />
                </span>
                <span className="font-display font-semibold text-ink">{t('home.oneHand.bag')}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <CheckerBand cell={18} rows={1} />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold text-ink">{t('combo.title')}</h2>
            <p className="mt-1 text-ink/70">{t('combo.save')}</p>
          </div>
          <Sticker tone="ketchup" rotate={-4}>
            {t('home.saveSticker', { amount: formatK(7000) })}
          </Sticker>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((item) => (
            <MenuItemCard key={item.id} item={item} available={availability[item.id] !== false} />
          ))}
        </div>
      </section>

      <section className="border-t-[3px] border-ink bg-cream-deep/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl font-bold text-ink">{t('home.igWall.title')}</h2>
              <p className="mt-1 text-ink/70">{t('home.igWall.sub')}</p>
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-brick">#KeepCravings</span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 sm:justify-start">
            {[
              { key: 'menu-print-2', rot: -3, caption: '#KeCupMenu' },
              { key: 'combo-bolo', rot: 2, caption: 'Bolo Craving Cup' },
              { key: 'logo', rot: -2, caption: 'Sealed with a kecup' },
              { key: 'combo-cheese', rot: 3, caption: 'Cheesy Goodness' },
              { key: 'menu-print-1', rot: -1, caption: 'Build Your Own' },
            ].map((item, index) => (
              <div
                key={index}
                className="w-48 cursor-pointer rounded-xl border-[3px] border-ink bg-cream p-2.5 pb-4 shadow-sticker transition-all duration-300 hover:z-20 hover:scale-105 hover:rotate-0"
                style={{ transform: `rotate(${item.rot}deg)` }}
              >
                <Photo photoKey={item.key} className="border-0" imgClassName="aspect-[4/5] rounded-lg" />
                <p className="mt-2 text-center font-script text-xl text-ketchup">{item.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-display text-3xl font-bold text-ink">{t('outlets.title')}</h2>
            <ul className="mt-4 space-y-2">
              {outlets.slice(0, 3).map((outlet) => {
                const status = isOpenNow(outlet, new Date())
                return (
                  <li key={outlet.slug} className="flex items-center justify-between gap-3">
                    <span className="text-ink">{outlet.name}</span>
                    <Badge tone={status.open ? 'lime' : 'ketchup'}>
                      {status.open ? t('outlets.open') : t('outlets.closed')}
                    </Badge>
                  </li>
                )
              })}
            </ul>
            <TransitionLink
              to="/outlets"
              className="mt-4 inline-flex rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display font-semibold text-ink shadow-sticker"
            >
              {t('outlets.details')}
            </TransitionLink>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-3xl font-bold text-ink">{t('franchise.title')}</h2>
            <p className="mt-2 text-ink/70">{t('franchise.sub')}</p>
            <TransitionLink
              to="/franchise"
              className="mt-4 inline-flex rounded-full border-[3px] border-ink bg-ketchup px-5 py-2 font-display font-semibold text-cream shadow-sticker"
            >
              {t('franchise.apply')}
            </TransitionLink>
          </Card>
        </div>
      </section>
    </>
  )
}
