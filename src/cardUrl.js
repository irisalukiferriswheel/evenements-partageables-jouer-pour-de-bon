export function buildStandaloneCardUrl({
  eventId,
  baseUrl = '',
  currentUrl = '',
  registrationIntent = false,
} = {}) {
  if (!eventId) return ''

  const fallbackUrl = currentUrl || 'https://localhost/'
  const sourceUrl = baseUrl || fallbackUrl

  try {
    const url = new URL(sourceUrl, fallbackUrl)
    url.search = ''
    url.hash = ''
    url.searchParams.set('event', String(eventId))
    if (registrationIntent) url.searchParams.set('register', '1')
    return url.toString()
  } catch {
    return ''
  }
}
