import type { ReactNode } from 'react'
import { useMagnetic } from '@/hooks/useMagnetic'
import { cn } from '@/lib/cn'

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function MagneticButton({ children, className = '', onClick }: MagneticButtonProps) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLSpanElement>()

  return (
    <span
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn('inline-block will-change-transform', className)}
    >
      {children}
    </span>
  )
}
