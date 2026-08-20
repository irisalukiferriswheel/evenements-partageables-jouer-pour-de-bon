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

  const message = {
    type: 'jpdb:event-cards:request-events',
    scope,
  }

  // Never use a wildcard target origin. When more than one Wix/custom-domain
  // origin is trusted, send the same non-sensitive request once per explicit
  // origin; the browser delivers it only to the origin that actually owns the
  // parent window.
  for (const targetOrigin of trustedOrigins) {
    window.parent.postMessage(message, targetOrigin)
  }
}
