import * as THREE from 'three'
import { createToonGradientMap } from './gradientMap'
import { DRINK_VARIANTS, SAUCE_VARIANTS } from './geometry'
import type { DrinkKey, FlavorKey } from '@/data/types'

const gradientMap = createToonGradientMap(3)

export function toonMaterial(color: string, options: THREE.MeshToonMaterialParameters = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap,
    ...options,
  })
}

export function cupMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#FBF4E3', {
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
  })
}

export function trayMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#F2E6C9', {
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  })
}

export function chipMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#E0A32E')
}

export function sauceMaterial(flavor: FlavorKey): THREE.MeshToonMaterial {
  return toonMaterial(SAUCE_VARIANTS[flavor].color)
}

export function bitsMaterial(flavor: FlavorKey): THREE.MeshToonMaterial {
  return toonMaterial(SAUCE_VARIANTS[flavor].bits)
}

export function drinkLayerMaterials(drink: DrinkKey): THREE.MeshToonMaterial[] {
  return DRINK_VARIANTS[drink].layers.map((color) =>
    toonMaterial(color, { transparent: true, opacity: 0.92 }),
  )
}

export function foamMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#FBF4E3', { transparent: true, opacity: 0.95 })
}

export function iceMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#BFE3F5', { transparent: true, opacity: 0.55 })
}

export function bubbleMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#FFF7DC', { transparent: true, opacity: 0.6 })
}

export function strawMaterial(): THREE.MeshToonMaterial {
  return toonMaterial('#BFE3F5', { transparent: true, opacity: 0.6, side: THREE.DoubleSide })
}

export type CupStyle = 'toon' | 'realistic'

export interface CupMaterials {
  cup: THREE.Material
  tray: THREE.Material
  chip: THREE.Material
  sauce: THREE.Material
  bits: THREE.Material
  drinkLayers: THREE.Material[]
  foam: THREE.Material
  ice: THREE.Material
  bubble: THREE.Material
  straw: THREE.Material
}

function realisticGlass(color = '#ffffff'): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    transmission: 0.85,
    thickness: 0.35,
    roughness: 0.18,
    ior: 1.4,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  })
}

export function makeMaterials(
  style: CupStyle,
  flavor: FlavorKey,
  drink: DrinkKey,
): CupMaterials {
  if (style === 'toon') {
    return {
      cup: cupMaterial(),
      tray: trayMaterial(),
      chip: chipMaterial(),
      sauce: sauceMaterial(flavor),
      bits: bitsMaterial(flavor),
      drinkLayers: drinkLayerMaterials(drink),
      foam: foamMaterial(),
      ice: iceMaterial(),
      bubble: bubbleMaterial(),
      straw: strawMaterial(),
    }
  }

  return {
    cup: realisticGlass('#f6efe2'),
    tray: realisticGlass('#efe6d4'),
    chip: new THREE.MeshStandardMaterial({ color: '#E0A32E', roughness: 0.85 }),
    sauce: new THREE.MeshPhysicalMaterial({
      color: SAUCE_VARIANTS[flavor].color,
      clearcoat: 0.6,
      roughness: 0.45,
    }),
    bits: new THREE.MeshStandardMaterial({ color: SAUCE_VARIANTS[flavor].bits, roughness: 0.75 }),
    drinkLayers: DRINK_VARIANTS[drink].layers.map(
      (color) =>
        new THREE.MeshPhysicalMaterial({
          color,
          transmission: 0.55,
          thickness: 0.2,
          roughness: 0.3,
          transparent: true,
          opacity: 0.92,
        }),
    ),
    foam: new THREE.MeshStandardMaterial({ color: '#FBF4E3', roughness: 0.9 }),
    ice: new THREE.MeshPhysicalMaterial({
      color: '#BFE3F5',
      transmission: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    }),
    bubble: new THREE.MeshStandardMaterial({ color: '#FFF7DC', transparent: true, opacity: 0.55 }),
    straw: realisticGlass('#cfeaf7'),
  }
}
