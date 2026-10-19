import { useCallback, useRef } from 'react'
import type { MouseEvent } from 'react'
import { gsap } from '@/anim/gsap'
import { useFinePointer } from '@/hooks/useTouch'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const finePointer = useFinePointer()
  const reducedMotion = useReducedMotion()

  const onMouseMove = useCallback(
    (event: MouseEvent<T>) => {
      const element = ref.current
      if (!element || !finePointer || reducedMotion) return
      const rect = element.getBoundingClientRect()
      const x = event.clientX - (rect.left + rect.width / 2)
      const y = event.clientY - (rect.top + rect.height / 2)
      gsap.to(element, { x: x * 0.18, y: y * 0.18, duration: 0.35, ease: 'power2.out' })
    },
    [finePointer, reducedMotion],
  )

  const onMouseLeave = useCallback(() => {
    const element = ref.current
    if (!element || !finePointer || reducedMotion) return
    gsap.to(element, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
  }, [finePointer, reducedMotion])

  return { ref, onMouseMove, onMouseLeave }
}
