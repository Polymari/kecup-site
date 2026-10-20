import { gsap } from '@/anim/gsap'
import type { CupAnimationState } from './cupState'
import { DEFAULT_FILL, createIntroState } from './cupState'

/**
 * The hero "Assembly": cup drops in, tea pours, the bowl clicks on, chips
 * rain, sauce lands with a splat and the straw stabs through (~3.2s).
 * Stage tweens are linear — KeCupModel applies the per-part easing.
 */
export function assemblyTimeline(state: CupAnimationState, { reset = false } = {}) {
  const timeline = gsap.timeline({ defaults: { ease: 'none' } })
  if (reset) timeline.set(state, { ...createIntroState(), spin: state.spin, explode: 0 })
  return timeline
    .to(state, { drop: 0, duration: 0.85, ease: 'bounce.out' }, 0)
    .to(state, { fill: DEFAULT_FILL, duration: 1, ease: 'power2.out' }, 0.55)
    .to(state, { tray: 1, duration: 0.5 }, 1.05)
    .to(state, { chips: 1, duration: 1.1 }, 1.35)
    .to(state, { sauce: 1, duration: 0.4 }, 2.25)
    .fromTo(
      state,
      { sauceSquash: 0.5 },
      { sauceSquash: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)', immediateRender: false },
      2.62,
    )
    .to(state, { straw: 1, duration: 0.4 }, 2.8)
}
