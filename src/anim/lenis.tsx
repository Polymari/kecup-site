import type { ReactNode } from 'react'
import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) return <>{children}</>

  return (
    <ReactLenis root options={{ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
