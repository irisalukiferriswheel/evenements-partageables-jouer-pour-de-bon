import { QRCodeSVG } from 'qrcode.react'
import {
  eventAcceptsGuestRegistration,
  getRegistrationUnavailableReason,
  getSeatsLeft,
} from './registrationState.js'
import { buildEventShareData, getEventShareUrl } from './sharing.js'
import { translations } from './translations.js'

function formatDate(value, locale, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatMoney(amount, currency, locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

export default function EventCard({
  event,
  language = 'fr',
  onRegister,
  guestRegistrationEnabled = false,
}) {
  const t = translations[language]
  const seatsLeft = getSeatsLeft(event)
  const eventAcceptsRegistrations = eventAcceptsGuestRegistration(event)
  const registrationAvailable = eventAcceptsRegistrations && guestRegistrationEnabled
  const registrationUrl = event.registration_url || event.public_url
  const unavailableReason = getRegistrationUnavailableReason(event, language)

  async function shareEvent() {
    const shareData = buildEventShareData(event)
    const shareUrl = getEventShareUrl(event)

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      window.alert(t.copied)
    } catch (error) {
      if (error?.name !== 'AbortError') window.alert(t.shareUnavailable)
    }
  }

  return (
    <article className="event-card">
      <div className="event-card__hero" aria-hidden="true">
        <div className="event-card__brand">{t.brand}</div>
        <div className="event-card__sport-mark">JPDB</div>
      </div>

      <div className="event-card__body">
        <div className="event-card__eyebrow">{t.eventLabel}</div>
        <h2>{event.title}</h2>

        <div className="event-card__facts">
          <span>📅 {formatDate(event.start_at, t.locale, t.dateUnavailable)}</span>
          <span>📍 {[event.venue_name, event.city].filter(Boolean).join(' · ') || t.locationUnavailable}</span>
          <span>🎟️ {formatMoney(event.entry_fee, event.currency, t.locale)}</span>
        </div>

        <section className="cause-block" aria-label={t.organizerCause}>
          <div className="cause-block__label">❤️ {t.playingFor}</div>
          <div className="cause-block__content">
            {event.cause?.logo_url ? (
              <img src={event.cause.logo_url} alt="" className="cause-block__logo" />
            ) : (
              <div className="cause-block__placeholder">♥</div>
            )}
            <div>
              <strong>{event.cause?.name || t.causeUnavailable}</strong>
              {event.cause?.description ? <p>{event.cause.description}</p> : null}
              {!event.cause?.name ? <p>{t.causeMissing}</p> : null}
            </div>
          </div>
        </section>

        {event.capacity ? (
          <div className="capacity-line">
            <span>{event.registration_count || 0} {t.reservations}</span>
            <span>{seatsLeft} {t.seatsLeft}</span>
          </div>
        ) : null}

        <div className="qr-panel">
          <QRCodeSVG
            value={registrationUrl}
            size={176}
            level="M"
            marginSize={2}
            title={t.qrTitle(event.title)}
          />
          <div>
            <strong>{eventAcceptsRegistrations ? t.scanRegister : t.scanView}</strong>
            {!guestRegistrationEnabled && eventAcceptsRegistrations ? <small>{t.quickSoon}</small> : null}
            {!eventAcceptsRegistrations && unavailableReason ? <small>{unavailableReason}</small> : null}
          </div>
        </div>

        <div className="event-card__actions">
          <button
            className="button button--primary"
            onClick={onRegister}
            disabled={!registrationAvailable}
            title={!eventAcceptsRegistrations ? unavailableReason : !guestRegistrationEnabled ? t.quickSoon : undefined}
          >
            {!eventAcceptsRegistrations
              ? t.registrationUnavailable
              : guestRegistrationEnabled
                ? t.register
                : t.registrationSoon}
          </button>
          <button className="button button--secondary" onClick={shareEvent}>{t.share}</button>
        </div>
      </div>
    </article>
  )
}
