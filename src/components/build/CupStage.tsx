import { lazy, Suspense } from 'react'
import { Arch } from '@/components/brand/Arch'
import { CheckerBand } from '@/components/brand/CheckerBand'
import { Lips } from '@/components/brand/Lips'
import type { DrinkKey, FlavorKey } from '@/data/types'

const CupCanvas = lazy(() => import('@/three/CupCanvas'))

type CupStageProps = {
  flavor: FlavorKey | null
  drink: DrinkKey | null
}

const SAUCE_COLORS: Record<FlavorKey, string> = {
  bolo: 'var(--color-checker)',
  mush: '#8B5E34',
  cheese: 'var(--color-sun)',
}

const DRINK_COLORS: Record<DrinkKey, { top: string; bottom: string }> = {
  'tea-cloudy': { top: 'var(--color-cream)', bottom: '#C98A4B' },
  'tea-fizzy': { top: 'var(--color-butter)', bottom: '#E8641E' },
}

function CupMock({ flavor, drink }: CupStageProps) {
  return (
    <div className="flex h-full w-full items-end justify-center pb-8">
      <div className="relative w-32">
        <div
          className="mx-auto h-44 w-28 rounded-b-3xl rounded-t-lg border-[3px] border-brick"
          style={{
            background: `linear-gradient(to bottom, ${
              drink ? DRINK_COLORS[drink].top : 'var(--color-cream-deep)'
            } 30%, ${drink ? DRINK_COLORS[drink].bottom : 'var(--color-cream-deep)'} 100%)`,
          }}
        />
        <div className="absolute -top-14 left-1/2 w-40 -translate-x-1/2">
          <div className="h-12 rounded-t-[40px] rounded-b-lg border-[3px] border-brick bg-cream-deep">
            <div
              className="mx-auto h-3 w-24 rounded-full"
              style={{ backgroundColor: flavor ? SAUCE_COLORS[flavor] : 'transparent' }}
            />
          </div>
        </div>
        <div className="absolute -top-24 left-1/2 h-10 w-2 -translate-x-1/2 rounded-full bg-sky-300/80" />
        {!flavor && !drink ? (
          <div className="absolute inset-x-0 -top-6 flex justify-center">
            <Lips className="h-5 w-9 text-brick/40" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CupStage({ flavor, drink }: CupStageProps) {
  return (
    <div className="sticky top-28">
      <Arch className="relative mx-auto aspect-[4/5] w-full max-w-sm">
        <Suspense fallback={<CupMock flavor={flavor} drink={drink} />}>
          <CupCanvas flavor={flavor} drink={drink} />
        </Suspense>
        <CheckerBand cell={16} rows={2} className="absolute inset-x-0 bottom-0" />
      </Arch>
    </div>
  )
}
