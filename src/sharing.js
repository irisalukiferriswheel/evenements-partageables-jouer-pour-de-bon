import {withLanguage} from './languageUrl.js';
export function getEventShareUrl(event,language) {
  return withLanguage(event?.registration_url || event?.public_url || '',language)
}

export function buildEventShareData(event,language) {
  const causeName = event?.cause?.name?.trim()
  const title = event?.title || 'Jouer Pour de Bon'

  return {
    title,
    text: `${title} — ${causeName ? `${language==='en'?'supporting':'au profit de'} ${causeName}` : 'Jouer Pour de Bon'}`,
    url: getEventShareUrl(event),
  }
}
