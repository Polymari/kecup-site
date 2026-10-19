import type { ReactNode } from 'react'

type StickerProps = {
  children: ReactNode
  className?: string
  rotate?: number
  tone?: 'ketchup' | 'lime' | 'butter' | 'sun'
}

const toneClasses: Record<NonNullable<StickerProps['tone']>, string> = {
  ketchup: 'bg-ketchup text-cream',
  lime: 'bg-lime text-ink',
  butter: 'bg-butter text-ink',
  sun: 'bg-sun text-ink',
}

export function Sticker({ children, className = '', rotate = -6, tone = 'lime' }: StickerProps) {
  return (
    <span
      className={`inline-block rounded-full border-[3px] border-ink px-3 py-1 font-display text-sm font-semibold shadow-sticker ${toneClasses[tone]} ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  )
}
