import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`rounded-2xl border-[3px] border-ink bg-cream shadow-sticker ${className}`}>
      {children}
    </Tag>
  )
}
