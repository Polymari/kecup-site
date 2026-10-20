import type { DrinkKey, FlavorKey } from '@/data/types'
import type { CupAnimationState } from './cupState'
import type { CupStyle } from './materials'
import { CanvasShell } from './CanvasShell'
import { KeCupModel } from './KeCupModel'

type CupCanvasProps = {
  flavor: FlavorKey | null
  drink: DrinkKey | null
  style?: CupStyle
  state?: CupAnimationState
  interactive?: boolean
  className?: string
}

export default function CupCanvas({
  flavor,
  drink,
  style = 'toon',
  state,
  interactive,
  className,
}: CupCanvasProps) {
  return (
    <CanvasShell className={className ?? 'aspect-[4/5] w-full'}>
      <KeCupModel
        flavor={flavor ?? 'bolo'}
        drink={drink ?? 'tea-cloudy'}
        style={style}
        state={state}
        interactive={interactive ?? true}
      />
    </CanvasShell>
  )
}
