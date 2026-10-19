type DripProps = {
  className?: string
  color?: string
  flip?: boolean
}

export function Drip({ className = '', color = 'var(--color-ketchup)', flip = false }: DripProps) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden
      className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path
        fill={color}
        d="M0 0h1200v14c-38 0-52 8-70 20-16 11-33 13-52 6-18-7-29-8-44 2-16 11-32 12-50 3-16-8-28-8-44 1-17 10-33 11-51 2-17-8-29-9-46 0-18 10-35 10-53 0-17-9-29-9-46-1-18 9-35 9-53-1-17-9-30-9-47 0-18 10-35 10-53 1-17-9-29-9-46-1-18 9-35 10-53 1-17-8-29-9-46-1-18 9-35 10-53 2-17-8-29-9-46-2-18 8-34 9-51 2-17-7-29-8-45-2-18 7-33 8-50 3-18-6-32-9-48-9V0Z"
      />
    </svg>
  )
}
