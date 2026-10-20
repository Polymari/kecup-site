import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createPrng } from '../lib/prng'
import type { DrinkKey, FlavorKey } from '../data/types'

// Proportions follow the brand logo: a tall tapered clear cup with a wide
// conical nacho bowl nested into its rim, a straw through the middle.

export const CUP = {
  bottomRadius: 0.46,
  topRadius: 0.64,
  height: 1.72,
  wallThickness: 0.035,
} as const

export const TRAY = {
  bottomRadius: 0.56,
  topRadius: 1.02,
  height: 0.88,
  /** Bowl base height — sits ~0.12 inside the cup rim. */
  y: 1.6,
  /** Profile curvature exponent (<1 = slightly bellied wall). */
  curve: 0.85,
} as const

export const TRAY_RIM_Y = TRAY.y + TRAY.height

export const DRINK = {
  base: 0.035,
  height: TRAY.y - 0.05 - 0.035,
  get bottomRadius() {
    return cupRadiusAt(DRINK.base) - CUP.wallThickness
  },
  get topRadius() {
    return cupRadiusAt(DRINK.base + DRINK.height) - CUP.wallThickness
  },
} as const

export const STRAW = {
  radius: 0.055,
  bottom: 0.12,
  top: TRAY_RIM_Y + 0.5,
} as const

/** Overall assembled model height and its vertical centre (used to frame the camera). */
export const MODEL_HEIGHT = STRAW.top
export const MODEL_CENTER_Y = MODEL_HEIGHT / 2

export { DEFAULT_FILL } from './cupState'

export const CHIP_SIZE = 0.245
export const CHIP_COUNT = 44

const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1)

export function cupRadiusAt(y: number): number {
  const t = clamp01(y / CUP.height)
  return CUP.bottomRadius + (CUP.topRadius - CUP.bottomRadius) * t
}

export function trayRadiusAt(y: number): number {
  const t = clamp01((y - TRAY.y) / TRAY.height)
  return TRAY.bottomRadius + (TRAY.topRadius - TRAY.bottomRadius) * Math.pow(t, TRAY.curve)
}

/** Drink radius at a height measured from the drink base. */
export function drinkRadiusAt(height: number): number {
  const h = THREE.MathUtils.clamp(height, 0, DRINK.height)
  return cupRadiusAt(DRINK.base + h) - CUP.wallThickness
}

/** Open side wall of the cup (the base is a separate disc so it never gets a rim-ink band). */
export function cupProfilePoints(segments = 24): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const y = (i / segments) * CUP.height
    points.push(new THREE.Vector2(cupRadiusAt(y), y))
  }
  return points
}

export function trayProfilePoints(segments = 20): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const y = TRAY.y + (i / segments) * TRAY.height
    points.push(new THREE.Vector2(trayRadiusAt(y), y))
  }
  return points
}

/** Closed-bottom drink volume in drink-local space (y = 0 at the drink base). */
export function drinkProfilePoints(segments = 16): THREE.Vector2[] {
  const points: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
  for (let i = 0; i <= segments; i++) {
    const h = (i / segments) * DRINK.height
    points.push(new THREE.Vector2(drinkRadiusAt(h), h))
  }
  return points
}

export interface ChipPlacement {
  x: number
  y: number
  z: number
  /** Euler angles applied in 'YXZ' order: yaw (about Y), lean (tip outward), twist (in-plane). */
  yaw: number
  lean: number
  twist: number
  scale: number
  /** -1..1 colour variance (darker/lighter toast). */
  tint: number
}

/** Angle of the bowl wall from vertical — wall chips lean back against it. */
export const TRAY_WALL_LEAN = Math.atan2(TRAY.topRadius - TRAY.bottomRadius, TRAY.height)

/**
 * Seeded chip layout that fills the whole bowl like the logo: a few chips lying
 * flat on the base, three rings leaning against the wall (the top ring pokes
 * above the rim), and a crown mound in the middle for the sauce to sit on.
 * Sorted bottom → top so the "rain in" animation stacks naturally.
 */
export function chipPlacements(
  count = CHIP_COUNT,
  seedFn: () => number = createPrng('kecup-chips'),
): ChipPlacement[] {
  const rand = seedFn
  const placements: ChipPlacement[] = []
  const jitter = (amount: number) => (rand() - 0.5) * amount

  const base = Math.max(0, Math.round(count * 0.12))
  const crown = Math.max(0, Math.round(count * 0.34))
  const wallTotal = Math.max(0, count - base - crown)
  const rows = [
    { h: 0.36, share: 0.26, splay: 0 },
    { h: 0.64, share: 0.32, splay: 0.08 },
    { h: 0.93, share: 0.42, splay: 0.26 },
  ]

  for (let i = 0; i < base; i++) {
    const y = TRAY.y + 0.1 + rand() * 0.22
    const maxR = Math.max(0, trayRadiusAt(y) - CHIP_SIZE * 1.1)
    const r = Math.sqrt(rand()) * maxR
    const angle = rand() * Math.PI * 2
    placements.push({
      x: Math.cos(angle) * r,
      y,
      z: Math.sin(angle) * r,
      yaw: rand() * Math.PI * 2,
      lean: 1.15 + rand() * 0.35,
      twist: rand() * Math.PI * 2,
      scale: 0.9 + rand() * 0.2,
      tint: jitter(2),
    })
  }

  let placedWall = 0
  rows.forEach((row, rowIndex) => {
    const n =
      rowIndex === rows.length - 1 ? wallTotal - placedWall : Math.round(wallTotal * row.share)
    placedWall += n
    const rowOffset = rand()
    for (let j = 0; j < n; j++) {
      const y = TRAY.y + row.h * TRAY.height + jitter(0.06)
      const angle = ((j + rowOffset + jitter(0.35)) / n) * Math.PI * 2
      const r = trayRadiusAt(y) - 0.1 - row.splay * 0.12
      placements.push({
        x: Math.cos(angle) * r,
        y,
        z: Math.sin(angle) * r,
        // Face the chip's normal radially outward so it lies against the wall;
        // the top ring splays outward over the rim like the logo.
        yaw: Math.PI / 2 - angle,
        lean: TRAY_WALL_LEAN + row.splay + jitter(0.3),
        twist: jitter(0.7),
        scale: 0.92 + rand() * 0.22,
        tint: jitter(2),
      })
    }
  })

  for (let i = 0; i < crown; i++) {
    const r = 0.08 + Math.sqrt(rand()) * 0.55
    const angle = rand() * Math.PI * 2
    placements.push({
      x: Math.cos(angle) * r,
      y: TRAY_RIM_Y - 0.12 + (1 - r / 0.63) * 0.14 + rand() * 0.06,
      z: Math.sin(angle) * r,
      // Mostly upright, tipped outward, so tips poke through the sauce.
      yaw: Math.PI / 2 - angle + jitter(1.2),
      lean: 0.15 + rand() * 0.6,
      twist: jitter(1.4),
      scale: 0.95 + rand() * 0.25,
      tint: jitter(2),
    })
  }

  return placements.sort((a, b) => a.y - b.y)
}

/** Rounded nacho triangle, slightly cupped so it reads as a chip, not a flat sticker. */
export function createChipGeometry(size = CHIP_SIZE): THREE.ExtrudeGeometry {
  const corners = [90, 210, 330].map((deg) => {
    const rad = THREE.MathUtils.degToRad(deg)
    return new THREE.Vector2(Math.cos(rad) * size, Math.sin(rad) * size)
  })
  const round = 0.22
  const shape = new THREE.Shape()
  corners.forEach((corner, index) => {
    const prev = corners[(index + 2) % 3]
    const next = corners[(index + 1) % 3]
    const into = corner.clone().lerp(prev, round)
    const out = corner.clone().lerp(next, round)
    if (index === 0) shape.moveTo(into.x, into.y)
    else shape.lineTo(into.x, into.y)
    shape.quadraticCurveTo(corner.x, corner.y, out.x, out.y)
  })
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 4,
  })
  geometry.center()

  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    position.setZ(i, position.getZ(i) + 0.9 * (x * x * 0.6 + y * y * 0.25))
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Wobbly flattened sauce blob, scale baked in so outlines stay even. */
export function createSauceGeometry(detail = 4): THREE.BufferGeometry {
  // PolyhedronGeometry is non-indexed (flat-shaded facets); weld it first so
  // the displaced blob gets smooth normals.
  const ico = new THREE.IcosahedronGeometry(1, detail)
  ico.deleteAttribute('normal')
  ico.deleteAttribute('uv')
  const geometry = mergeVertices(ico)
  ico.dispose()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const lumps = 1 + 0.07 * Math.sin(x * 6.3 + 1.1) * Math.cos(z * 5.1) + 0.05 * Math.sin(y * 9.7 + x * 4)
    // Flatter underside so it drapes over the chips instead of floating as a ball.
    const squash = y < 0 ? 0.55 : 1
    position.setXYZ(
      i,
      x * SAUCE.radius * lumps,
      y * SAUCE.thickness * lumps * squash,
      z * SAUCE.radius * lumps,
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

export const SAUCE = {
  radius: 0.56,
  thickness: 0.17,
  y: TRAY_RIM_Y + 0.03,
} as const

/** Height of the sauce blob surface at a radial distance (ellipsoid approximation). */
export function sauceSurfaceY(radius: number): number {
  const t = THREE.MathUtils.clamp(radius / SAUCE.radius, 0, 1)
  return SAUCE.y + SAUCE.thickness * Math.sqrt(1 - t * t)
}

export interface Drip {
  angle: number
  length: number
}

export function sauceDrips(count = 8, seedFn: () => number = createPrng('kecup-drips')): Drip[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: ((index + seedFn() * 0.6) / count) * Math.PI * 2,
    length: 0.14 + seedFn() * 0.22,
  }))
}

export interface Bit {
  x: number
  y: number
  z: number
  rotation: number
  scale: number
}

export function sauceBits(count: number, seedFn: () => number = createPrng('kecup-bits')): Bit[] {
  return Array.from({ length: count }, () => {
    const r = Math.sqrt(seedFn()) * SAUCE.radius * 0.82
    const angle = seedFn() * Math.PI * 2
    return {
      x: Math.cos(angle) * r,
      y: sauceSurfaceY(r) - 0.01,
      z: Math.sin(angle) * r,
      rotation: seedFn() * Math.PI * 2,
      scale: 0.75 + seedFn() * 0.5,
    }
  })
}

export const SAUCE_VARIANTS: Record<
  FlavorKey,
  { color: string; bits: string; bitShape: 'meat' | 'slice' | 'flake'; bitCount: number }
> = {
  bolo: { color: '#B4432B', bits: '#6B2415', bitShape: 'meat', bitCount: 16 },
  mush: { color: '#D9B27C', bits: '#7A5230', bitShape: 'slice', bitCount: 10 },
  cheese: { color: '#F2B705', bits: '#D9452B', bitShape: 'flake', bitCount: 7 },
}

/** Four bands bottom → top with three boundaries (fractions of the fill height). */
export const DRINK_VARIANTS: Record<
  DrinkKey,
  { layers: [string, string, string, string]; stops: [number, number, number]; cap: string }
> = {
  'tea-cloudy': {
    layers: ['#9C5A2B', '#C98A4B', '#E8B98A', '#FBF4E3'],
    stops: [0.34, 0.58, 0.8],
    cap: '#FFF8EA',
  },
  'tea-fizzy': {
    layers: ['#C8401C', '#E8641E', '#F2932E', '#F7C04A'],
    stops: [0.3, 0.58, 0.86],
    cap: '#F9CF66',
  },
}
