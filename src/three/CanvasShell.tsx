import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { asset } from '@/lib/asset'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CameraRig } from './CameraRig'
import type { CameraFit } from './cameraFit'

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

/** Static fallback (no WebGL2 / reduced motion): the logo artwork already shows the cup. */
function CupPoster() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <img
        src={asset('brand/logo.jpeg')}
        alt="KeCup cup: nachos with sauce stacked on a layered tea"
        className="max-h-full w-auto max-w-full rounded-3xl object-contain"
      />
    </div>
  )
}

type CanvasShellProps = {
  children: ReactNode
  className?: string
  fit?: CameraFit
  /** Procedural studio reflections — only the realistic materials need them. */
  environment?: boolean
}

export function CanvasShell({ children, className = '', fit, environment = false }: CanvasShellProps) {
  const reducedMotion = useReducedMotion()
  const supported = useMemo(() => hasWebGL2(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [dpr, setDpr] = useState(1.5)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.01,
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [supported, reducedMotion])

  if (!supported || reducedMotion) {
    return (
      <div ref={containerRef} className={className}>
        <CupPoster />
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <Canvas
        flat
        dpr={dpr}
        camera={{ fov: 30, position: [0, 1, 8] }}
        gl={{ antialias: true, alpha: true }}
        frameloop={visible ? 'always' : 'never'}
        aria-hidden
      >
        <CameraRig fit={fit} />
        {/* Toon shading reads best with a strong ambient base and one clear key light. */}
        <ambientLight intensity={environment ? 0.6 : 1.9} />
        <directionalLight position={[3, 5, 4]} intensity={environment ? 1.4 : 1.8} />
        <directionalLight position={[-4, 2, -3]} intensity={0.45} />
        {environment ? (
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[6, 2, 1]} />
            <Lightformer form="rect" intensity={1.6} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[4, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} color="#FFE8B8" />
            <Lightformer form="ring" intensity={0.8} position={[0, -3, -4]} scale={4} color="#F7D774" />
          </Environment>
        ) : null}
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        {children}
      </Canvas>
    </div>
  )
}
