import { useEffect, useRef, useState } from 'react'
import { Lips } from '@/components/brand/Lips'
import { useFinePointer } from '@/hooks/useTouch'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useKisses } from '@/store/kisses'
import { cn } from '@/lib/cn'

const MAX_STAMPS = 10
const STAMP_COLORS = ['#E23B2E', '#B01E2E', '#E8641E', '#7A1F1A']

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, [role="button"]'))
}

interface Stamp {
  id: number
  x: number
  y: number
  rotation: number
  color: string
}

export function LipsCursor() {
  const finePointer = useFinePointer()
  const reducedMotion = useReducedMotion()
  const addKiss = useKisses((state) => state.add)
  const cursorRef = useRef<HTMLDivElement>(null)
  const [pucker, setPucker] = useState(false)
  const [stamps, setStamps] = useState<Stamp[]>([])
  const nextId = useRef(0)
  const buffer = useRef('')

  useEffect(() => {
    if (!finePointer || reducedMotion) return

    let targetX = -100
    let targetY = -100
    let currentX = -100
    let currentY = -100
    let frame = 0

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      setPucker(isInteractive(event.target))
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.22
      currentY += (targetY - currentY) * 0.22
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const onClick = (event: MouseEvent) => {
      if (isInteractive(event.target)) return
      const stamp: Stamp = {
        id: nextId.current++,
        x: event.clientX,
        y: event.clientY,
        rotation: (Math.random() - 0.5) * 50,
        color: STAMP_COLORS[Math.floor(Math.random() * STAMP_COLORS.length)],
      }
      addKiss()
      setStamps((current) => [...current.slice(-(MAX_STAMPS - 1)), stamp])
      window.setTimeout(() => {
        setStamps((current) => current.filter((entry) => entry.id !== stamp.id))
      }, 1400)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [finePointer, reducedMotion, addKiss])

  useEffect(() => {
    if (!finePointer || reducedMotion) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key.length !== 1) return
      buffer.current = (buffer.current + event.key.toLowerCase()).slice(-8)
      if (buffer.current.endsWith('kecup')) {
        buffer.current = ''
        const burst: Stamp[] = Array.from({ length: 8 }, (_, index) => ({
          id: nextId.current++,
          x: window.innerWidth / 2 + Math.cos(index) * 120,
          y: window.innerHeight / 2 + Math.sin(index * 1.7) * 90,
          rotation: (Math.random() - 0.5) * 80,
          color: STAMP_COLORS[index % STAMP_COLORS.length],
        }))
        addKiss()
        setStamps((current) => [...current.slice(-(MAX_STAMPS - 1)), ...burst].slice(-MAX_STAMPS))
        window.setTimeout(() => {
          setStamps((current) =>
            current.filter((entry) => !burst.some((stamp) => stamp.id === entry.id)),
          )
        }, 1600)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finePointer, reducedMotion, addKiss])

  if (!finePointer || reducedMotion) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={cursorRef}
        className={cn('fixed left-0 top-0 transition-transform duration-100', pucker && 'scale-125')}
      >
        <Lips className="h-6 w-11 text-ketchup drop-shadow-sm" />
      </div>

      {stamps.map((stamp) => (
        <div
          key={stamp.id}
          className="fixed animate-[kiss-fade_1.4s_ease-out_forwards]"
          style={{
            left: stamp.x,
            top: stamp.y,
            transform: `translate(-50%, -50%) rotate(${stamp.rotation}deg)`,
            color: stamp.color,
          }}
        >
          <Lips className="h-8 w-14" />
        </div>
      ))}

      <style>{`@keyframes kiss-fade { 0% { opacity: 0.95; scale: 0.7 } 25% { scale: 1.15 } 100% { opacity: 0; scale: 1 } }`}</style>
    </div>
  )
}
