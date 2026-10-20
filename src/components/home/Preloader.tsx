import { useEffect, useRef, useState } from 'react'
import { Wordmark } from '@/components/brand/Wordmark'
import { useReducedMotion } from '@/hooks/useReducedMotion'

type PreloaderProps = {
  onComplete: () => void
}

let seenThisSession = false

export function Preloader({ onComplete }: PreloaderProps) {
  const reducedMotion = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [finished, setFinished] = useState(() => seenThisSession || reducedMotion)
  const reported = useRef(false)
  const started = useRef(false)

  const done = finished || seenThisSession

  useEffect(() => {
    if (!done || reported.current) return
    reported.current = true
    onComplete()
  }, [done, onComplete])

  useEffect(() => {
    if (reducedMotion || seenThisSession || started.current) return
    started.current = true

    let value = 0
    const tick = window.setInterval(() => {
      value = Math.min(value + 8 + Math.random() * 14, 92)
      setProgress(value)
    }, 90)

    void Promise.all([
      typeof document !== 'undefined' && 'fonts' in document
        ? document.fonts.ready
        : Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 700)),
    ]).then(() => {
      window.clearInterval(tick)
      setProgress(100)
      window.setTimeout(() => {
        seenThisSession = true
        setFinished(true)
      }, 350)
    })

    return () => window.clearInterval(tick)
  }, [reducedMotion, onComplete])

  if (done) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-8 bg-cream"
      data-testid="preloader"
    >
      <Wordmark className="h-14 w-auto animate-[preloader-bounce_1.2s_ease-in-out_infinite]" />

      <svg viewBox="0 0 64 96" className="h-28 w-20" aria-hidden>
        <defs>
          <clipPath id="preloader-cup">
            <path d="M12 12 L52 12 L46 88 L18 88 Z" />
          </clipPath>
        </defs>
        <path
          d="M12 12 L52 12 L46 88 L18 88 Z"
          fill="none"
          stroke="var(--color-brick)"
          strokeWidth={3}
        />
        <rect
          x={0}
          y={96 - (progress / 100) * 84}
          width={64}
          height={96}
          fill="var(--color-ketchup)"
          clipPath="url(#preloader-cup)"
          opacity={0.85}
        />
      </svg>

      <p className="font-mono text-xs uppercase tracking-widest text-brick">{progress}%</p>

      <style>{`@keyframes preloader-bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }`}</style>
    </div>
  )
}
