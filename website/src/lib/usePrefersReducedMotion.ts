import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Tracks the OS "reduce motion" setting. The global CSS rule only covers CSS
 * animations and transitions; anything that moves on a JS timer (autoplaying
 * video, a rotating carousel) has to check this itself. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])
  return prefersReducedMotion
}
