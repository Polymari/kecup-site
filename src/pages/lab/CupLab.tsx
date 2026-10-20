import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DrinkKey, FlavorKey } from '@/data/types'
import { gsap } from '@/anim/gsap'
import CupCanvas from '@/three/CupCanvas'
import { assemblyTimeline } from '@/three/assembly'
import { DEFAULT_FILL, createCupState } from '@/three/cupState'
import { cn } from '@/lib/cn'

const FLAVORS: (FlavorKey | null)[] = ['bolo', 'mush', 'cheese', null]
const DRINKS: (DrinkKey | null)[] = ['tea-cloudy', 'tea-fizzy', null]

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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border-[3px] border-ink px-4 py-1.5 font-display text-sm font-semibold',
        active ? 'bg-ketchup text-cream' : 'bg-cream text-ink',
      )}
    >
      {children}
    </button>
  )
}

export default function CupLab() {
  const { t } = useTranslation()
  const [flavor, setFlavor] = useState<FlavorKey | null>('bolo')
  const [drink, setDrink] = useState<DrinkKey | null>('tea-cloudy')
  const [explode, setExplode] = useState(0)
  const [fill, setFill] = useState(DEFAULT_FILL)
  // One proxy per canvas so both styles animate in lockstep.
  const toonState = useMemo(() => createCupState(), [])
  const realState = useMemo(() => createCupState(), [])
  const states = useMemo(() => [toonState, realState], [toonState, realState])

  useEffect(() => {
    gsap.to(states, { explode, fill, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
  }, [states, explode, fill])

  const replay = () => {
    setExplode(0)
    setFill(DEFAULT_FILL)
    states.forEach((state) => assemblyTimeline(state, { reset: true }))
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-ketchup">Cup Lab</h1>
      <p className="mt-1 text-ink/70">Toon vs realistic — same geometry, two material sets. Drag a cup to turn it.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_280px]">
        <div className="rounded-[2rem] border-[3px] border-ink bg-cream-deep p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="font-display font-semibold text-ink">Toon</p>
            <FpsMeter />
          </div>
          <CupCanvas
            flavor={flavor}
            drink={drink}
            style="toon"
            state={toonState}
            draggable
            className="aspect-[4/5] w-full"
          />
        </div>

        <div className="rounded-[2rem] border-[3px] border-ink bg-cream-deep p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="font-display font-semibold text-ink">Realistic</p>
            <FpsMeter />
          </div>
          <CupCanvas
            flavor={flavor}
            drink={drink}
            style="realistic"
            state={realState}
            draggable
            className="aspect-[4/5] w-full"
          />
        </div>

        <div className="grid content-start gap-5">
          <div>
            <p className="font-display font-semibold text-ink">{t('build.sauce')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLAVORS.map((entry) => (
                <Chip key={entry ?? 'none'} active={flavor === entry} onClick={() => setFlavor(entry)}>
                  {entry ?? 'none'}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="font-display font-semibold text-ink">{t('build.sip')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DRINKS.map((entry) => (
                <Chip key={entry ?? 'none'} active={drink === entry} onClick={() => setDrink(entry)}>
                  {entry ?? 'empty'}
                </Chip>
              ))}
            </div>
          </div>

          <label className="grid gap-1 font-display text-sm font-semibold text-ink">
            Explode · {explode.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              onChange={(event) => setExplode(Number(event.target.value))}
              className="accent-ketchup"
            />
          </label>

          <label className="grid gap-1 font-display text-sm font-semibold text-ink">
            Fill · {fill.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={fill}
              onChange={(event) => setFill(Number(event.target.value))}
              className="accent-ketchup"
            />
          </label>

          <button
            type="button"
            onClick={replay}
            className="rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display font-semibold text-ink shadow-sticker"
          >
            Replay assembly
          </button>
        </div>
      </div>
    </section>
  )
}
