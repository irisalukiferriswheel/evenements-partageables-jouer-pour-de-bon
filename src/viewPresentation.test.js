import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getViewPresentation,
  sortEventsForDisplay,
  summarizeEvents,
} from './viewPresentation.js'

test('organizer and admin scopes get distinct presentation copy', () => {
  assert.equal(getViewPresentation('organizer').title, 'Mes événements')
  assert.equal(getViewPresentation('admin').title, 'Tous les événements')
  assert.equal(getViewPresentation(null).title, 'Événements partageables')
})

test('events sort chronologically while undated events fall back after dated events', () => {
  const result = sortEventsForDisplay([
    { id: 'undated', title: 'Zeta' },
    { id: 'later', start_at: '2026-09-10T10:00:00Z' },
    { id: 'earlier', start_at: '2026-08-20T10:00:00Z' },
  ])

  assert.deepEqual(result.map(({ id }) => id), ['earlier', 'later', 'undated'])
})

test('event summary counts total, published, open registration and registrations', () => {
  assert.deepEqual(
    summarizeEvents([
      { status: 'published', registration_open: true, registration_count: 12 },
      { status: 'draft', registration_open: false, registration_count: 0 },
      { status: 'published', registration_open: true, registration_count: 4 },
    ]),
    { total: 3, published: 2, open: 2, registrations: 16 },
  )
})
