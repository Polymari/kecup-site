import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from '@/anim/gsap'
import { TransitionLink } from '@/anim/TransitionLink'
import { Lips } from '@/components/brand/Lips'
import { MagneticButton } from '@/components/brand/MagneticButton'
import { Sparkle } from '@/components/brand/Sparkle'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { assemblyTimeline } from '@/three/assembly'
import { createIntroState } from '@/three/cupState'

const CupCanvas = lazy(() => import('@/three/CupCanvas'))

const ANATOMY_CALLOUTS = [
  {
    step: '01',
    side: 'left' as const,
    topClass: 'top-[19%]',
    badgeClass: 'bg-ketchup text-cream',
    titleKey: 'explode.sauceTitle',
    descKey: 'explode.sauce',
  },
  {
    step: '02',
    side: 'right' as const,
    topClass: 'top-[33%]',
    badgeClass: 'bg-butter text-ink',
    titleKey: 'explode.trayTitle',
    descKey: 'explode.tray',
  },
  {
    step: '03',
    side: 'left' as const,
    topClass: 'top-[54%]',
    badgeClass: 'bg-lime text-ink',
    titleKey: 'explode.cupTitle',
    descKey: 'explode.cup',
  },
  {
    step: '04',
    side: 'right' as const,
    topClass: 'top-[70%]',
    badgeClass: 'bg-butter text-ink',
    titleKey: 'explode.teaTitle',
    descKey: 'explode.tea',
  },
] as const

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
  const anatomyHeaderRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
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
              onRefresh: (self) => {
                if (self.progress > 0.02 && intro.progress() < 1) {
                  intro.progress(1)
                }
              },
              onUpdate: (self) => {
                if (self.progress > 0.02 && intro.progress() < 1) {
                  intro.progress(1)
                }
              },
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
                y: 44,
                duration: 0.3,
                ease: 'power2.inOut',
              },
              0.05,
            )
          }
          scrub.to(cupState, { explode: 1, duration: 0.35 }, 0.15)
          scrub.to(anatomyHeaderRef.current, { opacity: 1, y: 0, duration: 0.18 }, 0.22)
          scrub.to(backdropRef.current, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(1.4)' }, 0.22)
          calloutRefs.current.forEach((callout, index) => {
            scrub.to(callout, { opacity: 1, x: 0, duration: 0.12 }, 0.28 + index * 0.08)
          })
          scrub
            .to(calloutRefs.current, { opacity: 0, y: -16, duration: 0.1 }, 0.68)
            .to(anatomyHeaderRef.current, { opacity: 0, y: -20, duration: 0.12 }, 0.68)
            .to(backdropRef.current, { opacity: 0, scale: 0.88, duration: 0.15 }, 0.68)
            .to(stageRef.current, { y: 0, duration: 0.25, ease: 'power2.out' }, 0.7)
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
        {/* Centered backdrop halo & technical diagram rings during the exploded phase */}
        <div
          ref={backdropRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-0"
          style={{ transform: 'scale(0.85)' }}
        >
          <div className="relative flex h-[360px] w-[360px] items-center justify-center sm:h-[460px] sm:w-[460px] lg:h-[520px] lg:w-[520px]">
            <div className="absolute inset-6 rounded-full bg-butter/35 blur-2xl" />
            <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-ink/20" />
            <div className="absolute inset-10 rounded-full border-2 border-ink/10" />
            {/* Horizontal divider indicating snack vs sip split */}
            <div className="absolute inset-x-4 top-[50%] border-t-2 border-dashed border-ketchup/30" />
            <span className="absolute -right-2 top-[47%] hidden -translate-y-full rounded-full border-2 border-ink bg-butter px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-ink shadow-sticker sm:inline-block">
              ↑ {t('explode.snackZone')}
            </span>
            <span className="absolute -right-2 top-[53%] hidden rounded-full border-2 border-ink bg-cream-deep px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-ink shadow-sticker sm:inline-block">
              ↓ {t('explode.sipZone')}
            </span>
            <Sparkle className="absolute -left-4 top-12 h-7 w-7 text-ketchup/70" />
            <Sparkle className="absolute -right-5 bottom-14 h-8 w-8 text-butter" />
            <Lips className="absolute -bottom-3 left-10 h-6 w-11 -rotate-12 text-ketchup/60" />
          </div>
        </div>

        {/* Top header banner during the exploded anatomy view */}
        <div
          ref={anatomyHeaderRef}
          className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center px-4 text-center opacity-0 lg:top-[5.75rem]"
          style={{ transform: 'translateY(-16px)' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-butter px-3.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink shadow-sticker">
            <Sparkle className="h-3.5 w-3.5 text-ketchup" />
            {t('explode.kicker')}
          </span>
          <h2 className="mt-1.5 font-display text-xl font-bold text-ink sm:text-2xl">
            {t('explode.heading')}
          </h2>
        </div>

        <div className="mx-auto grid min-h-[calc(100dvh-10rem)] max-w-6xl items-center gap-2 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div
            ref={stageRef}
            className="pointer-events-none relative z-10 order-1 h-[44vh] min-h-[280px] lg:order-2 lg:h-[76vh]"
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

        {/* Balanced left & right exploded anatomy callout cards hugging the centered cup */}
        <div className="pointer-events-none absolute inset-0 z-20 mx-auto hidden max-w-6xl lg:block">
          <ul>
            {ANATOMY_CALLOUTS.map((item, index) => {
              const isLeft = item.side === 'left'
              return (
                <li
                  key={item.step}
                  ref={(node) => {
                    calloutRefs.current[index] = node
                  }}
                  className={`absolute ${item.topClass} flex items-center gap-2.5 opacity-0 ${
                    isLeft ? 'left-4 xl:left-8' : 'right-4 xl:right-8 flex-row-reverse'
                  }`}
                  style={{ transform: `translateX(${isLeft ? '-36px' : '36px'})` }}
                >
                  <div className="w-[240px] rounded-2xl border-[3px] border-ink bg-cream/95 p-3.5 shadow-sticker backdrop-blur-xs xl:w-[265px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink font-mono text-xs font-bold ${item.badgeClass}`}
                      >
                        {item.step}
                      </span>
                      <span className="font-display text-base font-bold leading-tight text-ink">
                        {t(item.titleKey)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink/80">
                      {t(item.descKey)}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="h-px w-12 shrink-0 border-t-[2.5px] border-dashed border-ink/45 xl:w-20"
                  />
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full border-2 border-ink bg-ketchup shadow-xs"
                  />
                </li>
              )
            })}
          </ul>
        </div>

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
