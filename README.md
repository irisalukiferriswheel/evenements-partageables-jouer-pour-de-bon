# Événements partageables — Jouer Pour de Bon

Application React + Vite qui transforme les événements Jouer Pour de Bon en cartes partageables avec QR code visible, partage social et inscription rapide.

## Principes

- Une seule application rend autant de cartes qu'il y a d'événements.
- Les cartes lisent les événements depuis l'API JPDB, qui reste la source de vérité devant Supabase.
- La cause affichée vient de l'événement créé par l'organisateur; le participant ne choisit pas la cause.
- Le QR code est généré localement dans le navigateur avec `qrcode.react`; aucun service QR tiers n'est requis.
- Le même lien sert au partage social et au scan téléphone-à-téléphone.
- L'inscription est conçue guest-first; le backend doit ensuite créer ou rattacher le joueur et permettre l'activation ultérieure du profil.
- Les vues organisateur/admin utilisent le même composant de carte, mais leurs données privées sont fournies par la page Wix hôte plutôt que par des secrets placés dans l'iframe.

## Lancer en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configurer :

```text
VITE_JPDB_API_BASE_URL=https://votre-api-jpdb
```

Pour une vue Wix organisateur/admin, configurer aussi les origines exactes autorisées :

```text
VITE_TRUSTED_HOST_ORIGINS=https://www.votre-site.ca,https://votre-site.ca
```

L'inscription rapide reste désactivée tant que le backend guest-first n'est pas déployé :

```text
VITE_GUEST_REGISTRATION_ENABLED=false
```

Passer ce drapeau à `true` seulement après déploiement et validation de `POST /v1/calendar/events/:eventId/registrations` et du checkout invité associé. Cela permet de déployer les cartes/QR sans envoyer les visiteurs vers un endpoint inexistant.

## Modes d'affichage

Une carte publique précise :

```text
http://localhost:5173/?event=<EVENT_ID>
```

Sans `event`, l'application charge la collection publique depuis `GET /v1/events`.

Sans API configurée, elle affiche uniquement la carte de démonstration afin de permettre le travail de design; une erreur API réelle ne bascule jamais silencieusement vers de fausses données.

Vue organisateur intégrée :

```text
https://<github-pages>/...?scope=organizer
```

Vue admin intégrée :

```text
https://<github-pages>/...?scope=admin
```

Dans ces deux modes, l'iframe demande ses événements à la page hôte via `postMessage`. La page hôte doit faire l'appel autorisé à l'API JPDB côté Wix/backend puis répondre avec :

```js
iframe.contentWindow.postMessage(
  {
    type: 'jpdb:event-cards:set-events',
    events: authorizedEvents,
  },
  'https://irisalukiferriswheel.github.io',
)
```

L'application n'accepte les réponses que si `messageEvent.origin` figure dans `VITE_TRUSTED_HOST_ORIGINS` et si la source du message est bien `window.parent`. Aucun `WIX_INTEGRATION_KEY` ni secret Supabase ne doit être transmis à l'iframe.

## Contrat API public

La carte publique précise appelle :

```text
GET /v1/calendar/events/:eventId
```

La collection publique appelle :

```text
GET /v1/events
```

Le détail public doit inclure la cause déjà résolue par le backend, par exemple :

```json
{
  "data": {
    "id": "evt_123",
    "competitionId": "comp_123",
    "title": "Basketball Knockout",
    "city": "Sherbrooke",
    "startAt": "2026-08-29T18:00:00.000Z",
    "feeAmount": 10,
    "feeCurrency": "CAD",
    "maxParticipants": 20,
    "reservedCount": 12,
    "spotsLeft": 8,
    "registrationOpen": true,
    "cause": {
      "id": "cause_45",
      "name": "Maison des jeunes XYZ",
      "description": "...",
      "websiteUrl": null,
      "canonical": true
    }
  }
}
```

## Inscription guest-first

Le client est préparé pour :

```text
POST /v1/calendar/events/:eventId/registrations
```

Le participant envoie seulement son identité/contact et son consentement. `competitionId` et la cause doivent être dérivés de l'événement côté API; le navigateur ne choisit jamais la cause.

Le backend guest-registration n'est pas encore activé car la table canonique `registrations` exige actuellement un `auth.users.user_id` et le schéma déployé de `players` doit être diagnostiqué avant migration. Il ne faut pas créer une seconde table parallèle de « guest registrations » pour contourner ce point.

Voir `docs/BACKEND_REQUIREMENTS.md`.

## Intégration Wix

Wix n'a besoin que d'un seul embed/iframe pour chaque contexte de page, pas d'un embed par événement. La quantité de cartes est pilotée par les enregistrements reçus de l'API ou de la page hôte.

## Prochaines étapes

- exécuter le diagnostic du schéma `players` sur le projet Supabase réel;
- faire évoluer le modèle canonique `registrations` pour une identité joueur guest puis revendicable;
- relier définitivement l'événement à un `cause_id` canonique au moment de la création/publication;
- brancher le fournisseur de paiement réel;
- terminer le flux mineur/consentement parental;
- ajouter métadonnées Open Graph/social previews et images sociales exportables.
