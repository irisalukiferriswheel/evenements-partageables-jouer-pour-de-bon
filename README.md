# Événements partageables — Jouer Pour de Bon

Application React + Vite qui transforme les événements Jouer Pour de Bon en cartes partageables avec QR code visible, partage social et inscription rapide.

## Principes

- Une seule application rend autant de cartes qu'il y a d'événements.
- Les cartes lisent les événements depuis l'API JPDB, qui reste la source de vérité devant Supabase.
- La cause affichée vient de l'événement créé par l'organisateur; le participant ne choisit pas la cause.
- Le QR code est généré localement dans le navigateur avec `qrcode.react`; aucun service QR tiers n'est requis.
- Le même lien sert au partage social et au scan téléphone-à-téléphone.
- Le QR et le partage pointent vers la carte publique autonome, jamais vers une vue Wix organisateur/admin intégrée.
- L'inscription est conçue guest-first; le backend doit ensuite créer ou rattacher le joueur et permettre l'activation ultérieure du profil.
- Les vues organisateur/admin utilisent le même composant de carte, mais leurs données privées sont fournies par la page Wix hôte plutôt que par des secrets placés dans l'iframe.
- Zeffy est le seul fournisseur de paiement prévu. Le navigateur accepte uniquement un lien de paiement HTTPS Zeffy créé par l'API JPDB et ne contient aucun secret de paiement.

## Lancer en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configurer :

```text
VITE_JPDB_API_BASE_URL=https://votre-api-jpdb
VITE_PUBLIC_CARD_BASE_URL=https://votre-hote-public/evenements-partageables-jouer-pour-de-bon/
```

`VITE_PUBLIC_CARD_BASE_URL` est la racine publique et autonome de l'application de cartes. C'est cette URL qui est utilisée pour fabriquer les liens QR et de partage. Elle évite qu'une carte affichée dans un iframe `?scope=organizer` ou `?scope=admin` partage accidentellement l'URL de la vue intégrée. Si elle n'est pas configurée, l'application reprend son origine/chemin courant mais supprime les paramètres d'intégration avant d'ajouter `?event=<EVENT_ID>`.

Pour une vue Wix organisateur/admin, configurer aussi les origines exactes autorisées :

```text
VITE_TRUSTED_HOST_ORIGINS=https://www.votre-site.ca,https://votre-site.ca
```

L'inscription rapide reste désactivée tant que le backend guest-first n'est pas déployé :

```text
VITE_GUEST_REGISTRATION_ENABLED=false
```

Passer ce drapeau à `true` seulement après déploiement et validation de `POST /v1/calendar/events/:eventId/registrations`, du checkout invité Zeffy associé et de la réconciliation des paiements confirmés. Cela permet de déployer les cartes/QR sans envoyer les visiteurs vers un endpoint inexistant.

## Modes d'affichage

Une carte publique précise :

```text
http://localhost:5173/?event=<EVENT_ID>
```

Le lien QR/partage d'inscription ajoute :

```text
?event=<EVENT_ID>&register=1
```

Sans `event`, l'application charge la collection publique card-ready depuis :

```text
GET /v1/calendar/events
```

La collection renvoie directement la cause et la disponibilité de chaque événement, donc le navigateur n'a pas besoin d'effectuer un appel de détail supplémentaire pour chaque carte.

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
GET /v1/calendar/events
```

Les deux contrats sont card-ready et incluent la cause déjà résolue par le backend, par exemple :

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

Pour la collection, `data` est un tableau de ces objets.

Le frontend peut accepter un futur `cardUrl`/`registrationUrl` explicitement fourni par l'API. En l'absence de ces champs, il construit lui-même l'URL de carte autonome à partir de `VITE_PUBLIC_CARD_BASE_URL`; un éventuel `publicUrl` d'une page événement séparée est conservé comme métadonnée mais n'est pas utilisé pour le QR.

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
- terminer et valider l'intégration backend Zeffy (checkout hébergé, webhooks signés, idempotence et réconciliation) avant d'activer l'inscription invitée;
- terminer le flux mineur/consentement parental;
- ajouter métadonnées Open Graph/social previews et images sociales exportables.
