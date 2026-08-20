import test from 'node:test'
import assert from 'node:assert/strict'

import { buildEventShareData, getEventShareUrl } from './sharing.js'

test('sharing prefers the registration-intent URL over the generic public card URL', () => {
  const event = {
    title: 'Basketball Knockout',
    public_url: 'https://example.test/cards?event=1',
    registration_url: 'https://example.test/cards?event=1&register=1',
    cause: { name: 'Youth Sports Access' },
  }

  assert.equal(getEventShareUrl(event), 'https://example.test/cards?event=1&register=1')
  assert.deepEqual(buildEventShareData(event), {
    title: 'Basketball Knockout',
    text: 'Basketball Knockout — au profit de Youth Sports Access',
    url: 'https://example.test/cards?event=1&register=1',
  })
})

test('sharing falls back to the public card URL when no registration URL is available', () => {
  const event = {
    title: 'Pétanque amicale',
    public_url: 'https://example.test/cards?event=2',
  }

  assert.equal(getEventShareUrl(event), 'https://example.test/cards?event=2')
  assert.equal(buildEventShareData(event).url, 'https://example.test/cards?event=2')
})
