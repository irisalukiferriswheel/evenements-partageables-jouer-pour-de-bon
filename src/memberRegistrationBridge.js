const WIX_ORIGIN = 'https://www.jouerpourdebon.ca'

export function buildMemberRegistrationUrl(eventId, profile = false) {
  const url = new URL(profile ? '/mon-profil-de-joueur' : '/competitions', WIX_ORIGIN)
  url.searchParams.set('jpdbEvent', eventId)
  return url.href
}

export function isVerifiedCheckout(checkout, now = Date.now()) {
  try {
    const url = new URL(checkout?.url)
    return url.protocol === 'https:' && ['www.zeffy.com', 'zeffy.com'].includes(url.hostname)
      && !url.username && !url.password && (!url.port || url.port === '443')
      && typeof checkout.reference === 'string' && checkout.reference.trim().length > 0
      && Number.isFinite(checkout.amount) && checkout.amount > 0 && checkout.currency === 'CAD'
      && Number.isFinite(Date.parse(checkout.expiresAt)) && Date.parse(checkout.expiresAt) > now
  } catch { return false }
}

export function requestMemberRegistration(eventId, action = 'register', {
  hostWindow = window,
  origins = [WIX_ORIGIN],
  timeoutMs = 90000,
  signal,
} = {}) {
  return new Promise((resolve, reject) => {
    if (hostWindow.parent === hostWindow) return reject(new Error('Ouvre l’événement sur Jouer Pour de Bon pour continuer.'))
    const allowed = origins.filter(origin => [WIX_ORIGIN, 'https://jouerpourdebon.ca'].includes(origin))
    if (!allowed.length) return reject(new Error('La connexion au site est indisponible.'))
    const requestId = hostWindow.crypto.randomUUID()
    let timer
    const cleanup = () => {
      clearTimeout(timer)
      hostWindow.removeEventListener('message', receive)
      signal?.removeEventListener('abort', abort)
    }
    const abort = () => {
      cleanup()
      const error = new Error('Connexion annulée. Tu peux réessayer quand tu veux.')
      error.name = 'AbortError'
      reject(error)
    }
    const receive = event => {
      if (event.source !== hostWindow.parent || !allowed.includes(event.origin)) return
      const message = event.data
      if (message?.source !== 'jpdb-wix' || message.type !== 'JPDB_EVENT_REGISTRATION_RESULT' || message.requestId !== requestId) return
      cleanup()
      if (message.success !== true) {
        const error = new Error(message.message || 'Impossible de continuer. Réessaie dans un instant.')
        error.code = message.code
        reject(error)
      } else if (!['pending_payment', 'confirmed', 'cancelled', 'refunded'].includes(message.data?.status)) {
        reject(new Error('Ton inscription n’est pas encore confirmée. Réessaie dans un instant.'))
      } else resolve(message.data)
    }
    if (signal?.aborted) { abort(); return }
    signal?.addEventListener('abort', abort, { once: true })
    hostWindow.addEventListener('message', receive)
    timer = setTimeout(() => { cleanup(); reject(new Error('La connexion a pris trop de temps. Termine ta connexion puis réessaie.')) }, timeoutMs)
    try {
      for (const origin of allowed) hostWindow.parent.postMessage({ source: 'jpdb-event-registration', type: 'JPDB_EVENT_REGISTRATION_REQUEST', requestId, payload: { eventId, action } }, origin)
    } catch {
      cleanup()
      reject(new Error('La connexion au site est indisponible. Réessaie dans un instant.'))
    }
  })
}
