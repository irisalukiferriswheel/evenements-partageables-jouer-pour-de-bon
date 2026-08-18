export function getSeatsLeft(event) {
  if (!event) return null

  if (event.capacity !== null && event.capacity !== undefined && event.capacity !== '') {
    return Math.max(Number(event.capacity) - Number(event.registration_count || 0), 0)
  }

  return event.spots_left ?? null
}

export function eventAcceptsGuestRegistration(event) {
  if (!event) return false

  const seatsLeft = getSeatsLeft(event)
  const hasCompetition = Boolean(event.competition_id)
  const hasOrganizerCause = Boolean(event.cause?.name?.trim())
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
  if (event.registration_open === false) return 'Les inscriptions sont fermées pour cet événement.'

  const seatsLeft = getSeatsLeft(event)
  if (seatsLeft !== null && seatsLeft !== undefined && Number(seatsLeft) <= 0) {
    return 'Cet événement est complet.'
  }

  return ''
}
