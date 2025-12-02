import { ReactNode, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Lightweight wrapper that ensures route changes fade smoothly.
 * Keeps API identical to previous implementation without adding new deps.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const transitionKey = useMemo(() => {
    if (typeof location.pathname === 'string') {
      return location.pathname
    }

    if (typeof location.key === 'string' && location.key.length > 0) {
      return location.key
    }

    try {
      return JSON.stringify(location.pathname ?? location) || 'route-transition'
    } catch {
      return 'route-transition'
    }
  }, [location.pathname, location.key, location])

  return (
    <div
      key={transitionKey}
      className="page-transition"
      style={{
        animation: 'page-fade-in 200ms ease',
        height: '100%',
      }}
    >
      {children}
    </div>
  )
}


