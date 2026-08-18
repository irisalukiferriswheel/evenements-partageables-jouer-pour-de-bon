import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStandaloneCardUrl } from './cardUrl.js'

test('builds a standalone card URL from the configured public base', () => {
  assert.equal(
    buildStandaloneCardUrl({
      eventId: 'event 42',
      baseUrl: 'https://cards.example.org/jpdb/?scope=organizer#old',
      currentUrl: 'https://embed.example.org/app/?scope=admin',
    }),
    'https://cards.example.org/jpdb/?event=event+42',
  )
})

test('adds registration intent without carrying embed scope parameters', () => {
  assert.equal(
    buildStandaloneCardUrl({
      eventId: 'abc-123',
      currentUrl: 'https://iris.example.github.io/cards/?scope=organizer&foo=bar',
      registrationIntent: true,
    }),
    'https://iris.example.github.io/cards/?event=abc-123&register=1',
  )
})

test('returns an empty string when no event id is available', () => {
  assert.equal(
    buildStandaloneCardUrl({ currentUrl: 'https://example.org/cards/' }),
    '',
  )
})
