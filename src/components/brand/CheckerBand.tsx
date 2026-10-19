type CheckerBandProps = {
  className?: string
  cell?: number
  rows?: number
  flip?: boolean
}

export function CheckerBand({ className = '', cell = 24, rows = 2, flip = false }: CheckerBandProps) {
  return (
    <div
      aria-hidden
      className={`w-full ${flip ? 'rotate-180' : ''} ${className}`}
      style={{
        height: cell * rows,
        backgroundColor: 'var(--color-checker)',
        backgroundImage: [
          'linear-gradient(45deg, var(--color-cream) 25%, transparent 25%)',
          'linear-gradient(-45deg, var(--color-cream) 25%, transparent 25%)',
          'linear-gradient(45deg, transparent 75%, var(--color-cream) 75%)',
          'linear-gradient(-45deg, transparent 75%, var(--color-cream) 75%)',
        ].join(','),
        backgroundSize: `${cell * 2}px ${cell * 2}px`,
        backgroundPosition: `0 0, 0 ${cell}px, ${cell}px -${cell}px, -${cell}px 0`,
      }}
    />
  )
}
