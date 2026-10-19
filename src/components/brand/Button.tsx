import { cloneElement, isValidElement } from 'react'
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className'>

const base =
  'inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-ink font-display font-semibold transition-transform active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-ketchup text-cream shadow-sticker hover:-translate-y-0.5',
  secondary: 'bg-butter text-ink shadow-sticker hover:-translate-y-0.5',
  ghost: 'bg-transparent text-ink hover:bg-cream-deep',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  asChild = false,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className)

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error('Button asChild expects a single element child')
    }
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, { className: cn(child.props.className, classes) })
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
