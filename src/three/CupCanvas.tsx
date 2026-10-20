import { PresentationControls } from '@react-three/drei'
import type { DrinkKey, FlavorKey } from '@/data/types'
import { CUP_STYLE } from '@/config/site'
import { useFinePointer } from '@/hooks/useTouch'
import type { CameraFit } from './cameraFit'
import type { CupAnimationState } from './cupState'
import type { CupStyle } from './materials'
import { CanvasShell } from './CanvasShell'
import { KeCupModel } from './KeCupModel'

type CupCanvasProps = {
  /** null renders bare chips (builder before a sauce is picked). */
  flavor: FlavorKey | null
  /** null renders an empty cup (builder before a sip is picked). */
  drink: DrinkKey | null
  style?: CupStyle
  state?: CupAnimationState
  autoSpin?: boolean
  /** Drag to turn the cup (fine pointers only, so touch scrolling is never hijacked). */
  draggable?: boolean
  fit?: CameraFit
  className?: string
}

export default function CupCanvas({
  flavor,
  drink,
  style = CUP_STYLE,
  state,
  autoSpin = true,
  draggable = false,
  fit,
  className,
}: CupCanvasProps) {
  const finePointer = useFinePointer()
  const model = (
    <KeCupModel flavor={flavor} drink={drink} style={style} state={state} autoSpin={autoSpin} />
  )

  return (
    <CanvasShell className={className ?? 'aspect-[4/5] w-full'} fit={fit} environment={style === 'realistic'}>
      {draggable && finePointer ? (
        <PresentationControls
          global
          snap
          cursor={false}
          speed={1.4}
          polar={[-0.2, 0.25]}
          azimuth={[-Infinity, Infinity]}
          damping={0.25}
        >
          {model}
        </PresentationControls>
      ) : (
        model
      )}
    </CanvasShell>
  )
}
