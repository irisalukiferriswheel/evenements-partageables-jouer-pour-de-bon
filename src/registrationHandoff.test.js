import test from 'node:test'
import assert from 'node:assert/strict'

import { getGuestRegistrationHandoff } from './registrationHandoff.js'

test('prefers an immediate backend checkout URL', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({
      data: {
        registration: { id: 'registration-1' },
        guestToken: 'guest-token',
        checkout: { checkoutUrl: 'https://checkout.example.test/session' },
      },
    }),
    {
      kind: 'redirect',
      checkoutUrl: 'https://checkout.example.test/session',
    },
  )
})

test('starts guest checkout only when the backend issued a guest capability token', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({
      data: {
        registration: { id: 'registration-1', status: 'pending_payment' },
        guestToken: 'guest-token',
      },
    }),
    {
      kind: 'guest_checkout',
      registrationId: 'registration-1',
      guestToken: 'guest-token',
    },
  )
})

test('does not call the authenticated checkout route with only a registration id', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({
      data: {
        registration: { id: 'registration-1', status: 'pending_payment' },
      },
    }),
    {
      kind: 'registered',
      registrationId: 'registration-1',
    },
  )
})

test('treats a minimal successful response as registered', () => {
  assert.deepEqual(getGuestRegistrationHandoff({ data: {} }), {
    kind: 'registered',
    registrationId: null,
  })
})
