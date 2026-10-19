import type { ReactNode } from 'react'
import { Card } from '@/components/brand/Card'

type KpiCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'cream' | 'lime' | 'butter'
}

const tones = {
  cream: 'bg-cream-deep',
  lime: 'bg-lime',
  butter: 'bg-butter',
}

export function KpiCard({ label, value, hint, tone = 'cream' }: KpiCardProps) {
  return (
    <Card className={`p-4 ${tones[tone]}`}>
      <p className="font-mono text-xs uppercase tracking-wide text-brick">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink/70">{hint}</p> : null}
    </Card>
  )
}
