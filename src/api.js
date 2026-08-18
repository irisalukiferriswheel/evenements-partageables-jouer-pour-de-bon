const API_BASE_URL = (import.meta.env.VITE_JPDB_API_BASE_URL || '').replace(/\/$/, '')

function getEventIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('event') || params.get('eventId')
}

export async function fetchEvent(eventId = getEventIdFromLocation()) {
  if (!API_BASE_URL || !eventId) return null

  const response = await fetch(`${API_BASE_URL}/v1/events/${encodeURIComponent(eventId)}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Impossible de charger l’événement (${response.status})`)
  }

  const payload = await response.json()
  return normalizeEvent(payload)
}

export function normalizeEvent(payload) {
  const event = payload?.event ?? payload
  if (!event) return null

  const cause = event.cause ?? event.selected_cause ?? null

  return {
    ...event,
    title: event.title ?? event.name ?? 'Événement Jouer Pour de Bon',
    entry_fee: event.entry_fee ?? event.price ?? 0,
    registration_count: event.registration_count ?? event.registrations_count ?? 0,
    public_url:
      event.public_url ||
      (event.public_slug ? `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(event.id ?? event.public_slug)}` : window.location.href),
    cause: cause
      ? {
          id: cause.id ?? event.cause_id,
          name: cause.name ?? cause.title ?? 'Cause sélectionnée',
          description: cause.description ?? '',
          logo_url: cause.logo_url ?? cause.image_url ?? null,
        }
      : null,
  }
}

export async function createGuestRegistration(eventId, participant) {
  if (!API_BASE_URL) {
    throw new Error('API non configurée')
  }

  const response = await fetch(`${API_BASE_URL}/v1/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      event_id: eventId,
      participant,
      source: 'shareable_event_card',
    }),
  })

  if (!response.ok) {
    throw new Error(`Inscription impossible (${response.status})`)
  }

  return response.json()
}

export async function startCheckout(registrationId) {
  if (!API_BASE_URL) {
    throw new Error('API non configurée')
  }

  const response = await fetch(`${API_BASE_URL}/v1/registrations/${encodeURIComponent(registrationId)}/checkout`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Paiement impossible (${response.status})`)
  }

  return response.json()
}
