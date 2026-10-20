import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  CHIP_COUNT,
  CHIP_SIZE,
  CHIP_VARIANT_COUNT,
  CUP,
  DRINK,
  DRINK_VARIANTS,
  MODEL_CENTER_Y,
  MODEL_HEIGHT,
  SAUCE,
  SAUCE_VARIANTS,
  STRAW,
  TRAY,
  TRAY_RIM_Y,
  chipFitsBowl,
  chipMatrix,
  chipPlacements,
  chipSamplePoints,
  createBitGeometry,
  createChipGeometry,
  createIceGeometry,
  createSauceGeometry,
  cupProfilePoints,
  cupRadiusAt,
  drinkProfilePoints,
  drinkRadiusAt,
  iceBoundingRadius,
  iceCubes,
  sauceBitPlacements,
  sauceDrips,
  sauceHeight,
  sauceRadiusAt,
  trayProfilePoints,
  trayRadiusAt,
} from './geometry'
import type { BitShape } from './geometry'
import { createToonGradientMap } from './gradientMap'
import { DEFAULT_FILL, EXPLODE_OFFSETS, createCupState, createIntroState } from './cupState'
import { fitDistance } from './cameraFit'
import { fbm3, noise3, tileNoise } from './noise'
import { TEXTURE_SIZE, createChipTextures, createGrainBump } from './textures'
import { createPrng } from '@/lib/prng'
import type { DrinkKey, FlavorKey } from '@/data/types'

const FLAVORS = Object.keys(SAUCE_VARIANTS) as FlavorKey[]
const DRINKS = Object.keys(DRINK_VARIANTS) as DrinkKey[]

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
    expect(TRAY.bottomRadius).toBeLessThan(cupRadiusAt(TRAY.y))
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
    expect(drinkProfilePoints()[0].x).toBe(0) // closed base
  })

  it('runs the straw from inside the tea to above the sauce', () => {
    expect(STRAW.bottom).toBeLessThan(DRINK.base + DRINK.height * DEFAULT_FILL)
    for (const flavor of FLAVORS) expect(STRAW.top).toBeGreaterThan(sauceHeight(0, 0, flavor))
    expect(MODEL_HEIGHT).toBe(STRAW.top)
    expect(MODEL_CENTER_Y).toBeCloseTo(MODEL_HEIGHT / 2, 5)
  })
})

describe('tortilla chips', () => {
  it('builds a closed, curled, thin chip mesh for every variant', () => {
    for (let variant = 0; variant < CHIP_VARIANT_COUNT; variant++) {
      const geometry = createChipGeometry(variant)
      geometry.computeBoundingBox()
      const box = geometry.boundingBox!
      const width = box.max.x - box.min.x
      expect(width).toBeGreaterThan(CHIP_SIZE * 1.4)
      expect(width).toBeLessThan(CHIP_SIZE * 2.1)
      // Curled, not flat — but still a chip, not a bowl.
      expect(box.max.z - box.min.z).toBeGreaterThan(0.04)
      expect(box.max.z - box.min.z).toBeLessThan(0.25)
      expect(geometry.getAttribute('color').count).toBe(geometry.getAttribute('position').count)
      expect(geometry.getAttribute('uv').count).toBe(geometry.getAttribute('position').count)
      // Indexed and watertight-ish: every index points at a real vertex.
      const index = geometry.getIndex()!
      expect(Math.max(...Array.from(index.array))).toBeLessThan(geometry.getAttribute('position').count)
      geometry.dispose()
    }
  })

  it('toasts the edges darker than the middle', () => {
    const geometry = createChipGeometry(0)
    const colors = geometry.getAttribute('color')
    const position = geometry.getAttribute('position')
    let edge = 0
    let edgeN = 0
    for (let i = 0; i < position.count; i++) {
      if (Math.hypot(position.getX(i), position.getY(i)) > CHIP_SIZE * 0.6) {
        edge += colors.getZ(i)
        edgeN++
      }
    }
    expect(colors.getZ(0)).toBeGreaterThan(edge / edgeN) // vertex 0 is the centre
  })

  it('is deterministic for a seeded generator', () => {
    expect(chipPlacements(CHIP_COUNT, createPrng('chip-seed'))).toEqual(
      chipPlacements(CHIP_COUNT, createPrng('chip-seed')),
    )
    expect(chipPlacements()).toHaveLength(CHIP_COUNT)
  })

  it('never pokes a chip through the plastic bowl', () => {
    for (const seed of ['kecup-chips', 'other-seed']) {
      const chips = chipPlacements(CHIP_COUNT, createPrng(seed))
      const point = new THREE.Vector3()
      for (const chip of chips) {
        expect(chipFitsBowl(chip)).toBe(true)
        const matrix = chipMatrix(chip)
        for (const sample of chipSamplePoints(chip.variant)) {
          point.copy(sample).applyMatrix4(matrix)
          expect(point.y).toBeGreaterThan(TRAY.y)
          if (point.y <= TRAY_RIM_Y) expect(Math.hypot(point.x, point.z)).toBeLessThan(trayRadiusAt(point.y))
        }
      }
    }
  })

  it('fills the bowl from the base to above the rim, using every variant', () => {
    const chips = chipPlacements()
    expect(Math.min(...chips.map((chip) => chip.y))).toBeLessThan(TRAY.y + TRAY.height * 0.4)
    expect(Math.max(...chips.map((chip) => chip.y))).toBeGreaterThan(TRAY_RIM_Y - 0.05)
    expect(new Set(chips.map((chip) => chip.variant)).size).toBe(CHIP_VARIANT_COUNT)
    for (let i = 1; i < chips.length; i++) expect(chips[i].y).toBeGreaterThanOrEqual(chips[i - 1].y)
  })
})

describe('sauce', () => {
  it('drapes each sauce over the chips inside the bowl', () => {
    for (const flavor of FLAVORS) {
      const geometry = createSauceGeometry(flavor, 32, 16)
      geometry.computeBoundingBox()
      const box = geometry.boundingBox!
      expect(box.max.y).toBeGreaterThan(0) // domed above its base
      expect(box.min.y).toBeLessThan(0) // sagging edge
      const position = geometry.getAttribute('position')
      for (let i = 0; i < position.count; i++) {
        const y = position.getY(i) + SAUCE.y
        const r = Math.hypot(position.getX(i), position.getZ(i))
        // Wherever the sauce dips below the rim it stays inside the bowl wall.
        if (y <= TRAY_RIM_Y) expect(r).toBeLessThan(trayRadiusAt(y))
        else expect(r).toBeLessThan(TRAY.topRadius)
      }
      expect(geometry.getAttribute('color').count).toBe(position.count)
      geometry.dispose()
    }
  })

  it('makes runny cheese flatter than chunky bolognese', () => {
    expect(sauceHeight(0, 0, 'cheese')).toBeLessThan(sauceHeight(0, 0, 'bolo'))
    expect(SAUCE_VARIANTS.cheese.lumps).toBeLessThan(SAUCE_VARIANTS.bolo.lumps)
    expect(SAUCE_VARIANTS.cheese.roughness).toBeLessThan(SAUCE_VARIANTS.bolo.roughness)
  })

  it('seats bits in the sauce surface', () => {
    for (const flavor of FLAVORS) {
      SAUCE_VARIANTS[flavor].bits.forEach((layer, layerIndex) => {
        const bits = sauceBitPlacements(flavor, layerIndex)
        expect(bits).toHaveLength(layer.count)
        for (const bit of bits) {
          const theta = Math.atan2(bit.z, bit.x)
          const rho = Math.hypot(bit.x, bit.z) / sauceRadiusAt(theta, flavor)
          expect(rho).toBeLessThanOrEqual(layer.reach + 1e-6)
          expect(bit.y).toBeCloseTo(sauceHeight(rho, theta, flavor) - layer.embed * bit.size, 5)
          expect(layer.colors).toContain(bit.color)
        }
      })
    }
    expect(sauceBitPlacements('bolo', 99)).toEqual([])
  })

  it('starts drips at the sauce edge', () => {
    for (const flavor of FLAVORS) {
      const drips = sauceDrips(flavor)
      expect(drips).toHaveLength(SAUCE_VARIANTS[flavor].drips)
      for (const drip of drips) {
        expect(Math.hypot(drip.x, drip.z)).toBeLessThan(sauceRadiusAt(drip.angle, flavor))
        expect(drip.tilt).toBeGreaterThan(0)
        expect(drip.tilt).toBeLessThan(Math.PI / 2)
      }
    }
  })

  it('gives every bit mesh a colour attribute (vertex-coloured material)', () => {
    for (const shape of ['mince', 'mushroom', 'speck', 'flake'] as BitShape[]) {
      const geometry = createBitGeometry(shape)
      expect(geometry.getAttribute('color').count).toBe(geometry.getAttribute('position').count)
      geometry.computeBoundingSphere()
      expect(geometry.boundingSphere!.radius).toBeLessThan(1)
      geometry.dispose()
    }
  })
})

describe('drinks', () => {
  it('matches the menu: cloudy has a cheese-foam cap, fizzy is iced and bubbly', () => {
    expect(DRINK_VARIANTS['tea-cloudy'].foam).toBeGreaterThan(0.15)
    expect(DRINK_VARIANTS['tea-fizzy'].foam).toBe(0)
    expect(DRINK_VARIANTS['tea-fizzy'].bubbles).toBe(true)
    expect(DRINK_VARIANTS['tea-fizzy'].ice).toBeGreaterThan(DRINK_VARIANTS['tea-cloudy'].ice)
    // Deep (thick) tea is darker than the thin tea at the edge.
    for (const drink of DRINKS) {
      const v = DRINK_VARIANTS[drink]
      expect(new THREE.Color(v.deep).getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(
        new THREE.Color(v.edge).getHSL({ h: 0, s: 0, l: 0 }).l,
      )
    }
  })

  it('packs ice inside the tea without overlaps or poking through the cup', () => {
    for (const drink of DRINKS) {
      const v = DRINK_VARIANTS[drink]
      const cubes = iceCubes(drink)
      expect(cubes).toHaveLength(v.ice)
      expect(cubes).toEqual(iceCubes(drink))
      const teaTop = DRINK.height * DEFAULT_FILL - v.foam
      cubes.forEach((cube, index) => {
        const bound = iceBoundingRadius(cube.size)
        expect(cube.y - bound).toBeGreaterThanOrEqual(0)
        expect(cube.y).toBeLessThan(teaTop)
        if (v.foam > 0) expect(cube.y + bound).toBeLessThanOrEqual(teaTop + 1e-9)
        expect(Math.hypot(cube.x, cube.z) + bound * 0.72).toBeLessThan(drinkRadiusAt(cube.y - bound))
        for (const other of cubes.slice(index + 1)) {
          expect(Math.hypot(cube.x - other.x, cube.y - other.y, cube.z - other.z)).toBeGreaterThan(
            (cube.size + other.size) * 0.6,
          )
        }
      })
    }
  })

  it('builds a unit, rounded ice cube', () => {
    const geometry = createIceGeometry()
    geometry.computeBoundingBox()
    const size = geometry.boundingBox!.getSize(new THREE.Vector3())
    expect(size.x).toBeGreaterThan(0.9)
    expect(size.x).toBeLessThan(1.25)
    geometry.dispose()
  })
})

describe('procedural textures + noise', () => {
  it('is deterministic and bounded', () => {
    expect(noise3(1.3, 2.7, 0.4, 5)).toBe(noise3(1.3, 2.7, 0.4, 5))
    for (let i = 0; i < 200; i++) {
      const n = noise3(i * 0.37, i * 0.11, i * 0.73)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
      expect(Math.abs(fbm3(i * 0.2, i * 0.5, 1))).toBeLessThanOrEqual(0.5)
    }
  })

  it('tiles seamlessly', () => {
    expect(tileNoise(0, 0.3, 6)).toBeCloseTo(tileNoise(1, 0.3, 6), 6)
    expect(tileNoise(0.4, 0, 6)).toBeCloseTo(tileNoise(0.4, 1, 6), 6)
  })

  it('builds golden chip colour + bump maps without a DOM', () => {
    const { map, bump } = createChipTextures()
    expect(map.image.width).toBe(TEXTURE_SIZE)
    expect(map.colorSpace).toBe(THREE.SRGBColorSpace)
    expect(bump.colorSpace).toBe(THREE.NoColorSpace)
    const data = map.image.data as Uint8Array
    let r = 0
    let b = 0
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      b += data[i + 2]
    }
    expect(r).toBeGreaterThan(b * 1.6) // warm, golden tortilla
    const grain = createGrainBump(20, 1)
    expect(grain.wrapS).toBe(THREE.RepeatWrapping)
    ;[map, bump, grain].forEach((texture) => texture.dispose())
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
