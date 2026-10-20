import * as THREE from 'three'

export type CameraFit = {
  /** World-space box (centred on the origin) that must stay in frame. */
  width: number
  height: number
  /** Camera pitch above the horizon, radians. */
  elevation?: number
  fov?: number
}

export const DEFAULT_FIT: Required<CameraFit> = { width: 2.7, height: 3.55, elevation: 0.3, fov: 30 }

/** Distance at which a width×height box fills a perspective frustum of the given aspect. */
export function fitDistance(fit: CameraFit, aspect: number): number {
  const fov = fit.fov ?? DEFAULT_FIT.fov
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2))
  const safeAspect = Math.max(aspect, 0.1)
  return Math.max(fit.height / 2 / tan, fit.width / 2 / (tan * safeAspect))
}
