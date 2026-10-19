import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function matches(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(matches)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(QUERY)
    const onChange = () => setReducedMotion(query.matches)
    query.addEventListener('change', onChange)
    onChange()
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reducedMotion
}
