import { useEffect, useRef, useState } from 'react'
import { eventAcceptsMemberRegistration } from './registrationState.js'
import { buildMemberRegistrationUrl, isVerifiedCheckout, requestMemberRegistration } from './memberRegistrationBridge.js'

export default function RegistrationPanel({ event, onClose }) {
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
      <section ref={panel} onKeyDown={handleKeyDown} className="registration-panel" role="dialog" aria-modal="true" aria-labelledby="registration-title" onMouseDown={e => e.stopPropagation()}>
        <button className="registration-panel__close" onClick={onClose} aria-label="Fermer">×</button>
        <div className="event-card__eyebrow">INSCRIPTION</div>
        <h2 id="registration-title">{event.title}</h2>
        <p>{[event.city,event.venue_name].filter(Boolean).join(' · ')}</p>
        <p><strong>{Number(event.entry_fee)===0?'Gratuit':new Intl.NumberFormat('fr-CA',{style:'currency',currency:event.currency||'CAD'}).format(event.entry_fee)}</strong>{Number.isInteger(event.spots_left)&&` · ${event.spots_left} place(s) disponible(s)`}</p>
        {event.cause?.name&&<p>Cause soutenue : {event.cause.name}</p>}
        <p>Connecte-toi ou crée ton compte Jouer Pour de Bon pour t’inscrire et retrouver ta participation dans ton espace privé.</p>
        {!memberFlow ? <a className="button button--primary" href={buildMemberRegistrationUrl(event.id)} target="_top">Se connecter ou créer un compte</a> : <>
          {!result && eventAcceptsMemberRegistration(event) && <button className="button button--primary" disabled={busy} onClick={() => request('register')}>{busy ? 'Connexion en cours…' : 'Continuer avec mon compte'}</button>}
          {!result && <button className="button button--secondary" disabled={busy} onClick={() => request('status')}>{busy ? 'Vérification…' : 'Retrouver mon inscription'}</button>}
          <div aria-live="polite">
            {result?.status === 'confirmed' && <div className="success-box"><strong>Inscription confirmée.</strong><span>Retrouve cet événement dans ton espace joueur.</span></div>}
            {result?.status === 'pending_payment' && <>
              <p><strong>Paiement en attente.</strong> Ton inscription sera confirmée après vérification du paiement.</p>
              {result.paymentReviewRequired && <p>Paiement à vérifier — contacte l’organisateur avant de payer à nouveau.</p>}
              {canPay ? <>
                <p>Montant : <strong>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(checkout.amount)}</strong></p>
                <label>Référence d’inscription<input readOnly value={checkout.reference} onFocus={e => e.target.select()} /></label>
                <button className="button button--secondary" onClick={copyReference}>{copied ? 'Référence copiée' : 'Copier la référence'}</button>
                {copyError && <p>Sélectionne et copie la référence ci-dessus.</p>}
                <p>Sur Zeffy, choisis un seul billet au montant indiqué et colle cette référence dans le champ « Référence d’inscription JPDB ». Privilégie le paiement par carte. Reviens ici après ton paiement.</p>
                <a className="button button--primary" href={checkout.url} target="_blank" rel="noopener noreferrer" onClick={e => { if (!isVerifiedCheckout(checkout)) { e.preventDefault(); request('status') } }}>Payer par carte avec Zeffy</a>
              </> : !result.paymentReviewRequired && <p>Le lien de paiement n’est pas disponible ou a expiré. Vérifie ton inscription pour obtenir les prochaines étapes.</p>}
              <button className="button button--secondary" disabled={busy} onClick={() => request('status')}>{busy ? 'Vérification…' : 'Vérifier mon inscription'}</button>
            </>}
            {['cancelled', 'refunded'].includes(result?.status) && <p>{result.status === 'cancelled' ? 'Cette inscription a été annulée.' : 'Cette inscription a été remboursée.'}</p>}
            {error && <div className="error-box" role="alert">{error.message}{error.code === 'PLAYER_PROFILE_REQUIRED' && <p><a href={buildMemberRegistrationUrl(event.id, true)} target="_top">Compléter mon profil joueur</a></p>}{['INVITATION_REQUIRED','INVITATION_NOT_ACCEPTED'].includes(error.code) && <p><a href={buildMemberRegistrationUrl(event.id,true)} target="_top">Voir et accepter mes invitations</a></p>}</div>}
          </div>
        </>}
      </section>
    </div>
  )
}
