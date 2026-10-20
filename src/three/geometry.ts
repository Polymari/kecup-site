import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createPrng } from '../lib/prng'
import type { DrinkKey, FlavorKey } from '../data/types'
import { DEFAULT_FILL } from './cupState'
import { fbm3 } from './noise'

export { DEFAULT_FILL }

// Proportions follow a 16 oz clear PET cup with a conical nacho topper bowl
// nested into its rim and a straw through the middle (as in the brand logo).

export const CUP = {
  bottomRadius: 0.44,
  topRadius: 0.64,
  height: 1.72,
  wallThickness: 0.03,
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

const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1)
const lerp = THREE.MathUtils.lerp
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

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

/** Open side wall of the cup (the base is a separate disc). */
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

// ---------------------------------------------------------------------------
// Tortilla chips
// ---------------------------------------------------------------------------

/** Circumradius of a chip triangle (side ≈ 0.52, about 3.6 cm at cup scale). */
export const CHIP_SIZE = 0.3
export const CHIP_THICKNESS = 0.022
export const CHIP_COUNT = 64
export const CHIP_VARIANT_COUNT = 3

interface ChipShape {
  /** Bend across the chip (x²) and along it (y²); a negative value makes a saddle. */
  curlX: number
  curlY: number
  /** Small surface ripples. */
  wave: number
  /** Corner rounding as a fraction of the side. */
  round: number
  /** Edge irregularity as a fraction of the radius (broken, hand-cut look). */
  chew: number
  seed: number
}

const CHIP_SHAPES: readonly ChipShape[] = [
  { curlX: 1.0, curlY: 0.3, wave: 0.012, round: 0.22, chew: 0.05, seed: 3 },
  { curlX: 0.45, curlY: 0.85, wave: 0.016, round: 0.17, chew: 0.06, seed: 7 },
  { curlX: 1.2, curlY: -0.45, wave: 0.01, round: 0.26, chew: 0.045, seed: 11 },
]

function chipShape(variant: number): ChipShape {
  return CHIP_SHAPES[((variant % CHIP_VARIANT_COUNT) + CHIP_VARIANT_COUNT) % CHIP_VARIANT_COUNT]
}

/** Height of the chip's mid-surface above its plane (local +Z). */
export function chipSurfaceZ(variant: number, x: number, y: number): number {
  const shape = chipShape(variant)
  return shape.curlX * x * x + shape.curlY * y * y + shape.wave * fbm3(x * 9, y * 9, shape.seed, 2, shape.seed) * 2
}

/** Rounded, slightly irregular triangle outline (counter-clockwise, centroid at the origin). */
export function chipOutline(variant = 0, size = CHIP_SIZE, perSide = 6): THREE.Vector2[] {
  const shape = chipShape(variant)
  const corners = [90, 210, 330].map((deg) => {
    const rad = THREE.MathUtils.degToRad(deg)
    return new THREE.Vector2(Math.cos(rad) * size, Math.sin(rad) * size)
  })
  const points: THREE.Vector2[] = []
  corners.forEach((corner, index) => {
    const prev = corners[(index + 2) % 3]
    const next = corners[(index + 1) % 3]
    const into = corner.clone().lerp(prev, shape.round)
    const out = corner.clone().lerp(next, shape.round)
    // Rounded corner: quadratic Bézier into → corner → out.
    for (let s = 0; s < perSide; s++) {
      const t = s / perSide
      const a = into.clone().lerp(corner, t)
      const b = corner.clone().lerp(out, t)
      points.push(a.lerp(b, t))
    }
    const nextInto = next.clone().lerp(corner, shape.round)
    for (let s = 0; s < perSide; s++) points.push(out.clone().lerp(nextInto, s / perSide))
  })
  return points.map((point) => {
    const angle = Math.atan2(point.y, point.x)
    const chew = 1 + shape.chew * fbm3(Math.cos(angle) * 2.4, Math.sin(angle) * 2.4, shape.seed, 3, shape.seed) * 2
    return point.multiplyScalar(chew)
  })
}

const CHIP_RINGS = 5
/** Tortilla chips are thinner at the edge than in the middle. */
const chipHalfThickness = (ringFraction: number) => (CHIP_THICKNESS / 2) * (1 - 0.35 * ringFraction * ringFraction)

/**
 * Closed chip mesh: curled top and bottom surfaces (rings from the centre to
 * the outline) joined by a thin edge strip. Shared edge vertices give the
 * rim a soft, rounded highlight. Vertex colours toast the edges.
 */
export function createChipGeometry(variant = 0, size = CHIP_SIZE): THREE.BufferGeometry {
  const shape = chipShape(variant)
  const outline = chipOutline(variant, size)
  const n = outline.length
  const positions: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const uvOffset = (variant % CHIP_VARIANT_COUNT) * 0.31

  const push = (x: number, y: number, z: number, ringFraction: number) => {
    positions.push(x, y, z)
    uvs.push(x / (2 * size) + 0.5 + uvOffset, y / (2 * size) + 0.5 + uvOffset * 0.7)
    const toast = smoothstep(0.5, 1, ringFraction) * 0.32 + Math.max(0, fbm3(x * 12, y * 12, shape.seed + 5, 2, 9)) * 0.25
    colors.push(1 - toast * 0.7, 1 - toast * 1.0, 1 - toast * 1.55)
  }

  const surfaceStart: number[] = []
  for (const side of [1, -1]) {
    const start = positions.length / 3
    surfaceStart.push(start)
    push(0, 0, chipSurfaceZ(variant, 0, 0) + side * chipHalfThickness(0), 0)
    for (let k = 1; k <= CHIP_RINGS; k++) {
      const f = k / CHIP_RINGS
      for (let i = 0; i < n; i++) {
        const x = outline[i].x * f
        const y = outline[i].y * f
        push(x, y, chipSurfaceZ(variant, x, y) + side * chipHalfThickness(f), f)
      }
    }
    const ring = (k: number, i: number) => start + 1 + (k - 1) * n + (((i % n) + n) % n)
    for (let i = 0; i < n; i++) {
      if (side > 0) indices.push(start, ring(1, i), ring(1, i + 1))
      else indices.push(start, ring(1, i + 1), ring(1, i))
    }
    for (let k = 1; k < CHIP_RINGS; k++) {
      for (let i = 0; i < n; i++) {
        const a = ring(k, i)
        const b = ring(k + 1, i)
        const c = ring(k + 1, i + 1)
        const d = ring(k, i + 1)
        if (side > 0) indices.push(a, b, c, a, c, d)
        else indices.push(a, c, b, a, d, c)
      }
    }
  }

  // Edge strip between the top and bottom outlines (outward-facing).
  const edge = (start: number, i: number) => start + 1 + (CHIP_RINGS - 1) * n + (((i % n) + n) % n)
  for (let i = 0; i < n; i++) {
    const t0 = edge(surfaceStart[0], i)
    const t1 = edge(surfaceStart[0], i + 1)
    const b0 = edge(surfaceStart[1], i)
    const b1 = edge(surfaceStart[1], i + 1)
    indices.push(b0, b1, t1, b0, t1, t0)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export interface ChipPlacement {
  x: number
  y: number
  z: number
  /** Euler angles applied in 'YXZ' order: yaw (about Y), lean (tip), twist (in-plane). */
  yaw: number
  lean: number
  twist: number
  scale: number
  /** -1..1 colour variance (darker/lighter toast). */
  tint: number
  /** Which of the CHIP_VARIANT_COUNT chip meshes to use. */
  variant: number
}

/** Angle of the bowl wall from vertical. */
export const TRAY_WALL_LEAN = Math.atan2(TRAY.topRadius - TRAY.bottomRadius, TRAY.height)

const sampleCache = new Map<number, THREE.Vector3[]>()
/** Points on a chip's outer edge (both faces) used for containment tests. */
export function chipSamplePoints(variant: number): THREE.Vector3[] {
  const key = ((variant % CHIP_VARIANT_COUNT) + CHIP_VARIANT_COUNT) % CHIP_VARIANT_COUNT
  const cached = sampleCache.get(key)
  if (cached) return cached
  const half = chipHalfThickness(1)
  const points: THREE.Vector3[] = []
  chipOutline(key).forEach((point, index) => {
    if (index % 2) return
    const z = chipSurfaceZ(key, point.x, point.y)
    points.push(new THREE.Vector3(point.x, point.y, z + half), new THREE.Vector3(point.x, point.y, z - half))
  })
  sampleCache.set(key, points)
  return points
}

export function chipMatrix(chip: ChipPlacement, target = new THREE.Matrix4()): THREE.Matrix4 {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(chip.lean, chip.yaw, chip.twist, 'YXZ'))
  return target.compose(
    new THREE.Vector3(chip.x, chip.y, chip.z),
    quaternion,
    new THREE.Vector3(chip.scale, chip.scale, chip.scale),
  )
}

/** Chips may spill above the rim, but nothing pokes through the plastic. */
const RIM_OVERHANG = 0.12
const PILE_MAX_Y = TRAY_RIM_Y + 0.45

export function chipFitsBowl(chip: ChipPlacement): boolean {
  const matrix = chipMatrix(chip)
  const point = new THREE.Vector3()
  for (const sample of chipSamplePoints(chip.variant)) {
    point.copy(sample).applyMatrix4(matrix)
    if (point.y < TRAY.y + 0.012 || point.y > PILE_MAX_Y) return false
    const radius = Math.hypot(point.x, point.z)
    if (point.y <= TRAY_RIM_Y) {
      if (radius > trayRadiusAt(point.y) - 0.015) return false
    } else if (radius > TRAY.topRadius + RIM_OVERHANG) {
      return false
    }
  }
  return true
}

/**
 * Seeded chip pile that fills the bowl like a real serving: overlapping chips
 * nested against the wall (convex side out, random in-plane twist), a loose
 * middle, and a crown spilling over the rim and poking up through the sauce.
 * Every chip is rejection-sampled so it stays inside the plastic. Sorted
 * bottom → top so the "rain in" animation stacks naturally.
 */
export function chipPlacements(
  count = CHIP_COUNT,
  seedFn: () => number = createPrng('kecup-chips'),
): ChipPlacement[] {
  const rand = seedFn
  const jitter = (amount: number) => (rand() - 0.5) * amount
  const placements: ChipPlacement[] = []
  let variantCursor = 0
  const nextVariant = () => variantCursor++ % CHIP_VARIANT_COUNT

  const place = (make: (attempt: number) => Omit<ChipPlacement, 'variant'>, variant: number) => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const chip = { ...make(attempt), variant }
      if (chipFitsBowl(chip)) {
        placements.push(chip)
        return
      }
    }
    // Fallback that always fits: lying flat on the bowl floor.
    placements.push({
      x: jitter(0.12),
      y: TRAY.y + 0.1 + placements.length * 0.002,
      z: jitter(0.12),
      yaw: rand() * Math.PI * 2,
      lean: -Math.PI / 2,
      twist: rand() * Math.PI * 2,
      scale: 0.9,
      tint: jitter(2),
      variant,
    })
  }

  const wallTotal = Math.round(count * 0.56)
  const middle = Math.round(count * 0.14)
  const crown = Math.max(0, count - wallTotal - middle)

  // Wall: staggered rows, row size proportional to the circumference there.
  const rows = [
    { h: 0.24, splay: 0 },
    { h: 0.52, splay: 0.05 },
    { h: 0.8, splay: 0.22 },
  ]
  const weights = rows.map((row) => trayRadiusAt(TRAY.y + row.h * TRAY.height))
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  let placedWall = 0
  rows.forEach((row, rowIndex) => {
    const n =
      rowIndex === rows.length - 1
        ? wallTotal - placedWall
        : Math.round((wallTotal * weights[rowIndex]) / weightSum)
    placedWall += n
    const rowOffset = rand()
    for (let j = 0; j < n; j++) {
      const angle = ((j + rowOffset + jitter(0.5)) / n) * Math.PI * 2
      const baseY = TRAY.y + row.h * TRAY.height + jitter(0.08)
      const twist = rand() * Math.PI * 2
      place((attempt) => {
        const y = baseY + attempt * 0.012
        const r = trayRadiusAt(y) - 0.05 - attempt * 0.02
        return {
          x: Math.cos(angle) * Math.max(r, 0),
          y,
          z: Math.sin(angle) * Math.max(r, 0),
          // Normal points inward, so the curl's convex side nests against the wall.
          yaw: (3 * Math.PI) / 2 - angle + jitter(0.3),
          lean: -(TRAY_WALL_LEAN + row.splay) + jitter(0.25),
          twist: twist + attempt * 0.7,
          scale: 0.9 + rand() * 0.22,
          tint: jitter(2),
        }
      }, nextVariant())
    }
  })

  // Loose middle of the pile.
  for (let i = 0; i < middle; i++) {
    const angle = rand() * Math.PI * 2
    const r0 = 0.12 + Math.sqrt(rand()) * 0.35
    const y0 = TRAY.y + 0.2 + rand() * (TRAY.height - 0.35)
    const flip = rand() < 0.5 ? 1 : -1
    place((attempt) => {
      const r = Math.max(0, r0 - attempt * 0.02)
      return {
        x: Math.cos(angle) * r,
        y: y0 + attempt * 0.01,
        z: Math.sin(angle) * r,
        yaw: rand() * Math.PI * 2,
        lean: flip * (0.4 + rand() * 1.0),
        twist: rand() * Math.PI * 2,
        scale: 0.9 + rand() * 0.2,
        tint: jitter(2),
      }
    }, nextVariant())
  }

  // Crown: chips spilling over the rim with tips up, and a bed of chips lying
  // across the top of the mound for the sauce to sit on.
  for (let i = 0; i < crown; i++) {
    const outer = i < crown * 0.65
    const angle = ((i + rand() * 0.6) / Math.max(1, crown)) * Math.PI * 2 * (outer ? 1 / 0.65 : 1) + rand()
    const r0 = outer ? 0.58 + rand() * 0.25 : 0.18 + rand() * 0.3
    const y0 = outer ? TRAY_RIM_Y - 0.2 + rand() * 0.08 : TRAY_RIM_Y + rand() * 0.08
    place((attempt) => {
      const r = Math.max(0, r0 - attempt * 0.025)
      return {
        x: Math.cos(angle) * r,
        y: y0 - attempt * 0.008,
        z: Math.sin(angle) * r,
        yaw: outer ? (3 * Math.PI) / 2 - angle + jitter(0.6) : Math.PI / 2 - angle + jitter(0.8),
        // Outer: leaning out over the rim. Inner: lying 10–35° off flat, tilted outward.
        lean: outer ? -(TRAY_WALL_LEAN * 0.7 + rand() * 0.45) : -(0.95 + rand() * 0.45),
        twist: outer ? jitter(0.9) : rand() * Math.PI * 2,
        scale: 0.95 + rand() * 0.2,
        tint: jitter(2),
      }
    }, nextVariant())
  }

  return placements.sort((a, b) => a.y - b.y)
}

// ---------------------------------------------------------------------------
// Sauce
// ---------------------------------------------------------------------------

export const SAUCE = {
  radius: 0.74,
  thickness: 0.15,
  y: TRAY_RIM_Y + 0.1,
  /** How far the sauce edge sags down into the chips. */
  droop: 0.26,
} as const

export type BitShape = 'mince' | 'mushroom' | 'speck' | 'flake'

export interface BitLayer {
  shape: BitShape
  count: number
  colors: string[]
  /** World-size range of each bit. */
  size: [number, number]
  /** Fraction of the bit's size sunk into the sauce. */
  embed: number
  /** Max radial reach as a fraction of the sauce radius. */
  reach: number
  /** Max tilt away from lying on the surface (radians); Infinity = any orientation. */
  tilt: number
}

export interface SauceVariant {
  color: string
  roughness: number
  clearcoat: number
  /** Scale on the base radius (runny sauces spread wider). */
  size: number
  /** Lobe amplitude around the edge. */
  spread: number
  thickness: number
  droop: number
  /** Dome exponent: lower = flatter pooled top with a steeper edge. */
  profile: number
  /** Surface lump amplitude and frequency. */
  lumps: number
  lumpFreq: number
  /** Vertex-colour variation (mottling). */
  colorJitter: number
  drips: number
  dripLength: [number, number]
  bits: BitLayer[]
}

export const SAUCE_VARIANTS: Record<FlavorKey, SauceVariant> = {
  // Meaty bolognese: chunky browned mince in a glossy tomato-oil sauce.
  bolo: {
    color: '#6E2913',
    roughness: 0.55,
    clearcoat: 0.3,
    size: 0.94,
    spread: 0.16,
    thickness: 0.9,
    droop: 1,
    profile: 0.6,
    lumps: 0.09,
    lumpFreq: 9,
    colorJitter: 0.35,
    drips: 5,
    dripLength: [0.06, 0.14],
    bits: [
      {
        shape: 'mince',
        count: 340,
        colors: ['#5C2412', '#6E2C15', '#7F3519', '#4A1C0E', '#8E4420', '#673018'],
        size: [0.055, 0.095],
        embed: 0.35,
        reach: 0.9,
        tilt: Infinity,
      },
      {
        shape: 'speck',
        count: 26,
        colors: ['#C2541E', '#D46A2A'],
        size: [0.014, 0.024],
        embed: 0.3,
        reach: 0.85,
        tilt: 0.3,
      },
    ],
  },
  // Creamy mushroom: pale cream sauce with sliced button mushrooms and pepper.
  mush: {
    color: '#DDCCA8',
    roughness: 0.5,
    clearcoat: 0.3,
    size: 1,
    spread: 0.14,
    thickness: 0.85,
    droop: 1.15,
    profile: 0.5,
    lumps: 0.022,
    lumpFreq: 4,
    colorJitter: 0.07,
    drips: 4,
    dripLength: [0.05, 0.11],
    bits: [
      {
        shape: 'mushroom',
        count: 16,
        colors: ['#C2A47F', '#B0916B', '#CDB592', '#A88A66'],
        size: [0.2, 0.28],
        embed: 0.25,
        reach: 0.8,
        tilt: 1.0,
      },
      {
        // Chopped mushroom pieces through the cream.
        shape: 'mince',
        count: 46,
        colors: ['#8C7457', '#7A6248', '#9C8566', '#6E5840'],
        size: [0.06, 0.1],
        embed: 0.45,
        reach: 0.85,
        tilt: Infinity,
      },
      {
        shape: 'speck',
        count: 70,
        colors: ['#3B3029', '#4E4036', '#2E2620'],
        size: [0.006, 0.011],
        embed: 0.2,
        reach: 0.9,
        tilt: 0.3,
      },
    ],
  },
  // Golden cheese: smooth, glossy, runny melted cheese with a few chilli flakes.
  cheese: {
    color: '#EE9F1C',
    roughness: 0.3,
    clearcoat: 0.8,
    size: 0.95,
    spread: 0.22,
    thickness: 0.36,
    droop: 1.45,
    profile: 0.3,
    lumps: 0.035,
    lumpFreq: 6,
    colorJitter: 0.22,
    drips: 6,
    dripLength: [0.08, 0.16],
    bits: [
      {
        shape: 'flake',
        count: 16,
        colors: ['#B5301A', '#C8401F', '#9E2815'],
        size: [0.03, 0.045],
        embed: 0.3,
        reach: 0.8,
        tilt: 0.6,
      },
    ],
  },
}

/** Sauce edge radius in a direction (lobed, slightly irregular puddle). */
export function sauceRadiusAt(theta: number, flavor: FlavorKey): number {
  const v = SAUCE_VARIANTS[flavor]
  const lobes = 0.55 * Math.sin(3 * theta + 0.7) + 0.3 * Math.sin(5 * theta + 2.1) + 0.15 * Math.sin(8 * theta + 4)
  const wobble = fbm3(Math.cos(theta) * 1.5, Math.sin(theta) * 1.5, 3, 3, 41) * 2
  return SAUCE.radius * v.size * (1 + v.spread * lobes + 0.04 * wobble)
}

/**
 * Sauce height at a normalised radius ρ (0 centre → 1 edge) in direction θ.
 * Top: a dollop that sags towards the edge, with lumps. Bottom: a thin
 * underside following the same sag, so the sauce drapes over the chip mound.
 */
export function sauceHeight(rho: number, theta: number, flavor: FlavorKey, top = true): number {
  const v = SAUCE_VARIANTS[flavor]
  const p = clamp01(rho)
  const dome = Math.pow(Math.max(0, 1 - p * p), v.profile)
  const thickness = SAUCE.thickness * v.thickness
  const sag = SAUCE.droop * v.droop * p * p
  if (!top) return SAUCE.y - thickness * 0.3 * dome - sag
  const ux = p * Math.cos(theta)
  const uy = Math.sqrt(Math.max(0, 1 - p * p))
  const uz = p * Math.sin(theta)
  const f = v.lumpFreq
  const lumps = v.lumps * fbm3(ux * f, uy * f, uz * f, 3, 13) * 2 * (1 - Math.pow(p, 6))
  return SAUCE.y + thickness * dome - sag + lumps
}

/** Sauce mesh in sauce-local space (y = 0 at SAUCE.y), with mottling vertex colours. */
export function createSauceGeometry(flavor: FlavorKey, widthSegments = 80, heightSegments = 40): THREE.BufferGeometry {
  const v = SAUCE_VARIANTS[flavor]
  const sphere = new THREE.SphereGeometry(1, widthSegments, heightSegments)
  sphere.deleteAttribute('normal')
  sphere.deleteAttribute('uv')
  // Weld the seam/pole duplicates first so the displaced blob shades smoothly.
  const geometry = mergeVertices(sphere, 1e-4)
  sphere.dispose()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const rho = Math.min(1, Math.hypot(x, z))
    const theta = Math.atan2(z, x)
    const radius = rho * sauceRadiusAt(theta, flavor)
    const height = sauceHeight(rho, theta, flavor, y >= 0) - SAUCE.y
    position.setXYZ(i, Math.cos(theta) * radius, height, Math.sin(theta) * radius)
    let shade = 1 - v.colorJitter * (0.5 + fbm3(x * 7, y * 7, z * 7, 3, 29))
    if (y < 0) shade *= 0.8
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade
    colors[i * 3 + 2] = shade
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export interface BitPlacement {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  size: number
  color: string
}

/** Bits (mince, mushroom slices, pepper, chilli) sitting in the sauce surface. */
export function sauceBitPlacements(
  flavor: FlavorKey,
  layerIndex: number,
  seedFn: () => number = createPrng(`kecup-bits-${flavor}-${layerIndex}`),
): BitPlacement[] {
  const layer = SAUCE_VARIANTS[flavor].bits[layerIndex]
  if (!layer) return []
  const rand = seedFn
  return Array.from({ length: layer.count }, () => {
    const rho = Math.sqrt(rand()) * layer.reach
    const theta = rand() * Math.PI * 2
    const radius = rho * sauceRadiusAt(theta, flavor)
    const size = lerp(layer.size[0], layer.size[1], rand())
    const free = !Number.isFinite(layer.tilt)
    return {
      x: Math.cos(theta) * radius,
      y: sauceHeight(rho, theta, flavor, true) - layer.embed * size,
      z: Math.sin(theta) * radius,
      rx: free ? rand() * Math.PI * 2 : (rand() - 0.5) * 2 * layer.tilt,
      ry: rand() * Math.PI * 2,
      rz: free ? rand() * Math.PI * 2 : (rand() - 0.5) * 2 * layer.tilt,
      size,
      color: layer.colors[Math.floor(rand() * layer.colors.length)],
    }
  })
}

export interface Drip {
  angle: number
  length: number
  radius: number
  /** Outward tilt from vertical, so the drip runs down the chip mound. */
  tilt: number
  x: number
  y: number
  z: number
}

export function sauceDrips(
  flavor: FlavorKey,
  seedFn: () => number = createPrng(`kecup-drips-${flavor}`),
): Drip[] {
  const v = SAUCE_VARIANTS[flavor]
  return Array.from({ length: v.drips }, (_, index) => {
    const angle = ((index + seedFn() * 0.6) / v.drips) * Math.PI * 2
    const rho = 0.86
    const radius = rho * sauceRadiusAt(angle, flavor)
    return {
      angle,
      length: lerp(v.dripLength[0], v.dripLength[1], seedFn()),
      radius: 0.022 + seedFn() * 0.014,
      tilt: 0.12 + seedFn() * 0.22,
      x: Math.cos(angle) * radius,
      y: sauceHeight(rho, angle, flavor, true) - 0.03,
      z: Math.sin(angle) * radius,
    }
  })
}

export function withWhiteColors(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const count = geometry.getAttribute('position').count
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3))
  return geometry
}

function lumpy(detail: number, amount: number, seed: number, squash = 1): THREE.BufferGeometry {
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
    const k = 1 + amount * fbm3(x * 1.8, y * 1.8, z * 1.8, 2, seed) * 2
    position.setXYZ(i, x * k * 0.5, y * k * 0.5 * squash, z * k * 0.5)
  }
  geometry.computeVertexNormals()
  return withWhiteColors(geometry)
}

/** Unit-sized (≈1 across) bit meshes, all with a colour attribute for vertexColors. */
export function createBitGeometry(shape: BitShape): THREE.BufferGeometry {
  if (shape === 'mince') return lumpy(1, 0.45, 5)
  if (shape === 'speck') return lumpy(0, 0.2, 9, 0.45)
  if (shape === 'flake') return lumpy(0, 0.5, 15, 0.2)

  // Sliced button mushroom: domed cap over a short stem, seen in cross-section.
  const outline = new THREE.Shape()
  outline.moveTo(-0.12, -0.42)
  outline.lineTo(0.12, -0.42)
  outline.quadraticCurveTo(0.15, -0.15, 0.14, 0)
  outline.quadraticCurveTo(0.3, 0.02, 0.5, -0.02)
  outline.quadraticCurveTo(0.52, 0.4, 0, 0.45)
  outline.quadraticCurveTo(-0.52, 0.4, -0.5, -0.02)
  outline.quadraticCurveTo(-0.3, 0.02, -0.14, 0)
  outline.quadraticCurveTo(-0.15, -0.15, -0.12, -0.42)
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 8,
  })
  geometry.center()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i) + 0.015
    // Brown skin along the top of the cap; the cut face stays pale.
    const ellipse = y > 0 ? Math.hypot(x / 0.5, y / 0.45) : 0
    const skin = smoothstep(0.8, 0.95, ellipse)
    colors[i * 3] = 1 - skin * 0.42
    colors[i * 3 + 1] = 1 - skin * 0.52
    colors[i * 3 + 2] = 1 - skin * 0.6
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  // Lie flat (thickness along Y) so "tilt" reads as a slice resting in the sauce.
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

// ---------------------------------------------------------------------------
// Drinks
// ---------------------------------------------------------------------------

export interface DrinkVariant {
  /** Colour where the tea is thickest (centre of the cup). */
  deep: string
  /** Colour at grazing angles near the plastic, where the tea is thin. */
  edge: string
  /** Top surface colour. */
  surface: string
  /** Cheese-foam cap height in model units (0 = none). */
  foam: number
  foamColor: string
  ice: number
  iceSize: [number, number]
  bubbles: boolean
}

// Matches the printed menu photo: Cloudy = deep red-amber tea under a thick
// silky cheese-foam cap; Fizzy = golden lemon tea packed with ice, bubbling.
export const DRINK_VARIANTS: Record<DrinkKey, DrinkVariant> = {
  'tea-cloudy': {
    deep: '#541A0A',
    edge: '#C2552B',
    surface: '#7A2E14',
    foam: 0.25,
    foamColor: '#F4ECDD',
    ice: 9,
    iceSize: [0.2, 0.26],
    bubbles: false,
  },
  'tea-fizzy': {
    deep: '#94460B',
    edge: '#EBA845',
    surface: '#C97A22',
    foam: 0,
    foamColor: '#F8F2E6',
    ice: 16,
    iceSize: [0.19, 0.25],
    bubbles: true,
  },
}

export interface IceCube {
  x: number
  /** Height of the cube centre above the drink base. */
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  size: number
}

/** Bounding-sphere radius of a cube of the given edge length. */
export const iceBoundingRadius = (size: number) => size * 0.87

/** Seeded ice layout inside the tea (no cube pokes through the plastic or overlaps another). */
export function iceCubes(drink: DrinkKey, seedFn: () => number = createPrng(`kecup-ice-${drink}`)): IceCube[] {
  const v = DRINK_VARIANTS[drink]
  const rand = seedFn
  const top = DRINK.height * DEFAULT_FILL - v.foam
  const cubes: IceCube[] = []
  for (let attempt = 0; cubes.length < v.ice && attempt < v.ice * 80; attempt++) {
    const size = lerp(v.iceSize[0], v.iceSize[1], rand())
    const bound = iceBoundingRadius(size)
    // Ice floats: with no foam, the top cubes may break the surface a little.
    const maxY = top - (v.foam > 0 ? bound : size * 0.2)
    if (maxY <= bound) break
    const y = bound + rand() * (maxY - bound)
    // Rounded cubes: the corners are softened, so ~0.7 of the bounding radius is a safe wall gap.
    const maxR = drinkRadiusAt(y - bound) - bound * 0.72 - 0.012
    if (maxR <= 0) continue
    const r = Math.pow(rand(), 0.35) * maxR
    const angle = rand() * Math.PI * 2
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    const clash = cubes.some((cube) => Math.hypot(cube.x - x, cube.y - y, cube.z - z) < (cube.size + size) * 0.62)
    if (clash) continue
    cubes.push({ x, y, z, rx: rand() * Math.PI, ry: rand() * Math.PI, rz: rand() * Math.PI, size })
  }
  return cubes.sort((a, b) => a.y - b.y)
}

/** Unit ice cube: rounded edges, slightly melted and irregular. */
export function createIceGeometry(): THREE.BufferGeometry {
  const box = new RoundedBoxGeometry(1, 1, 1, 4, 0.2)
  box.deleteAttribute('normal')
  box.deleteAttribute('uv')
  const geometry = mergeVertices(box, 1e-4)
  box.dispose()
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const k = 1 + 0.09 * fbm3(x * 2.5, y * 2.5, z * 2.5, 2, 77) * 2
    position.setXYZ(i, x * k, y * k * 0.94, z * k)
  }
  geometry.computeVertexNormals()
  return geometry
}
