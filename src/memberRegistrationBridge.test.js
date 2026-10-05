import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMemberRegistrationUrl, isVerifiedCheckout, requestMemberRegistration } from './memberRegistrationBridge.js'

const origin = 'https://www.jouerpourdebon.ca'
function fixture() {
  let listener
  const sent = []
  const host = { crypto: { randomUUID: () => 'request-1' }, parent: { postMessage: (message, target) => sent.push({ message, target }) }, addEventListener: (_, fn) => { listener = fn }, removeEventListener: () => { listener = null } }
  return { host, sent, receive: (data, options = {}) => listener?.({ data, origin, source: host.parent, ...options }), listening: () => !!listener }
}
const response = { source: 'jpdb-wix', type: 'JPDB_EVENT_REGISTRATION_RESULT', requestId: 'request-1', success: true, data: { status: 'pending_payment', registrationId: 'reg-1' } }
test('QR registration links lead to account-first Wix event page', () => {
  assert.equal(buildMemberRegistrationUrl('event-1'), `${origin}/competitions?jpdbEvent=event-1`)
})
test('only matching replies from trusted parent resolve; pending stays pending', async () => {
  const f = fixture()
  const promise = requestMemberRegistration('event-1', 'register', { hostWindow: f.host })
  assert.deepEqual(f.sent[0], { target: origin, message: { source: 'jpdb-event-registration', type: 'JPDB_EVENT_REGISTRATION_REQUEST', requestId: 'request-1', payload: { eventId: 'event-1', action: 'register' } } })
  f.receive(response, { origin: 'https://evil.test' }); assert.equal(f.listening(), true)
  f.receive(response, { source: {} }); assert.equal(f.listening(), true)
  f.receive({ ...response, requestId: 'another-request' }); assert.equal(f.listening(), true)
  f.receive(response)
  assert.equal((await promise).status, 'pending_payment')
  assert.equal(f.listening(), false)
})
test('checkout without authoritative status never confirms registration', async () => {
  const f = fixture(); const promise = requestMemberRegistration('event-1', 'status', { hostWindow: f.host })
  f.receive({ ...response, data: { registrationId: 'reg-1', checkout: {} } })
  await assert.rejects(promise)
})
test('profile-required response retains recovery code', async () => {
  const f = fixture(); const promise = requestMemberRegistration('event-1', 'register', { hostWindow: f.host })
  f.receive({ ...response, success: false, code: 'PLAYER_PROFILE_REQUIRED' })
  await assert.rejects(promise, error => error.code === 'PLAYER_PROFILE_REQUIRED')
})
test('timeout clears subscription so player can retry', async () => {
  const f = fixture()
  await assert.rejects(requestMemberRegistration('event-1', 'register', { hostWindow: f.host, timeoutMs: 5 }), /temps/)
  assert.equal(f.listening(), false)
})
test('payment URL, currency, reference and expiry must be valid', () => {
  const checkout = { url: 'https://www.zeffy.com/fr-CA/ticketing/test', reference: 'JPDB-123', amount: 10, currency: 'CAD', expiresAt: '2030-01-01T00:00:00Z' }
  assert.equal(isVerifiedCheckout(checkout), true)
  for (const patch of [{ url: 'http://www.zeffy.com/x' }, { url: 'https://www.zeffy.com.evil.test/' }, { url: 'https://a@www.zeffy.com/' }, { reference: '' }, { currency: 'USD' }, { amount: -1 }, { expiresAt: '2000-01-01T00:00:00Z' }]) assert.equal(isVerifiedCheckout({ ...checkout, ...patch }), false)
})

test('closing the panel aborts and removes the listener; no stale reply remains', async () => {
  const f = fixture(); const controller = new AbortController()
  const promise = requestMemberRegistration('event-1', 'register', { hostWindow: f.host, signal: controller.signal })
  controller.abort()
  await assert.rejects(promise, error => error.name === 'AbortError')
  assert.equal(f.listening(), false)
  f.receive(response)
})

test('an already aborted request sends nothing', async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort()
  await assert.rejects(requestMemberRegistration('event-1', 'register', { hostWindow: f.host, signal: controller.signal }), error => error.name === 'AbortError')
  assert.equal(f.sent.length, 0)
})

test('transport failure cleans up so retry is safe', async () => {
  const f = fixture(); f.host.parent.postMessage = () => { throw new Error('blocked') }
  await assert.rejects(requestMemberRegistration('event-1', 'register', { hostWindow: f.host }), /indisponible/)
  assert.equal(f.listening(), false)
})

test('reply from a cancelled attempt cannot settle a fresh status request', async () => {
  const f = fixture(); let sequence = 0; f.host.crypto.randomUUID = () => `attempt-${++sequence}`
  const controller = new AbortController()
  const first = requestMemberRegistration('event-1', 'register', { hostWindow: f.host, signal: controller.signal })
  controller.abort(); await assert.rejects(first)
  const second = requestMemberRegistration('event-1', 'status', { hostWindow: f.host })
  f.receive({ ...response, requestId: 'attempt-1', data: { status: 'confirmed' } })
  assert.equal(f.listening(), true)
  f.receive({ ...response, requestId: 'attempt-2' })
  assert.equal((await second).status, 'pending_payment')
})
