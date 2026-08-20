import test from 'node:test'
import assert from 'node:assert/strict'
import {
  eventAcceptsGuestRegistration,
  getRegistrationUnavailableReason,
  getSeatsLeft,
  hasCanonicalOrganizerCause,
} from './registrationState.js'

function registrableEvent(overrides = {}) {
  return {
    id: 'event-1',
    competition_id: 'competition-1',
    registration_open: true,
    capacity: 20,
    registration_count: 12,
    cause: {
      id: 'cause-1',
      name: 'Cause choisie par l’organisateur',
      canonical: true,
    },
    ...overrides,
  }
}

test('computes remaining capacity from the event record', () => {
  assert.equal(getSeatsLeft(registrableEvent()), 8)
})

test('never reports negative seats remaining', () => {
  assert.equal(
    getSeatsLeft(registrableEvent({ capacity: 10, registration_count: 14 })),
    0,
  )
})

test('uses API-provided spots_left when capacity is not exposed', () => {
  assert.equal(
    getSeatsLeft(registrableEvent({ capacity: null, spots_left: 3 })),
    3,
  )
})

test('allows guest registration only when competition, canonical organizer cause, registration state and capacity are valid', () => {
  const event = registrableEvent()
  assert.equal(hasCanonicalOrganizerCause(event), true)
  assert.equal(eventAcceptsGuestRegistration(event), true)
})

test('rejects an event with no organizer-selected cause', () => {
  const event = registrableEvent({ cause: null })

  assert.equal(eventAcceptsGuestRegistration(event), false)
  assert.equal(
    getRegistrationUnavailableReason(event),
    'La cause choisie par l’organisateur est manquante.',
  )
})

test('rejects a legacy free-text cause that is not linked to the approved cause database', () => {
  const event = registrableEvent({
    cause: {
      id: null,
      name: 'Ancienne cause texte libre',
      canonical: false,
    },
  })

  assert.equal(hasCanonicalOrganizerCause(event), false)
  assert.equal(eventAcceptsGuestRegistration(event), false)
  assert.equal(
    getRegistrationUnavailableReason(event),
    'La cause de cet événement doit être reliée à une cause approuvée dans Jouer Pour de Bon.',
  )
})

test('rejects an event that is not linked to a competition', () => {
  const event = registrableEvent({ competition_id: null })

  assert.equal(eventAcceptsGuestRegistration(event), false)
  assert.equal(
    getRegistrationUnavailableReason(event),
    'Cet événement n’est pas encore relié à une inscription.',
  )
})

test('rejects a closed event', () => {
  const event = registrableEvent({ registration_open: false })

  assert.equal(eventAcceptsGuestRegistration(event), false)
  assert.equal(
    getRegistrationUnavailableReason(event),
    'Les inscriptions sont fermées pour cet événement.',
  )
})

test('rejects a full event', () => {
  const event = registrableEvent({ capacity: 12, registration_count: 12 })

  assert.equal(eventAcceptsGuestRegistration(event), false)
  assert.equal(getRegistrationUnavailableReason(event), 'Cet événement est complet.')
})

test('treats unknown capacity as registrable when the other invariants are satisfied', () => {
  const event = registrableEvent({ capacity: null, spots_left: null })

  assert.equal(eventAcceptsGuestRegistration(event), true)
  assert.equal(getRegistrationUnavailableReason(event), '')
})
