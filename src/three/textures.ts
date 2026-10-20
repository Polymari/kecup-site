import * as THREE from 'three'
import { noise3, tileNoise } from './noise'

// Procedural textures generated as DataTextures (no canvas / DOM), so they are
// deterministic, cheap (128²) and safe to build in tests.

export const TEXTURE_SIZE = 128

function makeTexture(data: Uint8Array, size: number, srgb: boolean): THREE.DataTexture {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.needsUpdate = true
  return texture
}

const hex = (value: string) => new THREE.Color(value)
const CHIP_BASE = hex('#F8BF3C')
const CHIP_TOAST = hex('#D67B18')
const CHIP_BLISTER = hex('#FFF0AE')
const CHIP_SPECK = hex('#5C2F0E')

/**
 * Yellow-corn tortilla: golden base with mottled toasting, pale blisters and
 * dark bran specks (colour), plus a matching blister height map (bump).
 */
export function createChipTextures(size = TEXTURE_SIZE): { map: THREE.DataTexture; bump: THREE.DataTexture } {
  const color = new Uint8Array(size * size * 4)
  const bump = new Uint8Array(size * size * 4)
  const tmp = new THREE.Color()
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const mottle = tileNoise(u, v, 5, 4, 1)
      const blister = tileNoise(u, v, 14, 3, 2)
      const microBlister = tileNoise(u, v, 28, 2, 5)
      const fine = tileNoise(u, v, 46, 1, 3)
      const speck = noise3(x * 0.85, y * 0.85, 7, 4)

      tmp.copy(CHIP_BASE)
      tmp.lerp(CHIP_TOAST, Math.max(0, Math.min(1, (mottle + 0.06) * 2.1)))
      if (blister > 0.12) {
        const bAmt = Math.min(1, (blister - 0.12) * 5.5)
        tmp.lerp(CHIP_BLISTER, bAmt * 0.82)
        // Fried blister rim toast: ring around large blisters gets golden-brown
        if (blister > 0.24) {
          tmp.lerp(CHIP_SPECK, Math.min(1, (blister - 0.24) * 8) * 0.45)
        }
      }
      if (microBlister > 0.18) {
        tmp.lerp(CHIP_BLISTER, Math.min(1, (microBlister - 0.18) * 4) * 0.4)
      }
      if (speck > 0.9) tmp.lerp(CHIP_SPECK, Math.min(1, (speck - 0.9) * 14))
      tmp.multiplyScalar(0.95 + fine * 0.16)

      // Colours are mixed in linear space; the texture stores sRGB-encoded bytes.
      const srgb = tmp.convertLinearToSRGB()
      const i = (y * size + x) * 4
      color[i] = Math.round(Math.min(1, srgb.r) * 255)
      color[i + 1] = Math.round(Math.min(1, srgb.g) * 255)
      color[i + 2] = Math.round(Math.min(1, srgb.b) * 255)
      color[i + 3] = 255

      const height =
        0.5 + blister * 1.15 + microBlister * 0.45 + fine * 0.35 - (speck > 0.9 ? 0.2 : 0)
      const h = Math.round(Math.max(0, Math.min(1, height)) * 255)
      bump[i] = h
      bump[i + 1] = h
      bump[i + 2] = h
      bump[i + 3] = 255
    }
  }
  return { map: makeTexture(color, size, true), bump: makeTexture(bump, size, false) }
}

/** Fine tileable grain used as a bump map (sauce texture, foam micro-bubbles). */
export function createGrainBump(frequency: number, seed: number, size = TEXTURE_SIZE): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = 0.5 + tileNoise(x / size, y / size, frequency, 3, seed) * 1.6
      const h = Math.round(Math.max(0, Math.min(1, n)) * 255)
      const i = (y * size + x) * 4
      data[i] = h
      data[i + 1] = h
      data[i + 2] = h
      data[i + 3] = 255
    }
  }
  return makeTexture(data, size, false)
}
