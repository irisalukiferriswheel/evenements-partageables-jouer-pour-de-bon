export const translations = {
  fr: {
    locale: 'fr-CA',
    brand: 'JOUER POUR DE BON',
    languageLabel: 'Choix de langue',
    loadingEvents: 'Chargement des événements…',
    integratedNotConfigured: 'Vue intégrée non configurée : les origines de confiance sont requises.',
    loadEventsError: 'Impossible de charger les événements.',
    events: 'événement(s)',
    published: 'publié(s)',
    registrationsOpen: 'inscriptions ouvertes',
    registrations: 'inscription(s)',
    summaryLabel: 'Résumé des événements',
    demoNotice: 'Mode démonstration — configurez l’API JPDB pour charger les événements publiés.',
    waitingHost: 'Chargement des événements autorisés depuis la page hôte…',
    eventLabel: 'ÉVÉNEMENT',
    dateUnavailable: 'Date à confirmer',
    locationUnavailable: 'Lieu à confirmer',
    organizerCause: 'Cause sélectionnée par l’organisateur',
    playingFor: 'ON JOUE POUR',
    causeUnavailable: 'Cause indisponible',
    causeMissing: 'Inscription désactivée tant que la cause de l’événement n’est pas définie.',
    reservations: 'réservation(s)',
    seatsLeft: 'place(s) restante(s)',
    scanRegister: 'Scannez pour vous inscrire',
    scanView: 'Scannez pour voir l’événement',
    quickSoon: 'L’inscription rapide sera activée dès que le service d’inscription sera disponible.',
    copied: 'Lien d’inscription copié.',
    shareUnavailable: 'Le partage direct n’est pas disponible dans ce navigateur.',
    register: 'S’inscrire',
    registrationUnavailable: 'Inscription indisponible',
    registrationSoon: 'Inscription bientôt disponible',
    share: 'Partager',
    quickRegistration: 'INSCRIPTION RAPIDE',
    close: 'Fermer',
    eventCause: 'Cause de l’événement',
    privacy: 'L’inscription utilise votre courriel pour créer ou retrouver un dossier joueur privé. Il ne devient pas public tant que vous ne l’activez pas sur le site.',
    received: 'Inscription reçue.',
    claimLater: 'Votre dossier joueur pourra être réclamé et complété plus tard sur le site.',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Courriel',
    phone: 'Téléphone',
    city: 'Ville',
    age: 'Âge',
    under18: 'Moins de 18 ans',
    minorConfirmation: 'L’inscription d’un mineur doit être confirmée par un parent ou tuteur.',
    guardian: 'Parent ou tuteur',
    guardianEmail: 'Courriel du parent ou tuteur',
    guardianPhone: 'Téléphone du parent ou tuteur',
    guardianConsent: 'Je suis le parent ou tuteur et j’autorise cette inscription selon les règles applicables à l’événement.',
    waiver: 'J’accepte les règles et la décharge de participation applicables à cet événement.',
    processing: 'Traitement…',
    continuePayment: 'Continuer vers le paiement',
    genericError: 'Une erreur est survenue.',
    contributionIncomplete: 'Contribution à la cause incomplète',
    contributionRule: (required, credited) => `Chaque joueur de cet événement contribuant à cette cause doit verser ${required} à la cause. Vous avez contribué ${credited}.`,
    balanceRule: (remaining, causePart, winnerPart) => `Votre solde d’inscription restant est de ${remaining} : ${causePart} pour la cause et ${winnerPart} pour la part destinée aux joueurs gagnants.`,
    deadlineRule: (deadline) => `Le paiement est requis avant le ${deadline} pour participer à cet événement et au résultat de l’objectif de financement une fois celui-ci atteint.`,
    fallbackDeadline: 'la date limite de paiement de l’événement',
    qrTitle: (title) => `Code QR d’inscription pour ${title}`,
    organizerTitle: 'Mes événements',
    organizerBadge: 'QR + partage social',
    organizerEmpty: 'Vous n’avez aucun événement à afficher.',
    adminTitle: 'Tous les événements',
    adminBadge: 'Vue administrateur',
    adminEmpty: 'Aucun événement ne correspond à cette vue.',
    publicTitle: 'Événements partageables',
    publicBadge: 'QR + partage social',
    publicEmpty: 'Aucun événement à afficher.',
  },
  en: {
    locale: 'en-CA',
    brand: 'PLAYING FOR GOOD',
    languageLabel: 'Language selection',
    loadingEvents: 'Loading events…',
    integratedNotConfigured: 'Embedded view is not configured: trusted host origins are required.',
    loadEventsError: 'Events could not be loaded.',
    events: 'event(s)',
    published: 'published',
    registrationsOpen: 'registration open',
    registrations: 'registration(s)',
    summaryLabel: 'Event summary',
    demoNotice: 'Demo mode — configure the JPDB API to load published events.',
    waitingHost: 'Loading authorized events from the host page…',
    eventLabel: 'EVENT',
    dateUnavailable: 'Date to be confirmed',
    locationUnavailable: 'Location to be confirmed',
    organizerCause: 'Cause selected by the organizer',
    playingFor: 'PLAYING FOR',
    causeUnavailable: 'Cause unavailable',
    causeMissing: 'Registration is disabled until the event cause is defined.',
    reservations: 'reservation(s)',
    seatsLeft: 'spot(s) remaining',
    scanRegister: 'Scan to register',
    scanView: 'Scan to view the event',
    quickSoon: 'Quick registration will be enabled when the registration service is available.',
    copied: 'Registration link copied.',
    shareUnavailable: 'Direct sharing is not available in this browser.',
    register: 'Register',
    registrationUnavailable: 'Registration unavailable',
    registrationSoon: 'Registration coming soon',
    share: 'Share',
    quickRegistration: 'QUICK REGISTRATION',
    close: 'Close',
    eventCause: 'Event cause',
    privacy: 'Registration uses your email to create or retrieve a private player record. It does not become public unless you activate it later on the site.',
    received: 'Registration received.',
    claimLater: 'You can claim and complete your player record later on the site.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    city: 'City',
    age: 'Age',
    under18: 'Under 18',
    minorConfirmation: 'A minor’s registration must be confirmed by a parent or guardian.',
    guardian: 'Parent or guardian',
    guardianEmail: 'Parent or guardian email',
    guardianPhone: 'Parent or guardian phone',
    guardianConsent: 'I am the parent or guardian and authorize this registration under the event rules.',
    waiver: 'I accept the rules and participation waiver applicable to this event.',
    processing: 'Processing…',
    continuePayment: 'Continue to payment',
    genericError: 'An error occurred.',
    contributionIncomplete: 'Cause contribution incomplete',
    contributionRule: (required, credited) => `Every player in this event contributing to this cause must contribute ${required} to the cause. You have contributed ${credited}.`,
    balanceRule: (remaining, causePart, winnerPart) => `Your remaining registration balance is ${remaining}: ${causePart} for the cause and ${winnerPart} for the winning-player allocation.`,
    deadlineRule: (deadline) => `Payment is required by ${deadline} to participate in this event and in the crowdfunding outcome once the goal is reached.`,
    fallbackDeadline: 'the event payment deadline',
    qrTitle: (title) => `Registration QR code for ${title}`,
    organizerTitle: 'My events',
    organizerBadge: 'QR + social sharing',
    organizerEmpty: 'You have no events to display.',
    adminTitle: 'All events',
    adminBadge: 'Administrator view',
    adminEmpty: 'No events match this view.',
    publicTitle: 'Shareable events',
    publicBadge: 'QR + social sharing',
    publicEmpty: 'No events to display.',
  },
}

export function getLanguageFromLocation() {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (requested === 'en' || requested === 'fr') return requested
  const saved = localStorage.getItem('jpdb-language')
  return saved === 'en' ? 'en' : 'fr'
}


export function setSharedLanguage(language) {
  if (language !== 'fr' && language !== 'en') return
  localStorage.setItem('jpdb-language', language)

  const url = new URL(window.location.href)
  url.searchParams.set('lang', language)
  window.history.replaceState({}, '', url)

  if (window.parent !== window) {
    let targetOrigin = '*'
    try {
      targetOrigin = new URL(document.referrer).origin
    } catch {}
    window.parent.postMessage({ type: 'JPDB_LANGUAGE_CHANGED', language }, targetOrigin)
  }
}

export function subscribeToSharedLanguage(onLanguage) {
  const receive = (event) => {
    if (event.source !== window.parent) return
    if (event.data?.type !== 'JPDB_LANGUAGE') return
    if (event.data.language !== 'fr' && event.data.language !== 'en') return
    localStorage.setItem('jpdb-language', event.data.language)
    onLanguage(event.data.language)
  }
  window.addEventListener('message', receive)
  return () => window.removeEventListener('message', receive)
}
