import type { DrinkKey, FlavorKey } from '@/data/types'
import { CanvasShell } from './CanvasShell'
import { KeCupModel } from './KeCupModel'

type CupCanvasProps = {
  flavor: FlavorKey | null
  drink: DrinkKey | null
  className?: string
}

export default function CupCanvas({ flavor, drink, className }: CupCanvasProps) {
  return (
    <CanvasShell className={className ?? 'aspect-[4/5] w-full'}>
      <KeCupModel flavor={flavor ?? 'bolo'} drink={drink ?? 'tea-cloudy'} />
    </CanvasShell>
  )
}
