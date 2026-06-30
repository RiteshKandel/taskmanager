import { useState, useEffect } from 'react'

// Generic media query hook — SSR-safe (starts false, syncs after mount)
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)   // sync immediately on mount

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Our app's one breakpoint — below 768px counts as "mobile"
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
