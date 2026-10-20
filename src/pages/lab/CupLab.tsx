import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DrinkKey, FlavorKey } from '@/data/types'
import CupCanvas from '@/three/CupCanvas'
import { cn } from '@/lib/cn'

const FLAVORS: FlavorKey[] = ['bolo', 'mush', 'cheese']
const DRINKS: DrinkKey[] = ['tea-cloudy', 'tea-fizzy']

function FpsMeter() {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = () => {
      frames.current += 1
      const now = performance.now()
      if (now - last >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last)))
        frames.current = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <span className="font-mono text-xs text-brick">{fps} FPS</span>
}

export default function CupLab() {
  const { t } = useTranslation()
  const [flavor, setFlavor] = useState<FlavorKey>('bolo')
  const [drink, setDrink] = useState<DrinkKey>('tea-cloudy')

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-ketchup">Cup Lab</h1>
      <p className="mt-1 text-ink/70">Toon vs realistic — same geometry, two material sets.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_280px]">
        <div className="rounded-[2rem] border-[3px] border-ink bg-cream-deep p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="font-display font-semibold text-ink">Toon</p>
            <FpsMeter />
          </div>
          <CupCanvas flavor={flavor} drink={drink} style="toon" className="aspect-[4/5] w-full" />
        </div>

        <div className="rounded-[2rem] border-[3px] border-ink bg-cream-deep p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="font-display font-semibold text-ink">Realistic</p>
            <FpsMeter />
          </div>
          <CupCanvas flavor={flavor} drink={drink} style="realistic" className="aspect-[4/5] w-full" />
        </div>

        <div className="grid content-start gap-4">
          <div>
            <p className="font-display font-semibold text-ink">{t('build.sauce')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLAVORS.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setFlavor(entry)}
                  className={cn(
                    'rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-sm font-semibold',
                    flavor === entry ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
                  )}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-display font-semibold text-ink">{t('build.sip')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DRINKS.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setDrink(entry)}
                  className={cn(
                    'rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-sm font-semibold',
                    drink === entry ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
                  )}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
