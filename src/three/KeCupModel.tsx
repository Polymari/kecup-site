import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import type { DrinkKey, FlavorKey } from '@/data/types'
import {
  CUP,
  DRINK,
  MODEL_CENTER_Y,
  SAUCE,
  SAUCE_VARIANTS,
  STRAW,
  TRAY,
  TRAY_RIM_Y,
  chipPlacements,
  createChipGeometry,
  createSauceGeometry,
  cupProfilePoints,
  drinkProfilePoints,
  drinkRadiusAt,
  sauceBits,
  sauceDrips,
  trayProfilePoints,
} from './geometry'
import { INK, applyDrink, applyFlavor, disposeMaterials, makeMaterials } from './materials'
import type { CupStyle } from './materials'
import type { CupAnimationState } from './cupState'
import { EXPLODE_OFFSETS, createCupState } from './cupState'

type KeCupModelProps = {
  /** null = bare chips (no sauce yet). */
  flavor: FlavorKey | null
  /** null = empty cup (no tea yet). */
  drink: DrinkKey | null
  style?: CupStyle
  state?: CupAnimationState
  /** Idle slow spin + bob. */
  autoSpin?: boolean
}

const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)
function easeOutBounce(t: number): number {
  const n = 7.5625
  const d = 2.75
  if (t < 1 / d) return n * t * t
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
  return n * (t -= 2.625 / d) * t + 0.984375
}

/** Vertical centre of the exploded stack (cup moved down, sauce up). */
const EXPLODED_CENTER_Y =
  (EXPLODE_OFFSETS.cup + SAUCE.y + SAUCE.thickness + EXPLODE_OFFSETS.sauce) / 2
/** Sauce pivot sits near the blob's base so squash flattens it onto the chips. */
const SAUCE_PIVOT_Y = SAUCE.y - SAUCE.thickness * 0.5

const CHIP_DARK = new THREE.Color('#C47F25')
const CHIP_BASE = new THREE.Color('#E3A633')
const CHIP_LIGHT = new THREE.Color('#F4C863')

const ICE = [
  { angle: 0.4, r: 0.2, h: 0.22, rot: [0.4, 0.3, 0.1] },
  { angle: 2.5, r: 0.22, h: 0.42, rot: [0.1, 0.9, 0.5] },
  { angle: 4.4, r: 0.18, h: 0.6, rot: [0.7, 0.2, 0.3] },
  { angle: 1.4, r: 0.12, h: 0.72, rot: [0.2, 0.6, 0.8] },
] as const

const BUBBLES = Array.from({ length: 16 }, (_, index) => ({
  angle: index * 2.39996,
  r: 0.08 + ((index * 37) % 23) / 23 * 0.26,
  speed: 0.12 + ((index * 53) % 17) / 17 * 0.14,
  offset: ((index * 71) % 29) / 29,
  size: 0.7 + ((index * 13) % 7) / 7 * 0.6,
}))

export function KeCupModel({ flavor, drink, style = 'toon', state, autoSpin = true }: KeCupModelProps) {
  const animation = useMemo(() => state ?? createCupState(), [state])
  const materials = useMemo(() => makeMaterials(style), [style])
  useEffect(() => () => disposeMaterials(materials), [materials])

  // Keep the last real flavor so the sauce keeps its look while it animates out.
  const [shownFlavor, setShownFlavor] = useState<FlavorKey>(flavor ?? 'bolo')
  if (flavor && flavor !== shownFlavor) setShownFlavor(flavor)

  useLayoutEffect(() => applyFlavor(materials, shownFlavor), [materials, shownFlavor])
  useLayoutEffect(() => {
    if (drink) applyDrink(materials, drink)
  }, [materials, drink])

  const geometries = useMemo(
    () => ({
      cupWall: new THREE.LatheGeometry(cupProfilePoints(), 64),
      cupBase: new THREE.CircleGeometry(CUP.bottomRadius, 48).rotateX(-Math.PI / 2).translate(0, 0.004, 0),
      cupRim: new THREE.TorusGeometry(CUP.topRadius, 0.016, 8, 72).rotateX(Math.PI / 2).translate(0, CUP.height, 0),
      cupFoot: new THREE.TorusGeometry(CUP.bottomRadius, 0.013, 8, 64).rotateX(Math.PI / 2).translate(0, 0.01, 0),
      bowlWall: new THREE.LatheGeometry(trayProfilePoints(), 72),
      bowlBase: new THREE.CircleGeometry(TRAY.bottomRadius, 48).rotateX(-Math.PI / 2).translate(0, TRAY.y, 0),
      bowlRim: new THREE.TorusGeometry(TRAY.topRadius, 0.022, 8, 80).rotateX(Math.PI / 2).translate(0, TRAY_RIM_Y, 0),
      sleeve: new THREE.CylinderGeometry(0.09, 0.09, TRAY.height - 0.06, 20, 1, true).translate(
        0,
        TRAY.y + (TRAY.height - 0.06) / 2,
        0,
      ),
      liquid: new THREE.LatheGeometry(drinkProfilePoints(), 48),
      cap: new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2),
      ice: new RoundedBoxGeometry(0.15, 0.15, 0.15, 2, 0.035),
      bubble: new THREE.SphereGeometry(0.026, 10, 8),
      chip: createChipGeometry(),
      sauce: createSauceGeometry(),
      meat: new THREE.DodecahedronGeometry(0.042, 0),
      slice: new THREE.CylinderGeometry(0.07, 0.065, 0.02, 14),
      flake: new THREE.BoxGeometry(0.05, 0.016, 0.03),
      straw: new THREE.CylinderGeometry(STRAW.radius, STRAW.radius, STRAW.top - STRAW.bottom, 20).translate(
        0,
        (STRAW.top + STRAW.bottom) / 2,
        0,
      ),
      shadow: new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2),
    }),
    [],
  )
  const drips = useMemo(
    () =>
      sauceDrips().map((drip) => ({
        ...drip,
        geometry: new THREE.CapsuleGeometry(0.042, drip.length, 4, 10),
      })),
    [],
  )
  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      drips.forEach((drip) => drip.geometry.dispose())
    },
    [geometries, drips],
  )

  const chips = useMemo(() => chipPlacements(), [])
  const variant = SAUCE_VARIANTS[shownFlavor]
  const bits = useMemo(() => sauceBits(variant.bitCount), [variant.bitCount])
  const bitGeometry =
    variant.bitShape === 'meat'
      ? geometries.meat
      : variant.bitShape === 'slice'
        ? geometries.slice
        : geometries.flake

  const root = useRef<THREE.Group>(null)
  const cupGroup = useRef<THREE.Group>(null)
  const trayGroup = useRef<THREE.Group>(null)
  const chipsGroup = useRef<THREE.Group>(null)
  const chipMesh = useRef<THREE.InstancedMesh>(null)
  const sauceGroup = useRef<THREE.Group>(null)
  const strawGroup = useRef<THREE.Group>(null)
  const liquidMesh = useRef<THREE.Mesh>(null)
  const capMesh = useRef<THREE.Mesh>(null)
  const iceRefs = useRef<Array<THREE.Mesh | null>>([])
  const bubbleRefs = useRef<Array<THREE.Mesh | null>>([])
  const dripRefs = useRef<Array<THREE.Mesh | null>>([])

  const motion = useRef({
    idleSpin: 0,
    fill: drink ? animation.fill : 0,
    sauce: flavor ? 1 : 0,
    splatAt: -Infinity,
    lastChips: -1,
    culled: false,
  })
  const previous = useRef({ flavor, drink })

  // Flavor swap → sauce splat + chip wobble. Drink swap → quick drain and refill.
  useEffect(() => {
    const prev = previous.current
    if (flavor && prev.flavor && flavor !== prev.flavor) {
      motion.current.splatAt = performance.now() / 1000
    }
    if (drink && prev.drink && drink !== prev.drink) {
      motion.current.fill *= 0.35
    }
    previous.current = { flavor, drink }
  }, [flavor, drink])

  // Per-chip toast colour variance (instanced colours are set once).
  useLayoutEffect(() => {
    const mesh = chipMesh.current
    if (!mesh) return
    const color = new THREE.Color()
    chips.forEach((chip, index) => {
      color.copy(CHIP_BASE).lerp(chip.tint < 0 ? CHIP_DARK : CHIP_LIGHT, Math.abs(chip.tint) * 0.7)
      mesh.setColorAt(index, color)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [chips])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((frame, delta) => {
    const group = root.current
    if (!group) return
    const dt = Math.min(delta, 1 / 20)
    const t = frame.clock.elapsedTime
    const now = performance.now() / 1000
    const m = motion.current
    const a = animation
    const explode = easeInOut(clamp01(a.explode))

    if (!m.culled && chipsGroup.current) {
      // Instance matrices animate, so cached bounds would wrongly cull chips/outlines.
      chipsGroup.current.traverse((child) => {
        child.frustumCulled = false
      })
      m.culled = true
    }

    // Whole model: centred on the origin (the camera looks there), idle spin + bob.
    if (autoSpin) m.idleSpin += dt * 0.35
    const bob = autoSpin ? Math.sin(t * 1.3) * 0.03 : 0
    const scale = THREE.MathUtils.lerp(1, EXPLODE_OFFSETS.scale, explode)
    const center = THREE.MathUtils.lerp(MODEL_CENTER_Y, EXPLODED_CENTER_Y, explode)
    group.scale.setScalar(scale)
    group.position.y = -center * scale + a.drop + bob
    group.rotation.y = m.idleSpin + a.spin

    // Cup + tea.
    if (cupGroup.current) cupGroup.current.position.y = EXPLODE_OFFSETS.cup * explode
    const targetFill = drink ? clamp01(a.fill) : 0
    m.fill = THREE.MathUtils.damp(m.fill, targetFill, 3.5, dt)
    const fillHeight = m.fill * DRINK.height
    const hasTea = fillHeight > 0.006
    materials.liquid.uniforms.uFill.value = fillHeight
    if (liquidMesh.current) liquidMesh.current.visible = hasTea
    if (capMesh.current) {
      capMesh.current.visible = hasTea
      capMesh.current.position.y = DRINK.base + fillHeight
      capMesh.current.scale.setScalar(drinkRadiusAt(fillHeight))
    }
    ICE.forEach((cube, index) => {
      const mesh = iceRefs.current[index]
      if (!mesh) return
      const height = cube.h * DRINK.height
      mesh.visible = hasTea && height + 0.08 < fillHeight
      mesh.position.y = DRINK.base + height + Math.sin(t * 1.1 + index) * 0.012
    })
    const fizzy = drink === 'tea-fizzy'
    BUBBLES.forEach((bubble, index) => {
      const mesh = bubbleRefs.current[index]
      if (!mesh) return
      mesh.visible = fizzy && fillHeight > 0.2
      if (!mesh.visible) return
      const progress = (t * bubble.speed + bubble.offset) % 1
      const radius = Math.min(bubble.r, drinkRadiusAt(progress * fillHeight) - 0.05)
      mesh.position.set(
        Math.cos(bubble.angle) * radius,
        DRINK.base + 0.04 + progress * (fillHeight - 0.08),
        Math.sin(bubble.angle) * radius,
      )
      mesh.scale.setScalar(bubble.size * (0.6 + progress * 0.6))
    })

    // Bowl "clicks" on with a little overshoot.
    const trayStage = clamp01(a.tray)
    if (trayGroup.current) {
      trayGroup.current.visible = trayStage > 0.001
      trayGroup.current.position.y =
        EXPLODE_OFFSETS.tray * explode + (1 - easeOutBack(trayStage)) * 2.2
    }

    // Chips rain in, staggered bottom → top, and wobble on a flavor swap.
    const sinceSplat = now - m.splatAt
    const splat = sinceSplat < 1.6 ? Math.exp(-4.5 * sinceSplat) * Math.cos(sinceSplat * 16) : 0
    if (chipsGroup.current) chipsGroup.current.position.y = EXPLODE_OFFSETS.chips * explode
    const chipStage = clamp01(a.chips)
    const mesh = chipMesh.current
    if (mesh && (chipStage !== m.lastChips || splat !== 0)) {
      m.lastChips = chipStage
      chips.forEach((chip, index) => {
        const delay = (index / chips.length) * 0.72
        const progress = clamp01((chipStage - delay) / 0.28)
        const fall = (1 - easeOutBounce(progress)) * 1.8
        const wobble = splat * 0.12 * Math.sin(index * 1.7)
        dummy.position.set(chip.x, chip.y + fall, chip.z)
        dummy.rotation.set(chip.lean + wobble, chip.yaw, chip.twist + wobble, 'YXZ')
        dummy.scale.setScalar(progress > 0 ? chip.scale : 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    // Sauce lands, squashes on flavor swaps, and shrinks away when no flavor is picked.
    m.sauce = THREE.MathUtils.damp(m.sauce, flavor ? 1 : 0, 7, dt)
    const sauceStage = clamp01(a.sauce)
    if (sauceGroup.current) {
      const presence = sauceStage > 0 ? m.sauce : 0
      const squash = THREE.MathUtils.clamp(a.sauceSquash, 0.2, 1.6) * (1 - 0.45 * splat)
      const spread = 1 + (1 - squash) * 0.55
      sauceGroup.current.visible = presence > 0.01
      sauceGroup.current.scale.set(presence * spread, presence * squash, presence * spread)
      sauceGroup.current.position.y =
        SAUCE_PIVOT_Y + EXPLODE_OFFSETS.sauce * explode + (1 - easeOutCubic(sauceStage)) * 1.8
      // Drips ooze down over the chips once landed and retract when the stack explodes.
      const ooze = clamp01(sauceStage * 1.6 - 0.6) * (1 - explode)
      drips.forEach((drip, index) => {
        const mesh = dripRefs.current[index]
        if (!mesh) return
        mesh.visible = ooze > 0.02
        mesh.scale.set(1, Math.max(ooze, 0.001), 1)
        mesh.position.y = SAUCE.y - SAUCE_PIVOT_Y - drip.length * 0.45 * ooze
      })
    }

    // Straw stabs down through the sleeve; slides out to the side when exploded.
    const strawStage = clamp01(a.straw)
    if (strawGroup.current) {
      strawGroup.current.visible = strawStage > 0.001
      strawGroup.current.position.set(
        EXPLODE_OFFSETS.strawX * explode,
        EXPLODE_OFFSETS.strawY * explode + (1 - easeOutCubic(strawStage)) * 2.6,
        0,
      )
      strawGroup.current.rotation.z = -0.18 * explode
    }
  })

  const toon = materials.toon

  return (
    <group ref={root}>
      <group ref={cupGroup}>
        <mesh geometry={geometries.shadow} material={materials.shadow} position={[0, -0.005, 0]} scale={0.95} />
        <mesh ref={liquidMesh} geometry={geometries.liquid} material={materials.liquid} position={[0, DRINK.base, 0]} renderOrder={-2} />
        <mesh ref={capMesh} geometry={geometries.cap} material={materials.cap} renderOrder={-2} />
        {ICE.map((cube, index) => (
          <mesh
            key={`ice-${index}`}
            ref={(node) => {
              iceRefs.current[index] = node
            }}
            geometry={geometries.ice}
            material={materials.ice}
            position={[Math.cos(cube.angle) * cube.r, 0, Math.sin(cube.angle) * cube.r]}
            rotation={[cube.rot[0], cube.rot[1], cube.rot[2]]}
            renderOrder={-1}
          />
        ))}
        {BUBBLES.map((_, index) => (
          <mesh
            key={`bubble-${index}`}
            ref={(node) => {
              bubbleRefs.current[index] = node
            }}
            geometry={geometries.bubble}
            material={materials.bubble}
            renderOrder={-1}
            visible={false}
          />
        ))}
        <mesh geometry={geometries.cupWall} material={materials.glass} />
        <mesh geometry={geometries.cupBase} material={materials.flatGlass} />
        <mesh geometry={geometries.cupRim} material={materials.rim} />
        {toon ? <mesh geometry={geometries.cupFoot} material={materials.rim} /> : null}
      </group>

      <group ref={trayGroup}>
        <mesh geometry={geometries.bowlWall} material={materials.bowl} />
        <mesh geometry={geometries.bowlBase} material={materials.flatGlass} />
        <mesh geometry={geometries.sleeve} material={materials.sleeve} />
        <mesh geometry={geometries.bowlRim} material={materials.rim} />
      </group>

      <group ref={chipsGroup}>
        <instancedMesh ref={chipMesh} args={[geometries.chip, materials.chip, chips.length]}>
          {toon ? <Outlines thickness={0.011} color={INK} /> : null}
        </instancedMesh>
      </group>

      <group ref={sauceGroup}>
        <mesh geometry={geometries.sauce} material={materials.sauce} position={[0, SAUCE.y - SAUCE_PIVOT_Y, 0]}>
          {toon ? <Outlines thickness={0.014} color={INK} /> : null}
        </mesh>
        {drips.map((drip, index) => (
          <mesh
            key={`drip-${index}`}
            ref={(node) => {
              dripRefs.current[index] = node
            }}
            geometry={drip.geometry}
            material={materials.sauce}
            position={[
              Math.cos(drip.angle) * SAUCE.radius * 0.84,
              SAUCE.y - SAUCE_PIVOT_Y,
              Math.sin(drip.angle) * SAUCE.radius * 0.84,
            ]}
          />
        ))}
        {bits.map((bit, index) => (
          <mesh
            key={`bit-${shownFlavor}-${index}`}
            geometry={bitGeometry}
            material={materials.bits}
            position={[bit.x, bit.y - SAUCE_PIVOT_Y, bit.z]}
            rotation={[variant.bitShape === 'meat' ? bit.rotation : 0.15, bit.rotation, 0]}
            scale={bit.scale}
          />
        ))}
      </group>

      <group ref={strawGroup}>
        <mesh geometry={geometries.straw} material={materials.straw}>
          {toon ? <Outlines thickness={0.01} color={INK} /> : null}
        </mesh>
      </group>
    </group>
  )
}
