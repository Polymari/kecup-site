import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { DEFAULT_FIT, fitDistance } from './cameraFit'
import type { CameraFit } from './cameraFit'

/** Keeps the whole (origin-centred) cup framed whenever the canvas resizes. */
export function CameraRig({ fit }: { fit?: CameraFit }) {
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const fitWidth = fit?.width ?? DEFAULT_FIT.width
  const fitHeight = fit?.height ?? DEFAULT_FIT.height
  const elevation = fit?.elevation ?? DEFAULT_FIT.elevation
  const fov = fit?.fov ?? DEFAULT_FIT.fov

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    const distance = fitDistance({ width: fitWidth, height: fitHeight, fov }, width / Math.max(height, 1))
    camera.fov = fov
    camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance)
    camera.near = 0.1
    camera.far = distance * 4
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, width, height, fitWidth, fitHeight, elevation, fov])

  return null
}
