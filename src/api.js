import { buildMemberRegistrationUrl } from './memberRegistrationBridge.js'
import { buildStandaloneCardUrl } from './cardUrl.js'

const API_BASE_URL = (import.meta.env.VITE_JPDB_API_BASE_URL || '').replace(/\/$/, '')
const PUBLIC_CARD_BASE_URL = (import.meta.env.VITE_PUBLIC_CARD_BASE_URL || '').trim()
const MEMBER_REGISTRATION_ENABLED = import.meta.env.VITE_MEMBER_REGISTRATION_ENABLED === 'true'

export function getEventIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('event') || params.get('eventId')
}

export function isRegistrationIntentFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('register') === '1' || params.get('action') === 'register'
}

export function buildPublicCardUrl(eventId) {
  return buildStandaloneCardUrl({
    eventId,
    baseUrl: PUBLIC_CARD_BASE_URL,
    currentUrl: window.location.href,
  })
}

export function buildRegistrationUrl(eventId) {
  return buildMemberRegistrationUrl(eventId)
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL)
}

export function isMemberRegistrationEnabled() {
  return MEMBER_REGISTRATION_ENABLED
}

export async function fetchEvent(eventId = getEventIdFromLocation(), language = 'fr') {
  if (!API_BASE_URL || !eventId) return null

  const response = await fetch(`${API_BASE_URL}/v1/calendar/events/${encodeURIComponent(eventId)}`, {
    headers: { Accept: 'application/json', 'Accept-Language': language === 'en' ? 'en' : 'fr' },
  })

  if (!response.ok) {
    throw new Error(`Impossible de charger l’événement (${response.status})`)
  }

  const payload = await response.json()
  return normalizeEvent(payload)
}

export async function fetchEvents(language = 'fr') {
  if (!API_BASE_URL) return []

  const response = await fetch(`${API_BASE_URL}/v1/calendar/events`, {
    headers: { Accept: 'application/json', 'Accept-Language': language === 'en' ? 'en' : 'fr' },
  })

  if (!response.ok) {
    throw new Error(`Impossible de charger les événements (${response.status})`)
  }

  const payload = await response.json()
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  return rows.map(normalizeEvent).filter(Boolean)
}

export function normalizeEvent(payload) {
  const event = payload?.data ?? payload?.event ?? payload
  if (!event) return null

  const causeSource = event.cause ?? event.selected_cause ?? null
  const causeName = event.causeName ?? event.cause_name ?? null
  const cause = causeSource || causeName
    ? {
        id: causeSource?.id ?? event.causeId ?? event.cause_id ?? null,
        name: causeSource?.name ?? causeSource?.title ?? causeName ?? 'Cause sélectionnée',
        description: causeSource?.description ?? '',
        logo_url: causeSource?.logoUrl ?? causeSource?.logo_url ?? causeSource?.imageUrl ?? causeSource?.image_url ?? null,
        website_url: causeSource?.websiteUrl ?? causeSource?.website_url ?? null,
        canonical: causeSource?.canonical ?? Boolean(causeSource?.id),
      }
    : null

  const id = event.id ?? event.public_slug
  const publicUrl =
    event.cardUrl ||
    event.card_url ||
    buildPublicCardUrl(id)
  const registrationUrl =
    buildRegistrationUrl(id)

  return {
    ...event,
    id,
    competition_id: event.competitionId ?? event.competition_id ?? null,
    title: event.title ?? event.name ?? 'Événement Jouer Pour de Bon',
    description: event.description ?? '',
    start_at: event.startAt ?? event.start_at ?? null,
    end_at: event.endAt ?? event.end_at ?? null,
    timezone: event.timezone ?? 'America/Toronto',
    city: event.city ?? '',
    venue_name: event.venue ?? event.venueName ?? event.venue_name ?? '',
    games: Array.isArray(event.games) ? event.games : [],
    entry_fee: event.feeAmount ?? event.fee_amount ?? event.entry_fee ?? event.price ?? 0,
    currency: event.feeCurrency ?? event.fee_currency ?? event.currency ?? 'CAD',
    capacity: event.maxParticipants ?? event.max_participants ?? event.capacity ?? null,
    registration_count:
      event.reservedCount ??
      event.reserved_count ??
      event.registration_count ??
      event.registrations_count ??
      event.participantsCount ??
      0,
    participants_count: event.participantsCount ?? event.participants_count ?? 0,
    spots_left: event.spotsLeft ?? event.spots_left ?? null,
    registration_open: event.registrationOpen ?? event.registration_open ?? false,
    public_url: publicUrl,
    registration_url: registrationUrl,
    event_page_url: event.publicUrl ?? event.public_url ?? null,
    cause,
  }
}
