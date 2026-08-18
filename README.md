# Événements partageables — Jouer Pour de Bon

Application React + Vite qui transforme les événements Jouer Pour de Bon en cartes partageables avec QR code visible, partage social et inscription rapide.

## Principes

- Une seule application rend autant de cartes qu'il y a d'événements.
- Les cartes lisent les événements depuis l'API JPDB, qui reste la source de vérité devant Supabase.
- La cause affichée vient de l'événement créé par l'organisateur (`event.cause` / `cause_id` résolu par l'API); le participant ne choisit pas la cause.
- Le QR code est généré localement dans le navigateur avec `qrcode.react`; aucun service QR tiers n'est requis.
- Le même lien sert au partage social et au scan téléphone-à-téléphone.
- L'inscription est guest-first; le backend pourra ensuite créer ou rattacher le profil joueur et proposer son activation.

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

Puis ouvrir :

```text
http://localhost:5173/?event=<EVENT_ID>
```

Sans API ou sans `event`, l'application affiche une carte de démonstration pour permettre de travailler le design.

## Contrat API attendu

La carte appelle :

```text
GET  /v1/events/:id
POST /v1/registrations
POST /v1/registrations/:id/checkout
```

Le payload événement doit idéalement inclure la cause déjà résolue :

```json
{
  "id": "evt_123",
  "title": "Basketball Knockout",
  "city": "Sherbrooke",
  "start_at": "2026-08-29T14:00:00-04:00",
  "entry_fee": 10,
  "currency": "CAD",
  "capacity": 20,
  "registration_count": 12,
  "public_url": "https://playingforgood.ca/e/basketball-knockout-x72f",
  "cause": {
    "id": "cause_45",
    "name": "Maison des jeunes XYZ",
    "logo_url": null,
    "description": "..."
  }
}
```

## Intégration Wix

Wix n'a besoin que d'un seul embed/iframe vers cette application. Le nombre de cartes est piloté par les données, pas par des embeds créés manuellement pour chaque événement.

## À faire ensuite

- adapter précisément `normalizeEvent()` au payload réel de `/v1/events/:id`;
- ajouter le mode liste pour l'espace organisateur et le mode admin;
- finaliser le contrat backend guest-registration + création/rattachement de joueur;
- brancher le vrai fournisseur de paiement;
- ajouter le flux mineur/consentement parental;
- ajouter métadonnées Open Graph/social previews et images sociales exportables.
