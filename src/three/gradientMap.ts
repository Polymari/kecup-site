import * as THREE from 'three'

export function createToonGradientMap(steps = 3): THREE.DataTexture {
  const data = new Uint8Array(steps)
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / (steps - 1)) * 255)
  }
  const texture = new THREE.DataTexture(data, steps, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}
