export type Prng = () => number

function hashSeed(seed: string): number {
  let hash = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }
  return hash >>> 0
}

export function createPrng(seed: string): Prng {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
