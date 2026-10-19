import * as THREE from 'three'

export const CUP = {
  bottomRadius: 0.52,
  topRadius: 0.62,
  height: 1.55,
  wallThickness: 0.03,
} as const

export const TRAY = {
  bottomRadius: 0.5,
  topRadius: 1.05,
  height: 0.55,
  sleeveRadius: 0.16,
  sleeveHeight: 0.42,
  y: 1.52,
} as const

export const DRINK = {
  bottomRadius: CUP.bottomRadius - CUP.wallThickness,
  topRadius: CUP.topRadius - CUP.wallThickness,
  height: CUP.height * 0.88,
} as const

export const CHIP_COUNT = 36

export function cupProfilePoints(segments = 24): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const radius = CUP.bottomRadius + (CUP.topRadius - CUP.bottomRadius) * t
    points.push(new THREE.Vector2(radius, t * CUP.height))
  }
  return points
}

export function trayProfilePoints(segments = 20): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const radius = TRAY.bottomRadius + (TRAY.topRadius - TRAY.bottomRadius) * Math.pow(t, 0.8)
    points.push(new THREE.Vector2(radius, TRAY.y + t * TRAY.height))
  }
  return points
}

export function drinkRadiusAt(height: number): number {
  const t = THREE.MathUtils.clamp(height / DRINK.height, 0, 1)
  return DRINK.bottomRadius + (DRINK.topRadius - DRINK.bottomRadius) * t
}

export interface ChipPlacement {
  x: number
  y: number
  z: number
  rotX: number
  rotY: number
  rotZ: number
  scale: number
}

export function chipPlacements(count = CHIP_COUNT, seedFn: () => number = Math.random): ChipPlacement[] {
  const placements: ChipPlacement[] = []
  for (let i = 0; i < count; i++) {
    const angle = seedFn() * Math.PI * 2
    const radius = Math.sqrt(seedFn()) * (TRAY.topRadius * 0.72)
    const mound = 0.55 * (1 - radius / (TRAY.topRadius * 0.9))
    placements.push({
      x: Math.cos(angle) * radius,
      y: TRAY.y + TRAY.height * 0.55 + mound + seedFn() * 0.22,
      z: Math.sin(angle) * radius,
      rotX: (seedFn() - 0.5) * 1.2,
      rotY: seedFn() * Math.PI * 2,
      rotZ: (seedFn() - 0.5) * 1.2,
      scale: 0.85 + seedFn() * 0.35,
    })
  }
  return placements
}

export function createChipGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  const size = 0.16
  shape.moveTo(0, size)
  shape.quadraticCurveTo(size * 0.2, size * 0.2, size, -size * 0.6)
  shape.quadraticCurveTo(0, -size * 0.35, -size, -size * 0.6)
  shape.quadraticCurveTo(-size * 0.2, size * 0.2, 0, size)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  })
  geometry.center()
  return geometry
}

export function createSauceGeometry(detail = 2): THREE.IcosahedronGeometry {
  const geometry = new THREE.IcosahedronGeometry(0.62, detail)
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const noise = 1 + 0.12 * Math.sin(x * 7.3) * Math.cos(z * 6.1) * Math.sin(y * 5.7)
    position.setXYZ(i, x * noise, y * 0.42 * noise, z * noise)
  }
  geometry.computeVertexNormals()
  return geometry
}

export const SAUCE_VARIANTS = {
  bolo: { color: '#B4432B', bits: '#6B2415' },
  mush: { color: '#B07A4B', bits: '#7A5230' },
  cheese: { color: '#F2B705', bits: '#E0A32E' },
} as const

export const DRINK_VARIANTS = {
  'tea-cloudy': { layers: ['#C98A4B', '#E8B77D', '#FBF4E3'] },
  'tea-fizzy': { layers: ['#E8641E', '#F7D774'] },
} as const
