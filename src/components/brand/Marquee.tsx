import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type MarqueeProps = {
  children: ReactNode
  className?: string
  reverse?: boolean
  speed?: number
}

export function Marquee({ children, className = '', reverse = false, speed = 24 }: MarqueeProps) {
  const [velocityBoost, setVelocityBoost] = useState(1)
  const lastScroll = useRef(0)
  const lastTime = useRef(0)

  useEffect(() => {
    let settleTimer: number | undefined

    const onScroll = () => {
      const now = performance.now()
      const elapsed = Math.max(now - lastTime.current, 16)
      const delta = Math.abs(window.scrollY - lastScroll.current)
      lastScroll.current = window.scrollY
      lastTime.current = now

      const velocity = Math.min(delta / elapsed, 3)
      setVelocityBoost(1 + velocity)
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => setVelocityBoost(1), 180)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(settleTimer)
    }
  }, [])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="flex w-max gap-8 whitespace-nowrap"
        style={{
          animation: `marquee-scroll ${speed / velocityBoost}s linear infinite${reverse ? ' reverse' : ''}`,
        }}
      >
        <span className="flex items-center gap-8">{children}</span>
        <span className="flex items-center gap-8" aria-hidden>
          {children}
        </span>
      </div>
      <style>{`@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  )
}
