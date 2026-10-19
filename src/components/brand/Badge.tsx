import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  className?: string
  tone?: 'ketchup' | 'lime' | 'butter' | 'ink' | 'cream' | 'sun'
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  ketchup: 'bg-ketchup text-cream',
  lime: 'bg-lime text-ink',
  butter: 'bg-butter text-ink',
  ink: 'bg-ink text-cream',
  cream: 'bg-cream text-ink',
  sun: 'bg-sun text-ink',
}

export function Badge({ children, className = '', tone = 'ink' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
