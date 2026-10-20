import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import type { DrinkKey, FlavorKey } from '@/data/types'
import {
  CUP,
  DRINK,
  TRAY,
  chipPlacements,
  createChipGeometry,
  createSauceGeometry,
  cupProfilePoints,
  drinkRadiusAt,
  trayProfilePoints,
} from './geometry'
import { makeMaterials } from './materials'
import type { CupStyle } from './materials'
import type { CupAnimationState } from './cupState'
import { EXPLODE_OFFSETS, createCupState } from './cupState'

type KeCupModelProps = {
  flavor: FlavorKey
  drink: DrinkKey
  style?: CupStyle
  state?: CupAnimationState
  interactive?: boolean
}

export function KeCupModel({ flavor, drink, style = 'toon', state, interactive = true }: KeCupModelProps) {
  const group = useRef<THREE.Group>(null)
  const liquidGroup = useRef<THREE.Group>(null)
  const trayGroup = useRef<THREE.Group>(null)
  const chipsGroup = useRef<THREE.Group>(null)
  const sauceGroup = useRef<THREE.Group>(null)
  const strawGroup = useRef<THREE.Group>(null)
  const sauceRef = useRef<THREE.Mesh>(null)

  const animation = useMemo(() => state ?? createCupState(), [state])
  const mats = useMemo(() => makeMaterials(style, flavor, drink), [style, flavor, drink])

  const cupGeometry = useMemo(
    () => new THREE.LatheGeometry(cupProfilePoints(), 48),
    [],
  )
  const trayGeometry = useMemo(
    () => new THREE.LatheGeometry(trayProfilePoints(), 48),
    [],
  )
  const chipGeometry = useMemo(() => createChipGeometry(), [])
  const sauceGeometry = useMemo(() => createSauceGeometry(), [])
  const chips = useMemo(() => chipPlacements(), [])

  useFrame((_, delta) => {
    if (!group.current) return
    animation.bob = Math.sin(performance.now() / 1400) * 0.02
    animation.spin += delta * 0.12
    group.current.position.y = animation.drop + animation.bob
    if (interactive) group.current.rotation.y = animation.spin
    if (sauceRef.current) {
      sauceRef.current.scale.y = animation.sauceSquash
    }
    if (liquidGroup.current) {
      liquidGroup.current.scale.y = THREE.MathUtils.clamp(animation.fill, 0.05, 1)
    }
    const explode = THREE.MathUtils.clamp(animation.explode, 0, 1)
    if (trayGroup.current) trayGroup.current.position.y = explode * EXPLODE_OFFSETS.tray
    if (chipsGroup.current) chipsGroup.current.position.y = explode * EXPLODE_OFFSETS.chips
    if (sauceGroup.current) sauceGroup.current.position.y = explode * EXPLODE_OFFSETS.sauce
    if (strawGroup.current) strawGroup.current.position.y = explode * EXPLODE_OFFSETS.straw
  })

  return (
    <group ref={group}>
      <mesh geometry={cupGeometry} material={mats.cup}>
        <Outlines thickness={0.02} color="#7A1F1A" />
      </mesh>

      <group ref={liquidGroup} position={[0, 0, 0]}>
        {mats.drinkLayers.map((material, index) => {
          const layerHeight = DRINK.height / mats.drinkLayers.length
          return (
            <mesh
              key={index}
              material={material}
              position={[0, layerHeight * index + layerHeight / 2, 0]}
            >
              <cylinderGeometry
                args={[
                  drinkRadiusAt(layerHeight * (index + 1)),
                  drinkRadiusAt(layerHeight * index),
                  layerHeight,
                  32,
                  1,
                  true,
                ]}
              />
            </mesh>
          )
        })}
        {drink === 'tea-cloudy' ? (
          <mesh material={mats.foam} position={[0, DRINK.height + 0.03, 0]}>
            <cylinderGeometry args={[DRINK.topRadius * 0.98, DRINK.topRadius, 0.08, 32]} />
          </mesh>
        ) : null}
        {drink === 'tea-fizzy'
          ? Array.from({ length: 10 }).map((_, index) => (
              <mesh
                key={`bubble-${index}`}
                material={mats.bubble}
                position={[
                  Math.cos(index * 2.1) * 0.22,
                  0.15 + (index % 5) * (DRINK.height / 6),
                  Math.sin(index * 2.1) * 0.22,
                ]}
              >
                <sphereGeometry args={[0.035, 8, 8]} />
              </mesh>
            ))
          : null}
      </group>

      {[0, 1, 2].map((index) => (
        <mesh
          key={`ice-${index}`}
          material={mats.ice}
          position={[Math.cos(index * 2.4) * 0.24, DRINK.height * 0.75, Math.sin(index * 2.4) * 0.24]}
          rotation={[index * 0.5, index * 0.9, 0]}
        >
          <boxGeometry args={[0.12, 0.12, 0.12]} />
        </mesh>
      ))}

      <group ref={trayGroup}>
        <mesh geometry={trayGeometry} material={mats.tray}>
          <Outlines thickness={0.02} color="#7A1F1A" />
        </mesh>
        <mesh material={mats.tray} position={[0, TRAY.y + TRAY.sleeveHeight / 2, 0]}>
          <cylinderGeometry args={[TRAY.sleeveRadius, TRAY.sleeveRadius, TRAY.sleeveHeight, 24, 1, true]} />
        </mesh>
      </group>

      <group ref={chipsGroup}>
        {chips.map((placement, index) => (
          <mesh
            key={index}
            geometry={chipGeometry}
            material={mats.chip}
            position={[placement.x, placement.y, placement.z]}
            rotation={[placement.rotX, placement.rotY, placement.rotZ]}
            scale={placement.scale}
          />
        ))}
      </group>

      <group ref={sauceGroup}>
        <mesh
          ref={sauceRef}
          geometry={sauceGeometry}
          material={mats.sauce}
          position={[0, TRAY.y + TRAY.height * 0.85, 0]}
        >
          <Outlines thickness={0.015} color="#7A1F1A" />
        </mesh>
        {Array.from({ length: 8 }).map((_, index) => (
          <mesh
            key={`bit-${index}`}
            material={mats.bits}
            position={[
              Math.cos(index * 1.7) * 0.38,
              TRAY.y + TRAY.height * 0.92 + (index % 3) * 0.06,
              Math.sin(index * 1.7) * 0.38,
            ]}
          >
            <dodecahedronGeometry args={[0.045, 0]} />
          </mesh>
        ))}
      </group>

      <group ref={strawGroup}>
        <mesh material={mats.straw} position={[0, CUP.height * 0.62, 0]} rotation={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.055, 0.055, 1.9, 16, 1, true]} />
        </mesh>
      </group>
    </group>
  )
}
