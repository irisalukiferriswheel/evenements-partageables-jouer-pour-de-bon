import { useState } from 'react'
import { createGuestRegistration, startCheckout } from './api.js'

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  age_group: '18+',
  waiver_accepted: false,
}

export default function RegistrationPanel({ event, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(eventSubmit) {
    eventSubmit.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const registration = await createGuestRegistration(event.id, form)
      const registrationId = registration.id ?? registration.registration?.id

      if (!registrationId) {
        setStatus('success')
        return
      }

      const checkout = await startCheckout(registrationId)
      const checkoutUrl = checkout.checkout_url ?? checkout.url

      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }

      setStatus('success')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
      setStatus('error')
    }
  }

  return (
    <div className="registration-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="registration-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="registration-panel__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <div className="event-card__eyebrow">INSCRIPTION RAPIDE / QUICK REGISTRATION</div>
        <h2 id="registration-title">{event.title}</h2>
        <p className="registration-panel__cause">❤️ {event.cause?.name || 'Cause de l’événement'}</p>

        {status === 'success' ? (
          <div className="success-box">
            <strong>Inscription reçue.</strong>
            <span>Ton profil joueur pourra être activé plus tard sur le site.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="registration-form">
            <div className="form-grid">
              <label>
                Prénom
                <input required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
              </label>
              <label>
                Nom
                <input required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
              </label>
              <label>
                Courriel
                <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
              </label>
              <label>
                Téléphone
                <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </label>
              <label>
                Ville
                <input value={form.city} onChange={(e) => update('city', e.target.value)} />
              </label>
              <label>
                Âge
                <select value={form.age_group} onChange={(e) => update('age_group', e.target.value)}>
                  <option value="18+">18+</option>
                  <option value="under-18">Moins de 18 ans</option>
                </select>
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                required
                checked={form.waiver_accepted}
                onChange={(e) => update('waiver_accepted', e.target.checked)}
              />
              <span>J’accepte les règles et la décharge de participation applicables à cet événement.</span>
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <button className="button button--primary button--wide" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Traitement…' : 'Continuer vers le paiement'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
