export interface CupAnimationState {
  fill: number
  drop: number
  bob: number
  spin: number
  sauceSquash: number
  explode: number
}

export function createCupState(): CupAnimationState {
  return { fill: 0.72, drop: 0, bob: 0, spin: 0, sauceSquash: 1, explode: 0 }
}

export const EXPLODE_OFFSETS = {
  tray: 0.55,
  chips: 0.95,
  sauce: 1.3,
  straw: 1.65,
} as const
