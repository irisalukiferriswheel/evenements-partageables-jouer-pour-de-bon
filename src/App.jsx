import { useEffect, useState } from 'react'
import EventCard from './EventCard.jsx'
import RegistrationPanel from './RegistrationPanel.jsx'
import {
  fetchEvent,
  fetchEvents,
  getEventIdFromLocation,
  isApiConfigured,
  isGuestRegistrationEnabled,
  isRegistrationIntentFromLocation,
  normalizeEvent,
} from './api.js'
import {
  getHostScopeFromLocation,
  hasTrustedHostOrigins,
  requestHostEvents,
  subscribeToHostEvents,
} from './hostBridge.js'
import { eventAcceptsGuestRegistration } from './registrationState.js'
import { mockEvent } from './mockEvent.js'

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [registrationEvent, setRegistrationEvent] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [waitingForHost, setWaitingForHost] = useState(false)
  const guestRegistrationEnabled = isGuestRegistrationEnabled()

  useEffect(() => {
    let cancelled = false
    const hostScope = getHostScopeFromLocation()

    if (hostScope) {
      if (!hasTrustedHostOrigins()) {
        setLoadError('Vue intégrée non configurée : VITE_TRUSTED_HOST_ORIGINS est requis.')
        setLoading(false)
        return undefined
      }

      setWaitingForHost(true)
      setLoading(false)

      const unsubscribe = subscribeToHostEvents((hostEvents) => {
        if (cancelled) return
        setEvents(hostEvents.map(normalizeEvent).filter(Boolean))
        setLoadError('')
        setWaitingForHost(false)
      })

      requestHostEvents(hostScope)

      return () => {
        cancelled = true
        unsubscribe()
      }
    }

    async function load() {
      try {
        if (!isApiConfigured()) {
          if (!cancelled) {
            setDemoMode(true)
            setEvents([mockEvent])
          }
          return
        }

        const eventId = getEventIdFromLocation()
        const liveEvents = eventId ? [await fetchEvent(eventId)] : await fetchEvents()
        const availableEvents = liveEvents.filter(Boolean)

        if (!cancelled) {
          setEvents(availableEvents)

          if (
            guestRegistrationEnabled &&
            isRegistrationIntentFromLocation() &&
            eventId &&
            availableEvents.length === 1 &&
            eventAcceptsGuestRegistration(availableEvents[0])
          ) {
            setRegistrationEvent(availableEvents[0])
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || 'Impossible de charger les événements.')
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [guestRegistrationEnabled])

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-card">Chargement des événements…</div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <span className="page-header__kicker">JOUER POUR DE BON · PLAYING FOR GOOD</span>
          <h1>Événements partageables</h1>
        </div>
        <span className="page-header__badge">QR + partage social</span>
      </header>

      {demoMode ? (
        <div className="demo-notice">
          Mode démonstration — configure VITE_JPDB_API_BASE_URL pour charger les événements publiés de la base de données.
        </div>
      ) : null}

      {waitingForHost ? (
        <div className="loading-card">Chargement des événements autorisés depuis la page hôte…</div>
      ) : null}

      {loadError ? <div className="error-box">{loadError}</div> : null}

      {!loadError && !waitingForHost && events.length === 0 ? (
        <div className="loading-card">Aucun événement à afficher.</div>
      ) : null}

      <section className="card-grid" aria-live="polite">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            guestRegistrationEnabled={guestRegistrationEnabled}
            onRegister={() => setRegistrationEvent(event)}
          />
        ))}
      </section>

      {registrationEvent && guestRegistrationEnabled ? (
        <RegistrationPanel event={registrationEvent} onClose={() => setRegistrationEvent(null)} />
      ) : null}
    </main>
  )
}
