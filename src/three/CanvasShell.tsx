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
        // Realistic materials get filmic tone mapping; toon keeps flat brand colours.
        flat={!environment}
        dpr={dpr}
        camera={{ fov: 30, position: [0, 1, 8] }}
        gl={{ antialias: true, alpha: true }}
        frameloop={visible ? 'always' : 'never'}
        aria-hidden
      >
        <CameraRig fit={fit} />
        {environment ? (
          <>
            {/* Product-shot lighting: warm sky/floor bounce, a soft key, and a rim light
                from behind so chip edges and the sauce gloss catch the light. */}
            <hemisphereLight args={['#FFF6E8', '#B98A5A', 0.9]} />
            <directionalLight position={[2.5, 5, 4]} intensity={2.4} color="#FFF4E2" />
            <directionalLight position={[-3, 3.5, -4]} intensity={1.6} color="#FFE6C2" />
            <directionalLight position={[-4, 1, 3]} intensity={0.5} color="#E8F0FF" />
            <Environment resolution={256} frames={1}>
              {/* Tall strips → crisp vertical highlights on the clear cup, like a studio photo. */}
              <Lightformer form="rect" intensity={10} position={[-3.5, 1.5, 3]} scale={[0.8, 8]} />
              <Lightformer form="rect" intensity={6} position={[3.5, 1.5, 2.5]} scale={[0.5, 8]} color="#FFF1DC" />
              <Lightformer form="rect" intensity={2.2} position={[0, 6, 1]} scale={[6, 3]} />
              <Lightformer form="rect" intensity={1.2} position={[0, 1, -6]} scale={[8, 4]} color="#FFE2B8" />
              <Lightformer form="rect" intensity={0.6} position={[0, -5, 0]} scale={[8, 8]} color="#E9C489" />
            </Environment>
          </>
        ) : (
          <>
            {/* Toon shading reads best with a strong ambient base and one clear key light. */}
            <ambientLight intensity={1.9} />
            <directionalLight position={[3, 5, 4]} intensity={1.8} />
            <directionalLight position={[-4, 2, -3]} intensity={0.45} />
          </>
        )}
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        {children}
      </Canvas>
    </div>
  )
}
