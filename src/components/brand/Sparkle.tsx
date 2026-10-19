import type { SVGProps } from 'react'

type SparkleProps = SVGProps<SVGSVGElement> & {
  title?: string
}

export function Sparkle({ title, ...props }: SparkleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" role={title ? 'img' : 'presentation'} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12 0c.8 6.2 2.1 8.7 4.4 9.9 1.6.8 3.6 1.3 7.6 2.1-4 .8-6 1.3-7.6 2.1-2.3 1.2-3.6 3.7-4.4 9.9-.8-6.2-2.1-8.7-4.4-9.9C6 13.3 4 12.8 0 12c4-.8 6-1.3 7.6-2.1C9.9 8.7 11.2 6.2 12 0z" />
    </svg>
  )
}
