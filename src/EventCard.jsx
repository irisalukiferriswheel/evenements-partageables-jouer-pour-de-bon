import { QRCodeSVG } from 'qrcode.react'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMoney(amount, currency = 'CAD') {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

export default function EventCard({ event, onRegister }) {
  const seatsLeft = event.capacity
    ? Math.max(Number(event.capacity) - Number(event.registration_count || 0), 0)
    : null

  async function shareEvent() {
    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.cause?.name ? `au profit de ${event.cause.name}` : 'Jouer Pour de Bon'}`,
      url: event.public_url,
    }

    if (navigator.share) {
      await navigator.share(shareData)
      return
    }

    await navigator.clipboard.writeText(event.public_url)
    window.alert('Lien copié.')
  }

  return (
    <article className="event-card">
      <div className="event-card__hero" aria-hidden="true">
        <div className="event-card__brand">JOUER POUR DE BON · PLAYING FOR GOOD</div>
        <div className="event-card__sport-mark">JPDB</div>
      </div>

      <div className="event-card__body">
        <div className="event-card__eyebrow">ÉVÉNEMENT / EVENT</div>
        <h2>{event.title}</h2>

        <div className="event-card__facts">
          <span>📅 {formatDate(event.start_at)}</span>
          <span>📍 {[event.venue_name, event.city].filter(Boolean).join(' · ')}</span>
          <span>🎟️ {formatMoney(event.entry_fee, event.currency)}</span>
        </div>

        <section className="cause-block" aria-label="Cause sélectionnée par l'organisateur">
          <div className="cause-block__label">❤️ ON JOUE POUR / PLAYING FOR</div>
          <div className="cause-block__content">
            {event.cause?.logo_url ? (
              <img src={event.cause.logo_url} alt="" className="cause-block__logo" />
            ) : (
              <div className="cause-block__placeholder">♥</div>
            )}
            <div>
              <strong>{event.cause?.name || 'Cause à confirmer'}</strong>
              {event.cause?.description ? <p>{event.cause.description}</p> : null}
            </div>
          </div>
        </section>

        {event.capacity ? (
          <div className="capacity-line">
            <span>{event.registration_count || 0} inscrit(s)</span>
            <span>{seatsLeft} place(s) restante(s)</span>
          </div>
        ) : null}

        <div className="qr-panel">
          <QRCodeSVG
            value={event.public_url}
            size={176}
            level="M"
            marginSize={2}
            title={`QR code pour ${event.title}`}
          />
          <div>
            <strong>Scanne pour t’inscrire</strong>
            <span>Scan to register</span>
          </div>
        </div>

        <div className="event-card__actions">
          <button className="button button--primary" onClick={onRegister}>
            S’inscrire / Register
          </button>
          <button className="button button--secondary" onClick={shareEvent}>
            Partager / Share
          </button>
        </div>
      </div>
    </article>
  )
}
