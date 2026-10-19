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
