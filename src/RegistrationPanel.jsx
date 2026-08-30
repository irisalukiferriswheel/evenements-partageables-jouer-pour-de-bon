import { useState } from 'react'
import { createGuestRegistration, startCheckout } from './api.js'
import { getGuestRegistrationHandoff } from './registrationHandoff.js'
import { getCauseContributionBalance } from './causeContributionBalance.js'
import { translations } from './translations.js'

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

export default function RegistrationPanel({ event, language = 'fr', onClose }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const t = translations[language]
  const isMinor = form.age_group === 'under-18'
  const contributionBalance = getCauseContributionBalance(event)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(eventSubmit) {
    eventSubmit.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const payload = await createGuestRegistration(event.id, form, language)
      const handoff = getGuestRegistrationHandoff(payload)

      if (handoff.kind === 'redirect') {
        window.location.assign(handoff.checkoutUrl)
        return
      }

      if (handoff.kind !== 'guest_checkout') {
        setStatus('success')
        return
      }

      const checkoutPayload = await startCheckout(handoff.registrationId, handoff.guestToken, language)
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
      setError(err.message || t.genericError)
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
        <button className="registration-panel__close" onClick={onClose} aria-label={t.close}>×</button>
        <div className="event-card__eyebrow">{t.quickRegistration}</div>
        <h2 id="registration-title">{event.title}</h2>
        <p className="registration-panel__cause">❤️ {event.cause?.name || t.eventCause}</p>
        <p>{t.privacy}</p>

        {contributionBalance.incomplete ? (
          <CauseContributionNotice balance={contributionBalance} language={language} />
        ) : null}

        {status === 'success' ? (
          <div className="success-box">
            <strong>{t.received}</strong>
            <span>{t.claimLater}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="registration-form">
            <div className="form-grid">
              <Field label={t.firstName}>
                <input autoComplete="given-name" required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
              </Field>
              <Field label={t.lastName}>
                <input autoComplete="family-name" required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
              </Field>
              <Field label={t.email}>
                <input type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
              </Field>
              <Field label={t.phone}>
                <input type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </Field>
              <Field label={t.city}>
                <input autoComplete="address-level2" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </Field>
              <Field label={t.age}>
                <select value={form.age_group} onChange={(e) => update('age_group', e.target.value)}>
                  <option value="18+">18+</option>
                  <option value="under-18">{t.under18}</option>
                </select>
              </Field>
            </div>

            {isMinor ? (
              <>
                <div className="error-box">{t.minorConfirmation}</div>
                <div className="form-grid">
                  <Field label={t.guardian}>
                    <input autoComplete="name" required value={form.guardian_name} onChange={(e) => update('guardian_name', e.target.value)} />
                  </Field>
                  <Field label={t.guardianEmail}>
                    <input type="email" autoComplete="email" required value={form.guardian_email} onChange={(e) => update('guardian_email', e.target.value)} />
                  </Field>
                  <Field label={t.guardianPhone}>
                    <input type="tel" autoComplete="tel" required value={form.guardian_phone} onChange={(e) => update('guardian_phone', e.target.value)} />
                  </Field>
                </div>
                <label className="checkbox-row">
                  <input type="checkbox" required checked={form.guardian_consent} onChange={(e) => update('guardian_consent', e.target.checked)} />
                  <span>{t.guardianConsent}</span>
                </label>
              </>
            ) : (
              <label className="checkbox-row">
                <input type="checkbox" required checked={form.waiver_accepted} onChange={(e) => update('waiver_accepted', e.target.checked)} />
                <span>{t.waiver}</span>
              </label>
            )}

            {error ? <div className="error-box">{error}</div> : null}

            <button className="button button--primary button--wide" disabled={status === 'submitting'}>
              {status === 'submitting' ? t.processing : t.continuePayment}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }) {
  return <label>{label}{children}</label>
}

function formatMoney(amount, currency, locale) {
  return Number(amount || 0).toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

function formatDeadline(value, t) {
  if (!value) return t.fallbackDeadline
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(t.locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function CauseContributionNotice({ balance, language }) {
  const t = translations[language]
  const required = formatMoney(balance.requiredCauseContribution, balance.currency, t.locale)
  const credited = formatMoney(balance.creditedCauseContribution, balance.currency, t.locale)
  const remaining = formatMoney(balance.remainingRegistrationBalance, balance.currency, t.locale)
  const causePart = formatMoney(balance.causeDifference, balance.currency, t.locale)
  const winnerPart = formatMoney(balance.winnerAllocationDifference, balance.currency, t.locale)

  return (
    <section className="cause-contribution-notice" aria-labelledby="cause-contribution-title">
      <strong id="cause-contribution-title">{t.contributionIncomplete}</strong>
      <p>{t.contributionRule(required, credited)}</p>
      <p>{t.balanceRule(remaining, causePart, winnerPart)}</p>
      <p>{t.deadlineRule(formatDeadline(balance.paymentDeadline, t))}</p>
    </section>
  )
}
