const trustedOrigins = (import.meta.env.VITE_TRUSTED_HOST_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

export function getHostScopeFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const scope = params.get('scope')
  return scope === 'organizer' || scope === 'admin' ? scope : null
}

export function hasTrustedHostOrigins() {
  return trustedOrigins.length > 0
}

export function subscribeToHostEvents(onEvents) {
  function handleMessage(messageEvent) {
    if (messageEvent.source !== window.parent) return
    if (!trustedOrigins.includes(messageEvent.origin)) return

    const message = messageEvent.data
    if (!message || message.type !== 'jpdb:event-cards:set-events') return
    if (!Array.isArray(message.events)) return

    onEvents(message.events)
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}

export function requestHostEvents(scope) {
  if (!window.parent || window.parent === window) return

  const targetOrigin = trustedOrigins.length === 1 ? trustedOrigins[0] : '*'
  window.parent.postMessage(
    {
      type: 'jpdb:event-cards:request-events',
      scope,
    },
    targetOrigin,
  )
}
