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

export function getRegistrationUnavailableReason(event) {
  if (!event) return 'Événement indisponible.'
  if (!event.competition_id) return 'Cet événement n’est pas encore relié à une inscription.'
  if (!event.cause?.name?.trim()) return 'La cause choisie par l’organisateur est manquante.'
  if (!hasCanonicalOrganizerCause(event)) {
    return 'La cause de cet événement doit être reliée à une cause approuvée dans Jouer Pour de Bon.'
  }
  if (event.registration_open === false) return 'Les inscriptions sont fermées pour cet événement.'

  const seatsLeft = getSeatsLeft(event)
  if (seatsLeft !== null && seatsLeft !== undefined && Number(seatsLeft) <= 0) {
    return 'Cet événement est complet.'
  }

  return ''
}
