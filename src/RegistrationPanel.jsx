import {translatePanel} from './panelCatalog.js';
import {translations} from './translations.js';
import {getCauseContributionBalance} from './causeContributionBalance.js';
import {withLanguage} from './languageUrl.js';
import { useEffect, useId, useRef, useState } from 'react'
import { eventAcceptsMemberRegistration } from './registrationState.js'
import { buildMemberRegistrationUrl, isVerifiedCheckout, requestMemberRegistration } from './memberRegistrationBridge.js'

export default function RegistrationPanel({ event, language='fr', onLanguageChange, onClose }) {
  const tr=value=>translatePanel(value,language);
  const titleId=useId();
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(null)
  const panel = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    panel.current?.querySelector('button')?.focus()
    return () => { inFlight.current?.abort(); previousFocus?.focus?.() }
  }, [])
  function handleKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key !== 'Tab') return
    const elements = [...panel.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')]
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
  }
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const memberFlow = new URLSearchParams(window.location.search).get('memberFlow') === '1' && window.parent !== window
  const balance=getCauseContributionBalance(event,result);
  const checkout = result?.checkout
  const canPay = result?.status === 'pending_payment' && !result.paymentReviewRequired && isVerifiedCheckout(checkout)
  async function request(action) {
    if (inFlight.current) return
    const controller = new AbortController()
    inFlight.current = controller
    setBusy(true); setError(null)
    try {
      const origins = ['https://www.jouerpourdebon.ca']
      if ((import.meta.env.VITE_TRUSTED_HOST_ORIGINS || '').split(',').map(s => s.trim()).includes('https://jouerpourdebon.ca')) origins.push('https://jouerpourdebon.ca')
      setResult(await requestMemberRegistration(event.id, action, { origins, signal: controller.signal }))
      setCopied(false)
    } catch (err) { if (err.name !== 'AbortError') setError(err) }
    finally {
      inFlight.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  async function copyReference() {
    try { await navigator.clipboard.writeText(checkout.reference); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return (
    <div className="registration-backdrop" role="presentation" onMouseDown={onClose}>
      <section ref={panel} onKeyDown={handleKeyDown} className="registration-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={e => e.stopPropagation()}>
        <div className="language-switcher" data-jpdb-language-control="" role="group" aria-label={language==='en'?'Language':'Langue'}>{['fr','en'].map(code=><button key={code} type="button" lang={code} aria-pressed={language===code} onClick={()=>onLanguageChange?.(code)}>{code.toUpperCase()}</button>)}</div>
        <button className="registration-panel__close" onClick={onClose} aria-label={tr("Fermer")}>×</button>
        <div className="event-card__eyebrow">{tr("INSCRIPTION")}</div>
        <h2 id={titleId}>{event.title}</h2>
        <p>{[event.city,event.venue_name].filter(Boolean).join(' · ')}</p>
        <p><strong>{Number(event.entry_fee)===0?tr("Gratuit"):new Intl.NumberFormat(language==='fr'?'fr-CA':'en-CA',{style:'currency',currency:event.currency||'CAD'}).format(event.entry_fee)}</strong>{Number.isInteger(event.spots_left)&&` · ${event.spots_left} ${tr('place(s) disponible(s)')}`}</p>
        {event.cause?.name&&<p>{tr("Cause soutenue :")} {event.cause.name}</p>}
        <p>{tr("Connecte-toi ou crée ton compte Jouer Pour de Bon pour t’inscrire et retrouver ta participation dans ton espace privé.")}</p>
        {!memberFlow ? <a className="button button--primary" href={withLanguage(buildMemberRegistrationUrl(event.id),language)} target="_top">{tr("Se connecter ou créer un compte")}</a> : <>
          {!result && eventAcceptsMemberRegistration(event) && <button className="button button--primary" disabled={busy} onClick={() => request('register')}>{busy ? tr("Connexion en cours…") : tr("Continuer avec mon compte")}</button>}
          {!result && <button className="button button--secondary" disabled={busy} onClick={() => request('status')}>{busy ? tr("Vérification…") : tr("Retrouver mon inscription")}</button>}
          <div aria-live="polite">
            {balance.incomplete && <CauseContributionNotice balance={balance} language={language} timeZone={event.timezone}/> }
            {result?.status === 'confirmed' && <div className="success-box"><strong>{tr("Inscription confirmée.")}</strong><span>{tr("Retrouve cet événement dans ton espace joueur.")}</span></div>}
            {result?.status === 'pending_payment' && <>
              <p><strong>{tr("Paiement en attente.")}</strong> {tr("Ton inscription sera confirmée après vérification du paiement.")}</p>
              {result.paymentReviewRequired && <p>{tr("Paiement à vérifier — contacte l’organisateur avant de payer à nouveau.")}</p>}
              {canPay ? <>
                <p>{tr("Montant :")} <strong>{new Intl.NumberFormat(language==='fr'?'fr-CA':'en-CA', { style: 'currency', currency: 'CAD' }).format(checkout.amount)}</strong></p>
                <label>{tr("Référence d’inscription")}<input readOnly value={checkout.reference} onFocus={e => e.target.select()} /></label>
                <button className="button button--secondary" onClick={copyReference}>{copied ? tr("Référence copiée") : tr("Copier la référence")}</button>
                {copyError && <p>{tr("Sélectionne et copie la référence ci-dessus.")}</p>}
                <p>{tr("Sur Zeffy, choisis un seul billet au montant indiqué et colle cette référence dans le champ « Référence d’inscription JPDB ». Privilégie le paiement par carte. Reviens ici après ton paiement.")}</p>
                <a className="button button--primary" href={checkout.url} target="_blank" rel="noopener noreferrer" onClick={e => { if (!isVerifiedCheckout(checkout)) { e.preventDefault(); request('status') } }}>{tr("Payer par carte avec Zeffy")}</a>
              </> : !result.paymentReviewRequired && <p>{tr("Le lien de paiement n’est pas disponible ou a expiré. Vérifie ton inscription pour obtenir les prochaines étapes.")}</p>}
              <button className="button button--secondary" disabled={busy} onClick={() => request('status')}>{busy ? tr("Vérification…") : tr("Vérifier mon inscription")}</button>
            </>}
            {['cancelled', 'refunded'].includes(result?.status) && <p>{result.status === 'cancelled' ? tr("Cette inscription a été annulée.") : tr("Cette inscription a été remboursée.")}</p>}
            {error && <div className="error-box" role="alert">{registrationError(error,language)}{error.code === 'PLAYER_PROFILE_REQUIRED' && <p><a href={withLanguage(buildMemberRegistrationUrl(event.id, true),language)} target="_top">{tr("Compléter mon profil joueur")}</a></p>}{['INVITATION_REQUIRED','INVITATION_NOT_ACCEPTED'].includes(error.code) && <p><a href={withLanguage(buildMemberRegistrationUrl(event.id,true),language)} target="_top">{tr("Voir et accepter mes invitations")}</a></p>}</div>}
          </div>
        </>}
      </section>
    </div>
  )
}

function formatMoney(amount, currency, locale) {
  return Number(amount || 0).toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

function formatDeadline(value, t, timeZone) {
  if (!value) return t.fallbackDeadline
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(t.locale, {
    timeZone: timeZone || 'America/Toronto',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function CauseContributionNotice({ balance, language, timeZone }) {
  const t = translations[language]
  const required = formatMoney(balance.requiredCauseContribution, balance.currency, t.locale)
  const credited = formatMoney(balance.creditedCauseContribution, balance.currency, t.locale)
  const remaining = formatMoney(balance.remainingRegistrationBalance, balance.currency, t.locale)
  const causePart = formatMoney(balance.causeDifference, balance.currency, t.locale)
  const winnerPart = formatMoney(balance.winnerAllocationDifference, balance.currency, t.locale)

  return (
    <section className="cause-contribution-notice" aria-live="polite">
      <strong>{t.contributionIncomplete}</strong>
      <p>{t.contributionRule(required, credited)}</p>
      <p>{t.balanceRule(remaining, causePart, winnerPart)}</p>
      <p>{t.deadlineRule(formatDeadline(balance.paymentDeadline, t, timeZone))}</p>
    </section>
  )
}

function registrationError(error,language){const messages={PLAYER_PROFILE_REQUIRED:['Complétez votre profil joueur.','Complete your player profile.'],COMPETITION_FULL:['Cet événement est complet.','This event is full.'],REGISTRATION_CLOSED:['Les inscriptions sont fermées.','Registration is closed.'],INVITATION_REQUIRED:['Une invitation est requise.','An invitation is required.'],INVITATION_NOT_ACCEPTED:['Acceptez votre invitation pour continuer.','Accept your invitation to continue.'],AGE_NOT_ELIGIBLE:['Les critères d’âge ne sont pas remplis.','The age requirements are not met.'],LOGIN_CANCELLED:['La connexion a été annulée.','Sign-in was cancelled.']};return messages[error?.code]?.[language==='en'?1:0]||(language==='en'?'Unable to continue. Check your registration before trying again.':'Impossible de continuer. Vérifiez votre inscription avant de réessayer.');}
