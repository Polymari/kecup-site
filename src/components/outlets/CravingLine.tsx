import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Outlet } from '@/data/types'
import { isOpenNow } from '@/lib/hours'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { gsap, ScrollTrigger } from '@/anim/gsap'

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 160
const LINE_PATH =
  'M 40 110 C 160 110, 180 50, 300 50 S 470 110, 590 110 S 760 50, 960 50'

type CravingLineProps = {
  outlets: Outlet[]
  onSelect: (slug: string) => void
  selectedSlug: string
}

function useStationPositions(
  pathRef: React.RefObject<SVGPathElement | null>,
  count: number,
): Array<{ x: number; y: number }> {
  const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([])

  useEffect(() => {
    const path = pathRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    const total = path.getTotalLength()
    const next = Array.from({ length: count }, (_, index) => {
      const point = path.getPointAtLength((total * index) / (count - 1))
      return { x: point.x, y: point.y }
    })
    setPositions(next)
  }, [count, pathRef])

  return positions
}

export function CravingLine({ outlets, onSelect, selectedSlug }: CravingLineProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const pathRef = useRef<SVGPathElement | null>(null)
  const stations = useStationPositions(pathRef, outlets.length)

  useEffect(() => {
    const path = pathRef.current
    if (!path || reducedMotion) return
    const trigger = ScrollTrigger.create({
      trigger: path,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const length = path.getTotalLength()
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' },
        )
      },
    })
    return () => trigger.kill()
  }, [reducedMotion])

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={t('outlets.line')}
      >
        <path
          ref={pathRef}
          d={LINE_PATH}
          fill="none"
          stroke="var(--color-checker)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {stations.map((point, index) => {
          const outlet = outlets[index]
          const status = isOpenNow(outlet, new Date())
          const selected = outlet.slug === selectedSlug
          return (
            <g
              key={outlet.slug}
              transform={`translate(${point.x}, ${point.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(outlet.slug)}
            >
              <circle
                r={selected ? 18 : 13}
                fill={status.open ? 'var(--color-lime)' : 'var(--color-cream)'}
                stroke="var(--color-ink)"
                strokeWidth={5}
              />
              <text
                y={38}
                textAnchor="middle"
                fill="var(--color-ink)"
                style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}
              >
                {outlet.name.replace('KeCup ', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
