import type { CSSProperties, ReactNode } from 'react'

type ArchProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function Arch({ children, className = '', style }: ArchProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-t-[999px] border-4 border-brick bg-butter ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
