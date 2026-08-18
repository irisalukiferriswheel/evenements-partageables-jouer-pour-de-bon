import { useEffect, useState } from 'react'
import EventCard from './EventCard.jsx'
import RegistrationPanel from './RegistrationPanel.jsx'
import { fetchEvent } from './api.js'
import { mockEvent } from './mockEvent.js'

export default function App() {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [registrationOpen, setRegistrationOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const liveEvent = await fetchEvent()
        if (!cancelled) setEvent(liveEvent || mockEvent)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message)
          setEvent(mockEvent)
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
    return <main className="page-shell"><div className="loading-card">Chargement de l’événement…</div></main>
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

      {loadError ? (
        <div className="demo-notice">
          Mode démonstration — l’API n’a pas encore renvoyé cet événement. Le composant est prêt à recevoir les données réelles.
        </div>
      ) : null}

      <section className="card-grid">
        <EventCard event={event} onRegister={() => setRegistrationOpen(true)} />
      </section>

      {registrationOpen ? (
        <RegistrationPanel event={event} onClose={() => setRegistrationOpen(false)} />
      ) : null}
    </main>
  )
}
