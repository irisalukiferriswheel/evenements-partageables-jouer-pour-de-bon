import { translations } from './translations.js'

export function getViewPresentation(scope, language = 'fr') {
  const t = translations[language] || translations.fr

  if (scope === 'organizer') {
    return {
      title: t.organizerTitle,
      badge: t.organizerBadge,
      empty: t.organizerEmpty,
    }
  }

  if (scope === 'admin') {
    return {
      title: t.adminTitle,
      badge: t.adminBadge,
      empty: t.adminEmpty,
    }
  }

  return {
    title: t.publicTitle,
    badge: t.publicBadge,
    empty: t.publicEmpty,
  }
}

export function sortEventsForDisplay(events) {
  return [...events].sort((a, b) => {
    const aTime = Date.parse(a?.start_at || '')
    const bTime = Date.parse(b?.start_at || '')
    const aValid = Number.isFinite(aTime)
    const bValid = Number.isFinite(bTime)

    if (aValid && bValid) return aTime - bTime
    if (aValid) return -1
    if (bValid) return 1
    return String(a?.title || '').localeCompare(String(b?.title || ''))
  })
}

export function summarizeEvents(events) {
  const published = events.filter((event) => event?.status === 'published').length
  const open = events.filter((event) => event?.registration_open === true).length
  const registrations = events.reduce(
    (total, event) => total + Number(event?.registration_count || 0),
    0,
  )

  return {
    total: events.length,
    published,
    open,
    registrations,
  }
}
