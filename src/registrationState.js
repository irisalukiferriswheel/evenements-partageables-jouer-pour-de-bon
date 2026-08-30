import { translations } from './translations.js'

export function getSeatsLeft(event) {
  if (!event) return null

  if (event.capacity !== null && event.capacity !== undefined && event.capacity !== '') {
    return Math.max(Number(event.capacity) - Number(event.registration_count || 0), 0)
  }

  return event.spots_left ?? null
}

export function hasCanonicalOrganizerCause(event) {
  const cause = event?.cause
  return Boolean(
    cause?.id &&
    cause?.name?.trim() &&
    cause?.canonical !== false
  )
}

export function eventAcceptsGuestRegistration(event) {
  if (!event) return false

  const seatsLeft = getSeatsLeft(event)
  const hasCompetition = Boolean(event.competition_id)
  const hasOrganizerCause = hasCanonicalOrganizerCause(event)
  const hasCapacity = seatsLeft === null || seatsLeft === undefined || Number(seatsLeft) > 0

  return (
    event.registration_open !== false &&
    hasCompetition &&
    hasOrganizerCause &&
    hasCapacity
  )
}

export function getRegistrationUnavailableReason(event, language = 'fr') {
  const t = translations[language] || translations.fr
  if (!event) return t.unavailableEvent
  if (!event.competition_id) return t.missingRegistrationLink
  if (!event.cause?.name?.trim()) return t.missingOrganizerCause
  if (!hasCanonicalOrganizerCause(event)) {
    return t.unapprovedCause
  }
  if (event.registration_open === false) return t.registrationClosed

  const seatsLeft = getSeatsLeft(event)
  if (seatsLeft !== null && seatsLeft !== undefined && Number(seatsLeft) <= 0) {
    return t.eventFull
  }

  return ''
}
