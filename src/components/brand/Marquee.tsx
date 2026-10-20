import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { gsap } from '@/anim/gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/cn'

type MarqueeProps = {
  children: ReactNode
  className?: string
  reverse?: boolean
  speed?: number
}

export function Marquee({ children, className = '', reverse = false, speed = 24 }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const track = trackRef.current
    if (!track || reducedMotion) return

    // One continuous tween. Speed changes go through timeScale so the track
    // never restarts mid-cycle (rewriting a CSS animation duration does).
    if (reverse) gsap.set(track, { xPercent: -50 })
    const tween = gsap.to(track, {
      xPercent: reverse ? 0 : -50,
      duration: speed,
      ease: 'none',
      repeat: -1,
    })

    let lastScroll = window.scrollY
    let lastTime = performance.now()
    let settle: number | undefined

    const onScroll = () => {
      const now = performance.now()
      const y = window.scrollY
      const elapsed = Math.max(now - lastTime, 16)
      const velocity = Math.min(Math.abs(y - lastScroll) / elapsed, 3)
      lastScroll = y
      lastTime = now

      gsap.to(tween, { timeScale: 1 + velocity, duration: 0.18, overwrite: true })
      window.clearTimeout(settle)
      settle = window.setTimeout(() => {
        gsap.to(tween, { timeScale: 1, duration: 0.45, overwrite: true })
      }, 160)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(settle)
      tween.kill()
    }
  }, [reducedMotion, reverse, speed])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div ref={trackRef} className="flex w-max">
        {/* Each copy carries its own trailing gap, so -50% lands exactly one copy over: no seam skip. */}
        <div className="flex shrink-0 items-center gap-8 pr-8">{children}</div>
        <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
