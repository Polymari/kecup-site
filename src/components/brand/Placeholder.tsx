type PlaceholderProps = {
  label: string
  ratio?: string
  className?: string
}

export function Placeholder({ label, ratio = '1 / 1', className = '' }: PlaceholderProps) {
  return (
    <div
      data-testid="placeholder"
      role="img"
      aria-label={`Photo needed: ${label}`}
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border-[3px] border-ink ${className}`}
      style={{
        aspectRatio: ratio,
        backgroundColor: 'var(--color-cream-deep)',
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent 0 10px, rgba(74, 21, 18, 0.08) 10px 20px)',
      }}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-brick" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
          <circle cx="12" cy="13" r="3.6" />
        </svg>
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-brick">{label}</span>
      </div>
    </div>
  )
}
