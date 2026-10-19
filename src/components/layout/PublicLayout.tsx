import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { SmoothScroll } from '@/anim/lenis'
import { TransitionProvider } from '@/anim/TransitionLink'
import { ScrollTrigger } from '@/anim/gsap'
import { LipsCursor } from '@/anim/LipsCursor'
import { PublicNav } from './PublicNav'
import { PublicFooter } from './PublicFooter'
import { GrainOverlay } from '@/components/brand/GrainOverlay'

export function PublicLayout() {
  const { t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    ScrollTrigger.refresh()
  }, [location.pathname])

  return (
    <SmoothScroll>
      <TransitionProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:border-[3px] focus:border-ink focus:bg-cream focus:px-4 focus:py-2 focus:font-display focus:text-ink"
        >
          {t('common.skipToContent')}
        </a>
        <PublicNav />
        <main id="main">
          <Suspense fallback={<div className="p-10 text-center">{t('common.loading')}</div>}>
            <Outlet />
          </Suspense>
        </main>
        <PublicFooter />
        <GrainOverlay />
        <LipsCursor />
      </TransitionProvider>
    </SmoothScroll>
  )
}
