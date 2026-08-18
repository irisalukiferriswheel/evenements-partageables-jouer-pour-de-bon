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
  guardian_name: '',
  guardian_email: '',
  guardian_phone: '',
  guardian_consent: false,
}

export default function RegistrationPanel({ event, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const isMinor = form.age_group === 'under-18'

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(eventSubmit) {
    eventSubmit.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const payload = await createGuestRegistration(event.id, form)
      const data = payload?.data ?? payload
      const registration = data?.registration ?? data
      const registrationId = registration?.id
      const guestToken = data?.guestToken ?? data?.guest_token ?? null
      const immediateCheckoutUrl = data?.checkout?.checkoutUrl ?? data?.checkout?.checkout_url ?? null

      if (immediateCheckoutUrl) {
        window.location.assign(immediateCheckoutUrl)
        return
      }

      if (!registrationId) {
        setStatus('success')
        return
      }

      const checkoutPayload = await startCheckout(registrationId, guestToken)
      const checkoutData = checkoutPayload?.data ?? checkoutPayload
      const checkoutUrl =
        checkoutData?.checkout?.checkoutUrl ??
        checkoutData?.checkout?.checkout_url ??
        checkoutData?.checkout_url ??
        checkoutData?.url ??
        null

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
        <p>
          L’inscription utilise ton courriel pour créer ou retrouver un dossier joueur privé. Il ne devient pas un profil public tant que tu ne l’actives pas plus tard sur le site.
        </p>

        {status === 'success' ? (
          <div className="success-box">
            <strong>Inscription reçue.</strong>
            <span>Ton dossier joueur pourra être réclamé et complété plus tard sur le site.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="registration-form">
            <div className="form-grid">
              <label>
                Prénom
                <input
                  autoComplete="given-name"
                  required
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                />
              </label>
              <label>
                Nom
                <input
                  autoComplete="family-name"
                  required
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                />
              </label>
              <label>
                Courriel
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </label>
              <label>
                Téléphone
                <input
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </label>
              <label>
                Ville
                <input
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
              </label>
              <label>
                Âge
                <select value={form.age_group} onChange={(e) => update('age_group', e.target.value)}>
                  <option value="18+">18+</option>
                  <option value="under-18">Moins de 18 ans</option>
                </select>
              </label>
            </div>

            {isMinor ? (
              <>
                <div className="error-box">
                  L’inscription d’un mineur doit être confirmée par un parent ou tuteur.
                </div>
                <div className="form-grid">
                  <label>
                    Parent ou tuteur
                    <input
                      autoComplete="name"
                      required
                      value={form.guardian_name}
                      onChange={(e) => update('guardian_name', e.target.value)}
                    />
                  </label>
                  <label>
                    Courriel du parent/tuteur
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={form.guardian_email}
                      onChange={(e) => update('guardian_email', e.target.value)}
                    />
                  </label>
                  <label>
                    Téléphone du parent/tuteur
                    <input
                      type="tel"
                      autoComplete="tel"
                      required
                      value={form.guardian_phone}
                      onChange={(e) => update('guardian_phone', e.target.value)}
                    />
                  </label>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    required
                    checked={form.guardian_consent}
                    onChange={(e) => update('guardian_consent', e.target.checked)}
                  />
                  <span>Je suis le parent ou tuteur et j’autorise cette inscription selon les règles applicables à l’événement.</span>
                </label>
              </>
            ) : (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  required
                  checked={form.waiver_accepted}
                  onChange={(e) => update('waiver_accepted', e.target.checked)}
                />
                <span>J’accepte les règles et la décharge de participation applicables à cet événement.</span>
              </label>
            )}

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
