import type { ReactNode } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { ScrollTrigger } from '@/anim/gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function LenisScrollTriggerSync() {
  useLenis(() => {
    ScrollTrigger.update()
  })
  return null
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true }}>
      <LenisScrollTriggerSync />
      {children}
    </ReactLenis>
  )
}
