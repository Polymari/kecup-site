import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from '@/anim/gsap'
import { TransitionLink } from '@/anim/TransitionLink'
import { Lips } from '@/components/brand/Lips'
import { MagneticButton } from '@/components/brand/MagneticButton'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { assemblyTimeline } from '@/three/assembly'
import { createIntroState } from '@/three/cupState'

const CupCanvas = lazy(() => import('@/three/CupCanvas'))

const CALLOUTS = ['explode.tray', 'explode.tea', 'explode.cup'] as const

export function HeroAssembly({ ready }: { ready: boolean }) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  // Starts disassembled; the intro timeline builds the cup piece by piece.
  const cupState = useMemo(() => createIntroState(), [])

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const stampRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const ctasRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLParagraphElement>(null)
  const calloutRefs = useRef<Array<HTMLLIElement | null>>([])

  // Layout effect on purpose: ScrollTrigger's pin wraps the section in a
  // pin-spacer, which must be reverted *before* React removes the DOM on a
  // route change, otherwise React's removeChild throws (NotFoundError).
  useLayoutEffect(() => {
    if (!ready) return
    const section = sectionRef.current
    if (!section) return

    // Reduced motion renders the static poster and skips every timeline.
    if (reducedMotion) return

    const ctx = gsap.context(() => {
      const chars = headlineRef.current?.querySelectorAll('[data-char]')

      // 1) Autoplay assembly: cup drops in, tea pours, bowl clicks on, chips
      //    rain, sauce lands with a splat, the straw stabs through.
      const intro = assemblyTimeline(cupState)
      if (chars && chars.length) {
        intro.from(chars, { y: 60, opacity: 0, stagger: 0.05, duration: 0.7, ease: 'power3.out' }, 0.2)
      }
      intro
        .from(copyRef.current, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.75)
        .from(stampRef.current, { scale: 0, rotate: -40, duration: 0.45, ease: 'back.out(2)' }, 1.0)
        .from(ctasRef.current, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out' }, 1.2)

      // 2) Scroll: copy exits, the cup glides to centre, explodes into an
      //    annotated view, then reassembles with a full spin.
      const media = gsap.matchMedia()
      media.add(
        { desktop: '(min-width: 1024px)', mobile: '(max-width: 1023.98px)' },
        (context) => {
          const desktop = Boolean(context.conditions?.desktop)
          const scrub = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: desktop ? '+=180%' : '+=110%',
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          scrub.to(textRef.current, { opacity: 0, y: -60, duration: 0.25 }, 0)
          if (desktop && stageRef.current) {
            const stage = stageRef.current
            scrub.to(
              stage,
              {
                x: () => {
                  const box = stage.getBoundingClientRect()
                  return window.innerWidth / 2 - (box.left + box.width / 2 - Number(gsap.getProperty(stage, 'x')))
                },
                duration: 0.3,
                ease: 'power2.inOut',
              },
              0.05,
            )
          }
          scrub.to(cupState, { explode: 1, duration: 0.35 }, 0.2)
          calloutRefs.current.forEach((callout, index) => {
            scrub.to(callout, { opacity: 1, x: 0, duration: 0.12 }, 0.32 + index * 0.1)
          })
          scrub
            .to(calloutRefs.current, { opacity: 0, x: 30, duration: 0.1 }, 0.68)
            .to(cupState, { explode: 0, spin: Math.PI * 2, duration: 0.3 }, 0.7)
            .to(closeRef.current, { opacity: 1, y: 0, duration: 0.15 }, 0.88)
        },
      )
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
    // Stable React-owned parent for GSAP's pin-spacer, so React never has to
    // remove a node that GSAP re-parented.
    <div>
      <section ref={sectionRef} className="relative min-h-dvh overflow-hidden px-6 pb-16 pt-24 lg:pt-20">
        <div className="mx-auto grid min-h-[calc(100dvh-10rem)] max-w-6xl items-center gap-2 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div
            ref={stageRef}
            className="pointer-events-none relative order-1 h-[44vh] min-h-[280px] lg:order-2 lg:h-[76vh]"
          >
            <Suspense fallback={null}>
              <CupCanvas
                flavor="bolo"
                drink="tea-cloudy"
                state={cupState}
                autoSpin={!reducedMotion}
                className="h-full w-full"
              />
            </Suspense>
          </div>
  
          <div ref={textRef} className="relative z-10 order-2 text-center lg:order-1 lg:text-left">
            <div className="relative inline-block">
              <h1
                ref={headlineRef}
                className="font-display text-7xl font-bold leading-none text-ketchup drop-shadow-sm sm:text-8xl lg:text-9xl"
              >
                {splitHeadline('KeCup')}
              </h1>
              <div ref={stampRef} className="absolute -right-10 -top-4 sm:-right-12">
                <Lips className="h-8 w-14 rotate-12 text-ketchup" />
              </div>
            </div>
            <div ref={copyRef}>
              <p className="mt-4 font-display text-2xl text-ink sm:text-4xl">{t('hero.tagline')}</p>
              <p className="mt-3 max-w-xl text-lg text-ink/80 max-lg:mx-auto">{t('hero.sub')}</p>
            </div>
  
            <div
              ref={ctasRef}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <MagneticButton>
                <TransitionLink
                  to="/build"
                  className="inline-flex rounded-full border-[3px] border-ink bg-ketchup px-7 py-3 font-display text-lg font-semibold text-cream shadow-sticker transition-transform hover:-translate-y-0.5"
                >
                  {t('hero.ctaOrder')}
                </TransitionLink>
              </MagneticButton>
              <MagneticButton>
                <TransitionLink
                  to="/menu"
                  className="inline-flex rounded-full border-[3px] border-ink bg-butter px-7 py-3 font-display text-lg font-semibold text-ink shadow-sticker transition-transform hover:-translate-y-0.5"
                >
                  {t('hero.ctaMenu')}
                </TransitionLink>
              </MagneticButton>
            </div>
          </div>
        </div>
  
        <ul className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 space-y-24 lg:block xl:right-16">
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
  
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center px-6">
          <p
            ref={closeRef}
            className="text-center font-display text-xl font-semibold text-brick opacity-0 sm:text-2xl"
            style={{ transform: 'translateY(16px)' }}
          >
            {t('scroll.end')}
          </p>
        </div>
      </section>
    </div>
  )
}
