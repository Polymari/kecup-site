import {
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react'
import { useNavigate } from 'react-router'
import type { MouseEvent, ReactNode, RefObject } from 'react'
import { gsap } from '@/anim/gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const CELLS_X = 8
const CELLS_Y = 5

export interface TransitionOrigin {
  x: number
  y: number
}

export type PageTransition = (to: string, origin?: TransitionOrigin) => void

const TransitionContext = createContext<PageTransition | null>(null)

function playOverlay(
  overlay: HTMLDivElement | null,
  direction: 'in' | 'out',
  origin: TransitionOrigin | undefined,
): Promise<void> {
  return new Promise((resolve) => {
    const cells = overlay?.querySelectorAll<HTMLDivElement>('[data-cell]')
    if (!cells || cells.length === 0) {
      resolve()
      return
    }
    const x = origin?.x ?? window.innerWidth / 2
    const y = origin?.y ?? window.innerHeight / 2

    gsap.set(cells, { transformOrigin: `${x}px ${y}px`, scale: direction === 'in' ? 0 : 1 })
    gsap.to(cells, {
      scale: direction === 'in' ? 1 : 0,
      duration: 0.45,
      ease: 'power2.inOut',
      stagger: { each: 0.012, from: 'random' },
      onComplete: resolve,
    })
  })
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const go = useCallback<PageTransition>(
    (to, origin) => {
      void (async () => {
        if (!reducedMotion) {
          await playOverlay(overlayRef.current, 'in', origin)
        }
        navigate(to)
        window.scrollTo(0, 0)
        if (!reducedMotion) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
          await playOverlay(overlayRef.current, 'out', origin)
        }
      })()
    },
    [navigate, reducedMotion],
  )

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <TransitionOverlay innerRef={overlayRef} />
    </TransitionContext.Provider>
  )
}

export function usePageTransition(): PageTransition {
  const navigate = useNavigate()
  const context = useContext(TransitionContext)
  return (
    context ??
    ((to: string) => {
      navigate(to)
      window.scrollTo(0, 0)
    })
  )
}

function TransitionOverlay({ innerRef }: { innerRef: RefObject<HTMLDivElement | null> }) {
  const cells = Array.from({ length: CELLS_X * CELLS_Y })
  return (
    <div
      ref={innerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] grid"
      style={{
        gridTemplateColumns: `repeat(${CELLS_X}, 1fr)`,
        gridTemplateRows: `repeat(${CELLS_Y}, 1fr)`,
      }}
    >
      {cells.map((_, index) => (
        <div
          key={index}
          data-cell
          className="scale-0"
          style={{
            backgroundColor: index % 2 === 0 ? 'var(--color-checker)' : 'var(--color-cream)',
          }}
        />
      ))}
    </div>
  )
}

interface TransitionLinkProps {
  to: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
}

export function TransitionLink({ to, children, className = '', onNavigate }: TransitionLinkProps) {
  const go = usePageTransition()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    onNavigate?.()
    go(to, { x: event.clientX, y: event.clientY })
  }

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
