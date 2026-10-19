import { describe, expect, it } from 'vitest'
import {
  CUP,
  DRINK,
  TRAY,
  chipPlacements,
  createChipGeometry,
  cupProfilePoints,
  drinkRadiusAt,
  trayProfilePoints,
} from './geometry'
import { createToonGradientMap } from './gradientMap'
import { createCupState } from './cupState'
import { createPrng } from '@/lib/prng'

describe('geometry math', () => {
  it('builds a tapered cup profile from bottom to top radius', () => {
    const points = cupProfilePoints()
    expect(points[0].x).toBeCloseTo(CUP.bottomRadius, 5)
    expect(points[points.length - 1].x).toBeCloseTo(CUP.topRadius, 5)
    expect(points[points.length - 1].y).toBeCloseTo(CUP.height, 5)
  })

  it('nests the tray above the cup rim', () => {
    const points = trayProfilePoints()
    expect(points[0].y).toBeCloseTo(TRAY.y, 5)
    expect(TRAY.y).toBeGreaterThan(CUP.height * 0.9)
    expect(points[points.length - 1].x).toBeCloseTo(TRAY.topRadius, 5)
  })

  it('computes the drink radius along the taper', () => {
    expect(drinkRadiusAt(0)).toBeCloseTo(DRINK.bottomRadius, 5)
    expect(drinkRadiusAt(DRINK.height)).toBeCloseTo(DRINK.topRadius, 5)
    expect(drinkRadiusAt(DRINK.height * 0.5)).toBeGreaterThan(DRINK.bottomRadius)
  })
})

describe('chip placement', () => {
  it('is deterministic for a seeded generator and stays inside the tray', () => {
    const a = chipPlacements(36, createPrng('chip-seed'))
    const b = chipPlacements(36, createPrng('chip-seed'))
    expect(a).toEqual(b)
    for (const chip of a) {
      expect(Math.hypot(chip.x, chip.z)).toBeLessThanOrEqual(TRAY.topRadius * 0.75)
      expect(chip.y).toBeGreaterThan(TRAY.y)
    }
  })

  it('builds extruded chip geometry', () => {
    const geometry = createChipGeometry()
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0)
  })
})

describe('animation state + gradient map', () => {
  it('creates the default animation proxy values', () => {
    const state = createCupState()
    expect(state).toEqual({ fill: 0.72, drop: 0, bob: 0, spin: 0, sauceSquash: 1 })
  })

  it('creates a 3-step nearest-filter gradient texture', () => {
    const texture = createToonGradientMap(3)
    expect(texture.image.width).toBe(3)
    expect(texture.minFilter).toBeDefined()
  })
})
