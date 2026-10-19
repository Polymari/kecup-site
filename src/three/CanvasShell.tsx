import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Arch } from '@/components/brand/Arch'
import { asset } from '@/lib/asset'
import { useReducedMotion } from '@/hooks/useReducedMotion'

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

function CupPoster() {
  return (
    <Arch className="mx-auto aspect-[4/5] w-full max-w-sm">
      <div className="flex h-full w-full items-center justify-center">
        <img
          src={asset('brand/logo.jpeg')}
          alt="KeCup cup"
          className="w-3/4 rounded-2xl"
        />
      </div>
    </Arch>
  )
}

type CanvasShellProps = {
  children: ReactNode
  className?: string
  cameraPosition?: [number, number, number]
}

export function CanvasShell({ children, className = '', cameraPosition = [0, 1.6, 4.2] }: CanvasShellProps) {
  const reducedMotion = useReducedMotion()
  const supported = useMemo(() => hasWebGL2(), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [dpr, setDpr] = useState(1.5)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver !== 'function') return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

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
        camera={{ position: cameraPosition, fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={visible ? 'always' : 'demand'}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} />
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(1.5)}
        />
        {children}
      </Canvas>
    </div>
  )
}
