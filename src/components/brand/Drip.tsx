type DripProps = {
  className?: string
  color?: string
  flip?: boolean
}

const WIDTH = 1200
const BASE_Y = 14
// Varying drip depths, one per 50-unit scallop, so the edge spans the full width.
const DEPTHS = [22, 14, 30, 18, 40, 16, 24, 34, 14, 26, 20, 44, 18, 28, 16, 36, 22, 14, 32, 20, 26, 42, 16, 24]

function dripPath(): string {
  const step = WIDTH / DEPTHS.length
  let d = `M0 0H${WIDTH}V${BASE_Y}`
  DEPTHS.forEach((depth, index) => {
    const x = WIDTH - index * step
    const next = x - step
    d += `C${x - step * 0.18} ${BASE_Y + depth} ${next + step * 0.18} ${BASE_Y + depth} ${next} ${BASE_Y}`
  })
  return `${d}V0Z`
}

const DRIP_PATH = dripPath()

export function Drip({ className = '', color = 'var(--color-ketchup)', flip = false }: DripProps) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} 60`}
      preserveAspectRatio="none"
      aria-hidden
      className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path fill={color} d={DRIP_PATH} />
    </svg>
  )
}
