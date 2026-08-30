export function buildStandaloneCardUrl({
  eventId,
  baseUrl = '',
  currentUrl = '',
  registrationIntent = false,
  language = '',
} = {}) {
  if (!eventId) return ''

  const fallbackUrl = currentUrl || 'https://localhost/'
  const sourceUrl = baseUrl || fallbackUrl

  try {
    const url = new URL(sourceUrl, fallbackUrl)
    url.search = ''
    url.hash = ''
    url.searchParams.set('event', String(eventId))
    if (language === 'fr' || language === 'en') url.searchParams.set('lang', language)
    if (registrationIntent) url.searchParams.set('register', '1')
    return url.toString()
  } catch {
    return ''
  }
}
