import { useEffect, useState } from 'react'
import EventCard from './EventCard.jsx'
import RegistrationPanel from './RegistrationPanel.jsx'
import { fetchEvent, fetchEvents, getEventIdFromLocation, isApiConfigured } from './api.js'
import { mockEvent } from './mockEvent.js'

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [registrationEvent, setRegistrationEvent] = useState(null)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    let cancelled = false

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

        if (!cancelled) {
          setEvents(liveEvents.filter(Boolean))
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
  }, [])

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

      {loadError ? <div className="error-box">{loadError}</div> : null}

      {!loadError && events.length === 0 ? (
        <div className="loading-card">Aucun événement publié à afficher.</div>
      ) : null}

      <section className="card-grid" aria-live="polite">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onRegister={() => setRegistrationEvent(event)}
          />
        ))}
      </section>

      {registrationEvent ? (
        <RegistrationPanel event={registrationEvent} onClose={() => setRegistrationEvent(null)} />
      ) : null}
    </main>
  )
}
