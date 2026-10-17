import { useEffect, useMemo, useState } from 'react'
import EventCard from './EventCard.jsx'
import RegistrationPanel from './RegistrationPanel.jsx'
import {
  fetchEvent,
  fetchEvents,
  getEventIdFromLocation,
  isApiConfigured,
  isMemberRegistrationEnabled,
  isRegistrationIntentFromLocation,
  normalizeEvent,
} from './api.js'
import {
  getHostScopeFromLocation,
  hasTrustedHostOrigins,
  requestHostEvents,
  subscribeToHostEvents,
} from './hostBridge.js'
import { eventAcceptsMemberRegistration } from './registrationState.js'
import { mockEvent } from './mockEvent.js'
import {translations} from './translations.js'
import {useSiteLanguage} from './useSiteLanguage.js'
import {
  getViewPresentation,
  sortEventsForDisplay,
  summarizeEvents,
} from './viewPresentation.js'

export default function App() {
  const [language, setLanguage] = useSiteLanguage()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [registrationEvent, setRegistrationEvent] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [waitingForHost, setWaitingForHost] = useState(false)
  const [hostScope, setHostScope] = useState(null)
  const memberRegistrationEnabled = isMemberRegistrationEnabled()
  const t = translations[language]
  const displayEvents = useMemo(() => sortEventsForDisplay(events), [events])
  const view = getViewPresentation(hostScope, language)
  const summary = useMemo(() => summarizeEvents(displayEvents), [displayEvents])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = `${view.title} — ${language === 'fr' ? 'Jouer Pour de Bon' : 'Playing For Good'}`
  }, [language, view.title])



  useEffect(() => {
    let cancelled = false
    const detectedHostScope = getHostScopeFromLocation()
    setHostScope(detectedHostScope)

    if (detectedHostScope) {
      if (!hasTrustedHostOrigins()) {
        setLoadError(t.integratedNotConfigured)
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

      requestHostEvents(detectedHostScope)

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
            setEvents([normalizeEvent(mockEvent)])
          }
          return
        }

        const eventId = getEventIdFromLocation()
        const liveEvents = eventId ? [await fetchEvent(eventId, language)] : await fetchEvents(language)
        const availableEvents = liveEvents.filter(Boolean)

        if (!cancelled) {
          setEvents(availableEvents)

          if (
            memberRegistrationEnabled &&
            isRegistrationIntentFromLocation() &&
            eventId &&
            availableEvents.length === 1 &&
            (eventAcceptsMemberRegistration(availableEvents[0]) || new URLSearchParams(window.location.search).get('memberFlow') === '1')
          ) {
            setRegistrationEvent(availableEvents[0])
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(t.loadEventsError)
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
  }, [memberRegistrationEnabled, language, t.integratedNotConfigured, t.loadEventsError])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <span className="page-header__kicker">{t.brand}</span>
          <h1>{view.title}</h1>
        </div>
        <div className="page-header__controls">
          <span className="page-header__badge">{view.badge}</span>
          <div className="language-switcher" role="group" aria-label={t.languageLabel}>
            <button type="button" className={language === 'fr' ? 'is-active' : ''} aria-pressed={language === 'fr'} onClick={() => setLanguage('fr')}>FR</button>
            <button type="button" className={language === 'en' ? 'is-active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
          </div>
        </div>
      </header>

      {loading ? <div className="loading-card">{t.loadingEvents}</div> : null}

      {!loading && hostScope ? (
        <section className="event-summary" aria-label={t.summaryLabel}>
          <div><strong>{summary.total}</strong><span>{t.events}</span></div>
          <div><strong>{summary.published}</strong><span>{t.published}</span></div>
          <div><strong>{summary.open}</strong><span>{t.registrationsOpen}</span></div>
          <div><strong>{summary.registrations}</strong><span>{t.registrations}</span></div>
        </section>
      ) : null}

      {!loading && demoMode ? <div className="demo-notice">{t.demoNotice}</div> : null}
      {!loading && waitingForHost ? <div className="loading-card">{t.waitingHost}</div> : null}
      {!loading && loadError ? <div className="error-box page-message">{loadError}</div> : null}

      {!loading && !loadError && !waitingForHost && displayEvents.length === 0 ? (
        <div className="loading-card">{view.empty}</div>
      ) : null}

      {!loading ? (
        <section className="card-grid" aria-live="polite">
          {displayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              language={language}
              memberRegistrationEnabled={memberRegistrationEnabled}
              onRegister={() => setRegistrationEvent(event)}
            />
          ))}
        </section>
      ) : null}

      {registrationEvent && memberRegistrationEnabled ? (
        <RegistrationPanel
          event={registrationEvent}
          language={language}
          onLanguageChange={setLanguage}
          onClose={() => setRegistrationEvent(null)}
        />
      ) : null}
    </main>
  )
}
