import test from 'node:test'
import assert from 'node:assert/strict'

import { makeApiError } from './apiError.js'

test('uses the structured API error message and preserves safe metadata', () => {
  const error = makeApiError(
    {
      error: {
        code: 'event_full',
        message: 'This event is full.',
        fields: { missing: [], invalid: [] },
      },
    },
    409,
    'Fallback',
  )

  assert.equal(error.message, 'This event is full.')
  assert.equal(error.status, 409)
  assert.equal(error.code, 'event_full')
  assert.deepEqual(error.fields, { missing: [], invalid: [] })
})

test('still supports legacy string errors while the API transitions', () => {
  const error = makeApiError({ error: 'Legacy registration error' }, 400, 'Fallback')

  assert.equal(error.message, 'Legacy registration error')
  assert.equal(error.status, 400)
  assert.equal(error.code, null)
  assert.equal(error.fields, null)
})

test('falls back cleanly for invalid or empty error payloads', () => {
  assert.equal(makeApiError(null, 503, 'Service unavailable').message, 'Service unavailable')
  assert.equal(makeApiError({ error: {} }, 503, 'Service unavailable').message, 'Service unavailable')
  assert.equal(makeApiError({ error: '' }, 503, 'Service unavailable').message, 'Service unavailable')
})
