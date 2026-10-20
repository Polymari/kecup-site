// Small deterministic value noise used for procedural food textures and
// displacement. Pure math (no DOM, no three.js) so it runs in tests and tsx.

function hash3(x: number, y: number, z: number, seed: number): number {
  // Integer hash → [0, 1). Math.imul keeps it 32-bit and fast.
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smooth 3D value noise in [0, 1). */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const tx = smooth(x - xi)
  const ty = smooth(y - yi)
  const tz = smooth(z - zi)
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed)
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), tx)
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), tx)
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), tx)
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), tx)
  return lerp(lerp(x00, x10, ty), lerp(x01, x11, ty), tz)
}

/** Fractal (fBm) noise, roughly centred on 0 with amplitude ≤ 0.5. */
export function fbm3(x: number, y: number, z: number, octaves = 4, seed = 0): number {
  let sum = 0
  let amplitude = 0.5
  let frequency = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * (noise3(x * frequency, y * frequency, z * frequency, seed + i * 17) - 0.5)
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }
  return sum / norm
}

/** Tileable 2D noise on a torus (so wrapped textures have no seams). */
export function tileNoise(u: number, v: number, frequency: number, octaves = 4, seed = 0): number {
  const a = u * Math.PI * 2
  const b = v * Math.PI * 2
  const r = frequency / (Math.PI * 2)
  return fbm3(Math.cos(a) * r + Math.cos(b) * r * 0.5, Math.sin(a) * r, Math.sin(b) * r, octaves, seed)
}
