import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const isTypingElement = (target: EventTarget | null) => {
  if (!target) return false
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }
  return false
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) {
        return
      }

      if (event.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('global-escape'))
      }

      if (!event.metaKey && !event.ctrlKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'k':
          event.preventDefault()
          window.dispatchEvent(new CustomEvent('global-search'))
          break
        case 'n':
          event.preventDefault()
          navigate('/links/generate')
          break
        case 'l':
          event.preventDefault()
          navigate('/links/manage')
          break
        case 'b':
          event.preventDefault()
          window.dispatchEvent(new CustomEvent('global-toggle-sidebar'))
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}







