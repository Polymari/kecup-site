// Keep this module free of `three` imports: the hero imports it eagerly and
// three.js must stay in the lazy-loaded canvas chunk.

/** Default tea level (fraction of the drink height). */
export const DEFAULT_FILL = 0.84

/**
 * Plain mutable proxy tweened by GSAP and read every frame in `useFrame`
 * (never React state). All stage values are 0..1 and default to "assembled".
 */
export interface CupAnimationState {
  /** Tea level as a fraction of the drink height. */
  fill: number
  /** Extra vertical offset of the whole cup (intro drop). */
  drop: number
  /** Extra yaw (radians) added on top of the idle auto-spin. */
  spin: number
  /** 1 = rest, <1 squashes the sauce (flavor "splat"). */
  sauceSquash: number
  /** 0 assembled → 1 exploded view. */
  explode: number
  /** Assembly stages for the intro: bowl clicks on, chips rain, sauce lands, straw stabs. */
  tray: number
  chips: number
  sauce: number
  straw: number
}

export function createCupState(overrides: Partial<CupAnimationState> = {}): CupAnimationState {
  return {
    fill: DEFAULT_FILL,
    drop: 0,
    spin: 0,
    sauceSquash: 1,
    explode: 0,
    tray: 1,
    chips: 1,
    sauce: 1,
    straw: 1,
    ...overrides,
  }
}

/** A fully disassembled cup, the starting point of the hero intro. */
export function createIntroState(): CupAnimationState {
  return createCupState({ fill: 0, drop: 3, tray: 0, chips: 0, sauce: 0, straw: 0 })
}

/** Per-part offsets at explode = 1 (model units). */
export const EXPLODE_OFFSETS = {
  cup: -0.4,
  tray: 0.3,
  chips: 0.75,
  sauce: 1.2,
  strawX: 1.3,
  strawY: 0.45,
  /** Whole-model scale at full explode so the taller stack still fits the frame. */
  scale: 0.74,
} as const
