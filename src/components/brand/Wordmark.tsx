type WordmarkProps = {
  className?: string
  strokeWidth?: number
  title?: string
}

export function Wordmark({
  className = '',
  strokeWidth = 6,
  title = 'KeCup',
}: WordmarkProps) {
  return (
    <svg
      viewBox="0 0 420 120"
      className={className}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x="210"
        y="88"
        textAnchor="middle"
        fill="var(--color-ketchup)"
        stroke="var(--color-tangerine)"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        paintOrder="stroke fill"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '92px',
        }}
      >
        KeCup
      </text>
    </svg>
  )
}
