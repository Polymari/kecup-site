import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from '@/anim/gsap'
import { TransitionLink } from '@/anim/TransitionLink'
import { Lips } from '@/components/brand/Lips'
import { MagneticButton } from '@/components/brand/MagneticButton'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { createCupState } from '@/three/cupState'

const CupCanvas = lazy(() => import('@/three/CupCanvas'))

const CALLOUTS = ['explode.tray', 'explode.tea', 'explode.cup'] as const

export function HeroAssembly({ ready }: { ready: boolean }) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const cupState = useMemo(() => createCupState(), [])

  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const stampRef = useRef<HTMLDivElement>(null)
  const ctasRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLParagraphElement>(null)
  const calloutRefs = useRef<Array<HTMLLIElement | null>>([])
  const introduced = useRef(false)

  useEffect(() => {
    if (!ready || introduced.current) return
    introduced.current = true

    const section = sectionRef.current
    if (!section) return

    if (reducedMotion) {
      gsap.set([headlineRef.current, ctasRef.current, closeRef.current], { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      const chars = headlineRef.current?.querySelectorAll('[data-char]')
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (chars && chars.length) {
        intro.from(chars, { y: 60, opacity: 0, stagger: 0.05, duration: 0.7 })
      }
      intro.from(stampRef.current, { scale: 0, rotate: -40, duration: 0.45, ease: 'back.out(2)' }, '-=0.15')
      intro.from(ctasRef.current, { y: 24, opacity: 0, duration: 0.5 }, '-=0.2')

      const scrub = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.6,
        },
      })
      scrub
        .to([headlineRef.current, ctasRef.current], { opacity: 0, y: -60, duration: 0.25 }, 0)
        .to(cupState, { explode: 1, duration: 0.35 }, 0.2)
      calloutRefs.current.forEach((callout, index) => {
        scrub.to(callout, { opacity: 1, x: 0, duration: 0.12 }, 0.28 + index * 0.1)
      })
      scrub
        .to(cupState, { explode: 0, spin: cupState.spin + Math.PI * 2, duration: 0.3 }, 0.7)
        .to(closeRef.current, { opacity: 1, y: 0, duration: 0.15 }, 0.88)
    }, section)

    return () => ctx.revert()
  }, [ready, reducedMotion, cupState])

  const splitHeadline = (text: string) =>
    text.split('').map((char, index) => (
      <span key={index} data-char className="inline-block">
        {char === ' ' ? '\u00a0' : char}
      </span>
    ))

  return (
    <section ref={sectionRef} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Suspense fallback={null}>
          <CupCanvas
            flavor={null}
            drink={null}
            state={cupState}
            interactive={!reducedMotion}
            className="h-[70vh] w-full max-w-3xl opacity-90"
          />
        </Suspense>
      </div>

      <div className="relative z-10 text-center">
        <h1
          ref={headlineRef}
          className="font-display text-7xl font-bold text-ketchup drop-shadow-sm sm:text-8xl"
        >
          {splitHeadline('KeCup')}
        </h1>
        <div ref={stampRef} className="mx-auto -mt-2 w-fit">
          <Lips className="h-7 w-12 rotate-12 text-ketchup" />
        </div>
        <p className="mt-4 max-w-2xl font-display text-2xl text-ink sm:text-4xl">{t('hero.tagline')}</p>
        <p className="mt-3 max-w-xl text-lg text-ink/80">{t('hero.sub')}</p>

        <div ref={ctasRef} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <MagneticButton>
            <TransitionLink
              to="/build"
              className="rounded-full border-[3px] border-ink bg-ketchup px-7 py-3 font-display text-lg font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              {t('hero.ctaOrder')}
            </TransitionLink>
          </MagneticButton>
          <MagneticButton>
            <TransitionLink
              to="/menu"
              className="rounded-full border-[3px] border-ink bg-butter px-7 py-3 font-display text-lg font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
            >
              {t('hero.ctaMenu')}
            </TransitionLink>
          </MagneticButton>
        </div>
      </div>

      <ul className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 space-y-24 lg:block">
        {CALLOUTS.map((key, index) => (
          <li
            key={key}
            ref={(node) => {
              calloutRefs.current[index] = node
            }}
            className="opacity-0"
            style={{ transform: 'translateX(30px)' }}
          >
            <span className="block max-w-[220px] rounded-xl border-[3px] border-ink bg-cream/95 px-3 py-2 font-display text-sm font-semibold text-ink shadow-sticker">
              {t(key)}
            </span>
          </li>
        ))}
      </ul>

      <p
        ref={closeRef}
        className="absolute bottom-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap font-display text-xl font-semibold text-brick opacity-0 sm:text-2xl"
        style={{ transform: 'translate(-50%, 16px)' }}
      >
        {t('scroll.end')}
      </p>
    </section>
  )
}
