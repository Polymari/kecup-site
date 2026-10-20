import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  CHIP_COUNT,
  CHIP_SIZE,
  CUP,
  DRINK,
  DRINK_VARIANTS,
  MODEL_CENTER_Y,
  MODEL_HEIGHT,
  SAUCE,
  STRAW,
  TRAY,
  TRAY_RIM_Y,
  chipPlacements,
  createChipGeometry,
  createSauceGeometry,
  cupProfilePoints,
  cupRadiusAt,
  drinkProfilePoints,
  drinkRadiusAt,
  sauceBits,
  sauceSurfaceY,
  trayProfilePoints,
  trayRadiusAt,
} from './geometry'
import { createToonGradientMap } from './gradientMap'
import { DEFAULT_FILL, EXPLODE_OFFSETS, createCupState, createIntroState } from './cupState'
import { fitDistance } from './cameraFit'
import { createPrng } from '@/lib/prng'

describe('cup + bowl geometry', () => {
  it('builds a tapered cup wall from bottom to top radius', () => {
    const points = cupProfilePoints()
    expect(points[0].x).toBeCloseTo(CUP.bottomRadius, 5)
    expect(points[points.length - 1].x).toBeCloseTo(CUP.topRadius, 5)
    expect(points[points.length - 1].y).toBeCloseTo(CUP.height, 5)
    expect(CUP.topRadius).toBeGreaterThan(CUP.bottomRadius)
  })

  it('nests the bowl inside the cup rim, flaring wider above it', () => {
    const points = trayProfilePoints()
    expect(points[0].y).toBeCloseTo(TRAY.y, 5)
    expect(TRAY.y).toBeLessThan(CUP.height)
    expect(TRAY.y).toBeGreaterThan(CUP.height * 0.85)
    // The bowl base fits inside the cup where it sits…
    expect(TRAY.bottomRadius).toBeLessThan(cupRadiusAt(TRAY.y))
    // …and the bowl wall meets the cup at its rim (seated, not floating).
    expect(Math.abs(trayRadiusAt(CUP.height) - CUP.topRadius)).toBeLessThan(0.03)
    expect(points[points.length - 1].x).toBeCloseTo(TRAY.topRadius, 5)
  })

  it('keeps the tea inside the cup walls and below the bowl', () => {
    expect(drinkRadiusAt(0)).toBeCloseTo(DRINK.bottomRadius, 5)
    expect(drinkRadiusAt(DRINK.height)).toBeCloseTo(DRINK.topRadius, 5)
    for (let h = 0; h <= DRINK.height; h += 0.1) {
      expect(drinkRadiusAt(h)).toBeLessThan(cupRadiusAt(DRINK.base + h))
    }
    expect(DRINK.base + DRINK.height).toBeLessThan(TRAY.y)
    const profile = drinkProfilePoints()
    expect(profile[0].x).toBe(0) // closed base
  })

  it('runs the straw from inside the tea to above the bowl', () => {
    expect(STRAW.bottom).toBeLessThan(DRINK.base + DRINK.height * DEFAULT_FILL)
    expect(STRAW.top).toBeGreaterThan(SAUCE.y + SAUCE.thickness)
    expect(MODEL_HEIGHT).toBe(STRAW.top)
    expect(MODEL_CENTER_Y).toBeCloseTo(MODEL_HEIGHT / 2, 5)
  })
})

describe('chip placement', () => {
  it('is deterministic for a seeded generator', () => {
    expect(chipPlacements(CHIP_COUNT, createPrng('chip-seed'))).toEqual(
      chipPlacements(CHIP_COUNT, createPrng('chip-seed')),
    )
    expect(chipPlacements()).toHaveLength(CHIP_COUNT)
  })

  it('fills the bowl from base to rim without poking through the wall', () => {
    const chips = chipPlacements(CHIP_COUNT, createPrng('chip-seed'))
    for (const chip of chips) {
      expect(chip.y).toBeGreaterThan(TRAY.y)
      expect(chip.y).toBeLessThan(TRAY_RIM_Y + 0.25)
      const wallRadius = trayRadiusAt(Math.min(chip.y, TRAY_RIM_Y))
      expect(Math.hypot(chip.x, chip.z)).toBeLessThan(wallRadius)
    }
    const lowest = Math.min(...chips.map((chip) => chip.y))
    const highest = Math.max(...chips.map((chip) => chip.y))
    expect(lowest).toBeLessThan(TRAY.y + TRAY.height * 0.4)
    expect(highest).toBeGreaterThan(TRAY_RIM_Y - CHIP_SIZE)
  })

  it('sorts chips bottom → top so the rain-in stacks naturally', () => {
    const chips = chipPlacements()
    for (let i = 1; i < chips.length; i++) expect(chips[i].y).toBeGreaterThanOrEqual(chips[i - 1].y)
  })

  it('builds a closed, cupped chip mesh', () => {
    const geometry = createChipGeometry()
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0)
    expect(box.max.x - box.min.x).toBeCloseTo(CHIP_SIZE * Math.sqrt(3), 1)
    expect(box.max.z - box.min.z).toBeGreaterThan(0.03) // bent, not flat
  })
})

describe('sauce', () => {
  it('bakes the flattened blob size into the geometry', () => {
    const geometry = createSauceGeometry(1)
    geometry.computeBoundingBox()
    const size = geometry.boundingBox!.getSize(new THREE.Vector3())
    expect(size.x / 2).toBeGreaterThan(SAUCE.radius * 0.85)
    expect(size.x / 2).toBeLessThan(SAUCE.radius * 1.2)
    expect(size.y).toBeLessThan(size.x)
  })

  it('places bits on the sauce surface', () => {
    for (const bit of sauceBits(12, createPrng('bits'))) {
      const r = Math.hypot(bit.x, bit.z)
      expect(r).toBeLessThan(SAUCE.radius)
      expect(bit.y).toBeCloseTo(sauceSurfaceY(r) - 0.01, 5)
    }
  })
})

describe('drink variants', () => {
  it('defines four bottom → top bands with ascending stops', () => {
    for (const variant of Object.values(DRINK_VARIANTS)) {
      expect(variant.layers).toHaveLength(4)
      const [a, b, c] = variant.stops
      expect(a).toBeLessThan(b)
      expect(b).toBeLessThan(c)
      expect(c).toBeLessThan(1)
    }
  })
})

describe('animation state', () => {
  it('defaults to a fully assembled cup', () => {
    expect(createCupState()).toEqual({
      fill: DEFAULT_FILL,
      drop: 0,
      spin: 0,
      sauceSquash: 1,
      explode: 0,
      tray: 1,
      chips: 1,
      sauce: 1,
      straw: 1,
    })
    expect(createCupState({ explode: 0.5 }).explode).toBe(0.5)
  })

  it('starts the intro fully disassembled', () => {
    const intro = createIntroState()
    expect(intro).toMatchObject({ fill: 0, tray: 0, chips: 0, sauce: 0, straw: 0 })
    expect(intro.drop).toBeGreaterThan(0)
  })

  it('explodes parts apart in stacking order', () => {
    expect(EXPLODE_OFFSETS.cup).toBeLessThan(EXPLODE_OFFSETS.tray)
    expect(EXPLODE_OFFSETS.tray).toBeLessThan(EXPLODE_OFFSETS.chips)
    expect(EXPLODE_OFFSETS.chips).toBeLessThan(EXPLODE_OFFSETS.sauce)
    expect(EXPLODE_OFFSETS.scale).toBeLessThan(1)
  })
})

describe('camera fit', () => {
  it('backs off further for narrow canvases so the wide bowl stays in frame', () => {
    const fit = { width: 2.7, height: 3.55, fov: 30 }
    expect(fitDistance(fit, 0.5)).toBeGreaterThan(fitDistance(fit, 1))
    // Wide canvases are height-limited, so distance stops shrinking.
    expect(fitDistance(fit, 2)).toBeCloseTo(fitDistance(fit, 3), 5)
  })
})

describe('gradient map', () => {
  it('creates a 3-step nearest-filter gradient texture', () => {
    const texture = createToonGradientMap(3)
    expect(texture.image.width).toBe(3)
    expect(texture.minFilter).toBe(THREE.NearestFilter)
  })
})
