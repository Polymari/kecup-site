import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import type { DrinkKey, FlavorKey } from '@/data/types'
import {
  CHIP_VARIANT_COUNT,
  CUP,
  DRINK,
  DRINK_VARIANTS,
  MODEL_CENTER_Y,
  SAUCE,
  SAUCE_VARIANTS,
  STRAW,
  TRAY,
  TRAY_RIM_Y,
  chipPlacements,
  createBitGeometry,
  createChipGeometry,
  createIceGeometry,
  createSauceGeometry,
  cupProfilePoints,
  drinkProfilePoints,
  drinkRadiusAt,
  iceBoundingRadius,
  iceCubes,
  sauceBitPlacements,
  sauceDrips,
  trayProfilePoints,
  withWhiteColors,
} from './geometry'
import type { BitShape } from './geometry'
import { INK, applyDrink, applyFlavor, disposeMaterials, makeMaterials } from './materials'
import type { CupMaterials, CupStyle } from './materials'
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

const FLAVORS: FlavorKey[] = ['bolo', 'mush', 'cheese']
const DRINKS: DrinkKey[] = ['tea-cloudy', 'tea-fizzy']
const BIT_SHAPES: BitShape[] = ['mince', 'mushroom', 'speck', 'flake']

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
const EXPLODED_CENTER_Y = (EXPLODE_OFFSETS.cup + SAUCE.y + SAUCE.thickness + EXPLODE_OFFSETS.sauce) / 2
/** Sauce pivot sits near the blob's base so squash flattens it onto the chips. */
const SAUCE_PIVOT_Y = SAUCE.y - SAUCE.thickness * 0.5

const CHIP_DARK = new THREE.Color('#CFA27A')
const CHIP_LIGHT = new THREE.Color('#FFF8EC')
const CHIP_MID = new THREE.Color('#F6E6CF')

const MAX_ICE = Math.max(...DRINKS.map((drink) => DRINK_VARIANTS[drink].ice))

const BUBBLES = Array.from({ length: 30 }, (_, index) => ({
  angle: index * 2.39996,
  r: 0.06 + (((index * 37) % 23) / 23) * 0.32,
  speed: 0.1 + (((index * 53) % 17) / 17) * 0.16,
  offset: ((index * 71) % 29) / 29,
  size: 0.6 + (((index * 13) % 7) / 7) * 0.7,
}))

/** Instanced bits (mince, mushroom slices, pepper, chilli) for one sauce layer. */
function SauceBits({
  flavor,
  layerIndex,
  geometry,
  material,
  toon,
}: {
  flavor: FlavorKey
  layerIndex: number
  geometry: THREE.BufferGeometry
  material: THREE.Material
  toon: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const placements = useMemo(() => sauceBitPlacements(flavor, layerIndex), [flavor, layerIndex])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    placements.forEach((bit, index) => {
      dummy.position.set(bit.x, bit.y - SAUCE_PIVOT_Y, bit.z)
      dummy.rotation.set(bit.rx, bit.ry, bit.rz)
      dummy.scale.setScalar(bit.size)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      mesh.setColorAt(index, color.set(bit.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [placements])

  return (
    <instancedMesh ref={ref} args={[geometry, material, placements.length]} frustumCulled={false}>
      {toon && layerIndex === 0 ? <Outlines thickness={0.006} color={INK} /> : null}
    </instancedMesh>
  )
}

function useGeometries() {
  const geometries = useMemo(
    () => ({
      cupWall: new THREE.LatheGeometry(cupProfilePoints(), 72),
      cupBase: new THREE.CircleGeometry(CUP.bottomRadius, 56).rotateX(-Math.PI / 2).translate(0, 0.004, 0),
      cupRim: new THREE.TorusGeometry(CUP.topRadius + 0.004, 0.02, 10, 96)
        .rotateX(Math.PI / 2)
        .translate(0, CUP.height, 0),
      cupFoot: new THREE.TorusGeometry(CUP.bottomRadius, 0.013, 8, 64).rotateX(Math.PI / 2).translate(0, 0.01, 0),
      bowlWall: new THREE.LatheGeometry(trayProfilePoints(), 96),
      bowlBase: new THREE.CircleGeometry(TRAY.bottomRadius, 56).rotateX(-Math.PI / 2).translate(0, TRAY.y, 0),
      bowlRim: new THREE.TorusGeometry(TRAY.topRadius + 0.004, 0.024, 10, 120)
        .rotateX(Math.PI / 2)
        .translate(0, TRAY_RIM_Y, 0),
      sleeve: new THREE.CylinderGeometry(0.085, 0.085, TRAY.height - 0.06, 24, 1, true).translate(
        0,
        TRAY.y + (TRAY.height - 0.06) / 2,
        0,
      ),
      liquid: new THREE.LatheGeometry(drinkProfilePoints(), 64),
      cap: new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2),
      ice: createIceGeometry(),
      bubble: new THREE.SphereGeometry(0.018, 10, 8),
      chips: Array.from({ length: CHIP_VARIANT_COUNT }, (_, variant) => createChipGeometry(variant)),
      sauces: Object.fromEntries(FLAVORS.map((flavor) => [flavor, createSauceGeometry(flavor)])) as Record<
        FlavorKey,
        THREE.BufferGeometry
      >,
      bits: Object.fromEntries(BIT_SHAPES.map((shape) => [shape, createBitGeometry(shape)])) as Record<
        BitShape,
        THREE.BufferGeometry
      >,
      // Open tube, so the top reads as a hollow straw rather than a rod.
      straw: new THREE.CylinderGeometry(STRAW.radius, STRAW.radius, STRAW.top - STRAW.bottom, 24, 1, true).translate(
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
      Object.fromEntries(
        FLAVORS.map((flavor) => [
          flavor,
          sauceDrips(flavor).map((drip) => ({
            ...drip,
            // Anchored at the top so scaling y "oozes" the drip downwards.
            // White vertex colours: the sauce material is vertex-coloured (missing colours render black).
            geometry: withWhiteColors(
              new THREE.CapsuleGeometry(drip.radius, drip.length, 4, 12).translate(0, -drip.length / 2, 0),
            ),
          })),
        ]),
      ) as Record<FlavorKey, Array<ReturnType<typeof sauceDrips>[number] & { geometry: THREE.BufferGeometry }>>,
    [],
  )
  useEffect(
    () => () => {
      const { chips, sauces, bits, ...single } = geometries
      Object.values(single).forEach((geometry) => geometry.dispose())
      chips.forEach((geometry) => geometry.dispose())
      Object.values(sauces).forEach((geometry) => geometry.dispose())
      Object.values(bits).forEach((geometry) => geometry.dispose())
      Object.values(drips).forEach((list) => list.forEach((drip) => drip.geometry.dispose()))
    },
    [geometries, drips],
  )
  return { geometries, drips }
}

function useCupMaterials(style: CupStyle): CupMaterials {
  const materials = useMemo(() => makeMaterials(style), [style])
  useEffect(() => () => disposeMaterials(materials), [materials])
  return materials
}

export function KeCupModel({ flavor, drink, style = 'realistic', state, autoSpin = true }: KeCupModelProps) {
  const animation = useMemo(() => state ?? createCupState(), [state])
  const materials = useCupMaterials(style)
  const { geometries, drips } = useGeometries()

  // Keep the last real flavor/drink so they keep their look while animating out.
  const [shownFlavor, setShownFlavor] = useState<FlavorKey>(flavor ?? 'bolo')
  if (flavor && flavor !== shownFlavor) setShownFlavor(flavor)
  const [shownDrink, setShownDrink] = useState<DrinkKey>(drink ?? 'tea-cloudy')
  if (drink && drink !== shownDrink) setShownDrink(drink)

  useLayoutEffect(() => applyFlavor(materials, shownFlavor), [materials, shownFlavor])
  useLayoutEffect(() => applyDrink(materials, shownDrink), [materials, shownDrink])

  const chips = useMemo(() => chipPlacements(), [])
  const chipGroups = useMemo(
    () =>
      Array.from({ length: CHIP_VARIANT_COUNT }, (_, variant) =>
        chips.map((chip, index) => ({ chip, index })).filter((entry) => entry.chip.variant === variant),
      ),
    [chips],
  )
  const ice = useMemo(
    () => Object.fromEntries(DRINKS.map((key) => [key, iceCubes(key)])) as Record<DrinkKey, ReturnType<typeof iceCubes>>,
    [],
  )
  const sauceVariant = SAUCE_VARIANTS[shownFlavor]
  const flavorDrips = drips[shownFlavor]

  const root = useRef<THREE.Group>(null)
  const cupGroup = useRef<THREE.Group>(null)
  const trayGroup = useRef<THREE.Group>(null)
  const chipsGroup = useRef<THREE.Group>(null)
  const chipMeshes = useRef<Array<THREE.InstancedMesh | null>>([])
  const sauceGroup = useRef<THREE.Group>(null)
  const strawGroup = useRef<THREE.Group>(null)
  const liquidMeshes = useRef<Array<THREE.Mesh | null>>([])
  const capMesh = useRef<THREE.Mesh>(null)
  const iceRefs = useRef<Array<THREE.Mesh | null>>([])
  const bubbleRefs = useRef<Array<THREE.Mesh | null>>([])
  const dripRefs = useRef<Array<THREE.Mesh | null>>([])

  const motion = useRef({
    idleSpin: 0,
    fill: drink ? animation.fill : 0,
    sauce: flavor ? 1 : 0,
    ice: new Array<number>(MAX_ICE).fill(drink ? 1 : 0),
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

  // Per-chip toast colour variance (instance colours multiply the tortilla texture).
  useLayoutEffect(() => {
    const color = new THREE.Color()
    chipGroups.forEach((group, variant) => {
      const mesh = chipMeshes.current[variant]
      if (!mesh) return
      group.forEach(({ chip }, slot) => {
        color.copy(CHIP_MID).lerp(chip.tint < 0 ? CHIP_DARK : CHIP_LIGHT, Math.abs(chip.tint) * 0.8)
        mesh.setColorAt(slot, color)
      })
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })
  }, [chipGroups])

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
    const drinkVariant = DRINK_VARIANTS[shownDrink]
    const targetFill = drink ? clamp01(a.fill) : 0
    m.fill = THREE.MathUtils.damp(m.fill, targetFill, 3.5, dt)
    const fillHeight = m.fill * DRINK.height
    const hasTea = fillHeight > 0.006
    const foam = drinkVariant.foam > 0 ? Math.min(drinkVariant.foam, fillHeight * 0.3) : 0
    materials.liquid.uniforms.uFill.value = fillHeight
    materials.liquid.uniforms.uFoam.value = foam
    liquidMeshes.current.forEach((mesh) => {
      if (mesh) mesh.visible = hasTea
    })
    if (capMesh.current) {
      capMesh.current.visible = hasTea
      // Slightly oversized and lowered so the disc overlaps the wall (no seam).
      capMesh.current.position.y = DRINK.base + fillHeight - 0.003
      capMesh.current.scale.setScalar(drinkRadiusAt(fillHeight) + 0.006)
    }

    // Ice floats in the tea; cubes appear as the tea reaches them and never
    // show through the foam cap.
    const cubes = ice[shownDrink]
    const teaTop = fillHeight - foam
    for (let index = 0; index < MAX_ICE; index++) {
      const mesh = iceRefs.current[index]
      if (!mesh) continue
      const cube = cubes[index]
      if (!cube) {
        mesh.visible = false
        continue
      }
      const bound = iceBoundingRadius(cube.size)
      const covered = drink !== null && teaTop > cube.y - bound * 0.3 && (foam === 0 || cube.y + bound < teaTop)
      m.ice[index] = THREE.MathUtils.damp(m.ice[index], covered ? 1 : 0, 6, dt)
      const presence = m.ice[index]
      mesh.visible = presence > 0.02 && hasTea
      const drift = Math.sin(t * 0.9 + index * 1.7) * 0.01
      mesh.position.set(cube.x, DRINK.base + cube.y + drift, cube.z)
      mesh.rotation.set(cube.rx, cube.ry + Math.sin(t * 0.4 + index) * 0.05, cube.rz)
      mesh.scale.setScalar(cube.size * presence)
    }

    const fizzy = drinkVariant.bubbles && drink !== null
    BUBBLES.forEach((bubble, index) => {
      const mesh = bubbleRefs.current[index]
      if (!mesh) return
      mesh.visible = fizzy && fillHeight > 0.2
      if (!mesh.visible) return
      const progress = (t * bubble.speed + bubble.offset) % 1
      const height = 0.03 + progress * (fillHeight - 0.06)
      const radius = Math.min(bubble.r, drinkRadiusAt(height) - 0.03)
      mesh.position.set(
        Math.cos(bubble.angle + progress * 0.6) * radius,
        DRINK.base + height,
        Math.sin(bubble.angle + progress * 0.6) * radius,
      )
      mesh.scale.setScalar(bubble.size * (0.6 + progress * 0.7))
    })

    // Bowl "clicks" on with a little overshoot.
    const trayStage = clamp01(a.tray)
    if (trayGroup.current) {
      trayGroup.current.visible = trayStage > 0.001
      trayGroup.current.position.y = EXPLODE_OFFSETS.tray * explode + (1 - easeOutBack(trayStage)) * 2.2
    }

    // Chips rain in, staggered bottom → top, and wobble on a flavor swap.
    const sinceSplat = now - m.splatAt
    const splat = sinceSplat < 1.6 ? Math.exp(-4.5 * sinceSplat) * Math.cos(sinceSplat * 16) : 0
    if (chipsGroup.current) chipsGroup.current.position.y = EXPLODE_OFFSETS.chips * explode
    const chipStage = clamp01(a.chips)
    if (chipStage !== m.lastChips || splat !== 0) {
      m.lastChips = chipStage
      chipGroups.forEach((entries, variant) => {
        const mesh = chipMeshes.current[variant]
        if (!mesh) return
        entries.forEach(({ chip, index }, slot) => {
          const delay = (index / chips.length) * 0.72
          const progress = clamp01((chipStage - delay) / 0.28)
          const fall = (1 - easeOutBounce(progress)) * 1.8
          const wobble = splat * 0.1 * Math.sin(index * 1.7)
          dummy.position.set(chip.x, chip.y + fall, chip.z)
          dummy.rotation.set(chip.lean + wobble, chip.yaw, chip.twist + wobble, 'YXZ')
          dummy.scale.setScalar(progress > 0 ? chip.scale : 0)
          dummy.updateMatrix()
          mesh.setMatrixAt(slot, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
      })
    }

    // Sauce lands, squashes on flavor swaps, and shrinks away when no flavor is picked.
    m.sauce = THREE.MathUtils.damp(m.sauce, flavor ? 1 : 0, 7, dt)
    const sauceStage = clamp01(a.sauce)
    if (sauceGroup.current) {
      const presence = sauceStage > 0 ? m.sauce : 0
      const squash = THREE.MathUtils.clamp(a.sauceSquash, 0.2, 1.6) * (1 - 0.4 * splat)
      const spread = 1 + (1 - squash) * 0.45
      sauceGroup.current.visible = presence > 0.01
      sauceGroup.current.scale.set(presence * spread, presence * squash, presence * spread)
      sauceGroup.current.position.y =
        SAUCE_PIVOT_Y + EXPLODE_OFFSETS.sauce * explode + (1 - easeOutCubic(sauceStage)) * 1.8
      // Drips run down over the chips once landed and retract when the stack explodes.
      const ooze = clamp01(sauceStage * 1.6 - 0.6) * (1 - explode)
      flavorDrips.forEach((_, index) => {
        const mesh = dripRefs.current[index]
        if (!mesh) return
        mesh.visible = ooze > 0.02
        mesh.scale.set(1, Math.max(ooze, 0.001), 1)
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

  // Draw order: opaque tea back wall, food and straw → translucent tea front →
  // ice and bubbles (lighter where they displace tea) → cup → bowl → rims.
  return (
    <group ref={root}>
      <group ref={cupGroup}>
        <mesh geometry={geometries.shadow} material={materials.shadow} position={[0, -0.005, 0]} scale={1.05} />
        <mesh
          ref={(node) => {
            liquidMeshes.current[0] = node
          }}
          geometry={geometries.liquid}
          material={materials.liquid}
          position={[0, DRINK.base, 0]}
        />
        <mesh
          ref={(node) => {
            liquidMeshes.current[1] = node
          }}
          geometry={geometries.liquid}
          material={materials.liquidFront}
          position={[0, DRINK.base, 0]}
          renderOrder={1}
        />
        <mesh ref={capMesh} geometry={geometries.cap} material={materials.cap} renderOrder={1} />
        {Array.from({ length: MAX_ICE }, (_, index) => (
          <mesh
            key={`ice-${index}`}
            ref={(node) => {
              iceRefs.current[index] = node
            }}
            geometry={geometries.ice}
            material={materials.ice}
            renderOrder={2}
            visible={false}
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
            renderOrder={2}
            visible={false}
          />
        ))}
        <mesh geometry={geometries.cupWall} material={materials.glass} renderOrder={3} />
        <mesh geometry={geometries.cupBase} material={materials.flatGlass} renderOrder={3} />
        <mesh geometry={geometries.cupRim} material={materials.rim} renderOrder={5} />
        {toon ? <mesh geometry={geometries.cupFoot} material={materials.rim} /> : null}
      </group>

      <group ref={trayGroup}>
        <mesh geometry={geometries.bowlWall} material={materials.bowl} renderOrder={4} />
        <mesh geometry={geometries.bowlBase} material={materials.flatGlass} renderOrder={4} />
        <mesh geometry={geometries.sleeve} material={materials.sleeve} renderOrder={4} />
        <mesh geometry={geometries.bowlRim} material={materials.rim} renderOrder={5} />
      </group>

      <group ref={chipsGroup}>
        {chipGroups.map((entries, variant) => (
          <instancedMesh
            key={`chips-${variant}`}
            ref={(node) => {
              chipMeshes.current[variant] = node
            }}
            args={[geometries.chips[variant], materials.chip, entries.length]}
            frustumCulled={false}
          >
            {toon ? <Outlines thickness={0.01} color={INK} /> : null}
          </instancedMesh>
        ))}
      </group>

      <group ref={sauceGroup}>
        <mesh
          geometry={geometries.sauces[shownFlavor]}
          material={materials.sauce}
          position={[0, SAUCE.y - SAUCE_PIVOT_Y, 0]}
        >
          {toon ? <Outlines thickness={0.012} color={INK} /> : null}
        </mesh>
        {flavorDrips.map((drip, index) => (
          <group
            key={`drip-${shownFlavor}-${index}`}
            position={[drip.x, drip.y - SAUCE_PIVOT_Y, drip.z]}
            rotation={new THREE.Euler(0, -drip.angle, drip.tilt, 'YXZ')}
          >
            <mesh
              ref={(node) => {
                dripRefs.current[index] = node
              }}
              geometry={drip.geometry}
              material={materials.sauce}
            />
          </group>
        ))}
        {sauceVariant.bits.map((layer, index) => (
          <SauceBits
            key={`bits-${shownFlavor}-${index}`}
            flavor={shownFlavor}
            layerIndex={index}
            geometry={geometries.bits[layer.shape]}
            material={materials.bits}
            toon={toon}
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
