import { useEffect, useState } from 'react'

const QUERY = '(pointer: fine)'

function matches(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

export function useFinePointer(): boolean {
  const [finePointer, setFinePointer] = useState(matches)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(QUERY)
    const onChange = () => setFinePointer(query.matches)
    query.addEventListener('change', onChange)
    onChange()
    return () => query.removeEventListener('change', onChange)
  }, [])

  return finePointer
}
