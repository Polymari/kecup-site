export interface CupAnimationState {
  fill: number
  drop: number
  bob: number
  spin: number
  sauceSquash: number
}

export function createCupState(): CupAnimationState {
  return { fill: 0.72, drop: 0, bob: 0, spin: 0, sauceSquash: 1 }
}
