import { useEffect } from 'react'

const ONE_MINUTE = 60 * 1000

export function useSessionTimeout(enabled, onTimeout) {
  useEffect(() => {
    if (!enabled) return undefined

    let timerId
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

    const resetTimer = () => {
      window.clearTimeout(timerId)
      timerId = window.setTimeout(onTimeout, ONE_MINUTE)
    }

    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      window.clearTimeout(timerId)
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer))
    }
  }, [enabled, onTimeout])
}
