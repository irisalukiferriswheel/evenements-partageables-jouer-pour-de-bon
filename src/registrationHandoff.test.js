import test from 'node:test'
import assert from 'node:assert/strict'

import { getGuestRegistrationHandoff } from './registrationHandoff.js'

test('prefers an immediate backend checkout URL', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({
      data: {
        registration: { id: 'registration-1' },
        guestToken: 'guest-token',
        checkout: { checkoutUrl: 'https://www.zeffy.com/en-CA/ticketing/session', provider: 'zeffy' },
      },
    }),
    {
      kind: 'redirect',
      checkoutUrl: 'https://www.zeffy.com/en-CA/ticketing/session',
      provider: 'zeffy',
    },
  )
})

test('accepts HTTPS checkout links on Zeffy subdomains', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({ checkout: { checkoutUrl: 'https://checkout.zeffy.com/session' } }),
    { kind: 'redirect', checkoutUrl: 'https://checkout.zeffy.com/session', provider: 'zeffy' },
  )
})

test('blocks a checkout URL from another provider', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({ checkout: { checkoutUrl: 'https://payments.example.test/session' } }),
    { kind: 'payment_blocked', reason: 'untrusted_checkout_url' },
  )
})

test('blocks a non-Zeffy provider even when the URL resembles Zeffy', () => {
  assert.deepEqual(
    getGuestRegistrationHandoff({
      checkout: {
        checkoutUrl: 'https://www.zeffy.com/en-CA/ticketing/session',
        provider: 'other-provider',
      },
    }),
    { kind: 'payment_blocked', reason: 'unsupported_provider' },
  )
})

test('blocks insecure and lookalike Zeffy checkout URLs', () => {
  for (const checkoutUrl of [
    'http://www.zeffy.com/session',
    'https://zeffy.com.evil.example/session',
    'javascript:alert(1)',
    '/relative-checkout',
  ]) {
    assert.equal(getGuestRegistrationHandoff({ checkout: { checkoutUrl } }).kind, 'payment_blocked')
  }
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
