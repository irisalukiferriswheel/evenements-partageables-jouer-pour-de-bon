export function getEventShareUrl(event) {
  return event?.registration_url || event?.public_url || ''
}

export function buildEventShareData(event) {
  const causeName = event?.cause?.name?.trim()
  const title = event?.title || 'Jouer Pour de Bon'

  return {
    title,
    text: `${title} — ${causeName ? `au profit de ${causeName}` : 'Jouer Pour de Bon'}`,
    url: getEventShareUrl(event),
  }
}
