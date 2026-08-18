# Backend requirements for shareable event cards

The frontend is intentionally designed around the product decisions made for event cards. The current JPDB API registration contract predates those decisions and needs to evolve before real guest checkout is enabled.

## Required public event response

`GET /v1/events/:id` should return a public-safe event representation including the organizer-selected cause already resolved by the backend.

Minimum fields:

```json
{
  "id": "uuid",
  "title": "Basketball Knockout",
  "description": "...",
  "city": "Sherbrooke",
  "venue_name": "Parc local",
  "start_at": "2026-08-29T14:00:00-04:00",
  "entry_fee": 10,
  "currency": "CAD",
  "capacity": 20,
  "registration_count": 12,
  "public_slug": "basketball-knockout-x72f",
  "public_url": "https://playingforgood.ca/e/basketball-knockout-x72f",
  "cause": {
    "id": "uuid",
    "name": "Maison des jeunes XYZ",
    "description": "...",
    "logo_url": null
  }
}
```

The cause is selected/created by the organizer when creating the event. It must not be selected by the participant during registration.

## Guest-first registration

The social/QR registration path must not require an existing account before registration/payment.

The backend should accept the event plus participant identity fields, then atomically:

1. validate that the event is open for registration;
2. use the event's own `cause_id`;
3. find an existing player by normalized verified identity (initially email, with collision safeguards) or create a minimal player record;
4. create the event registration linked to that player;
5. return the registration/payment next step;
6. allow the player to activate/claim the account later and continue completing the profile on the main site.

Suggested public endpoint shape (final naming may differ):

```text
POST /v1/public/events/:eventId/registrations
```

Example body:

```json
{
  "firstName": "Julie",
  "lastName": "Tremblay",
  "email": "julie@example.com",
  "phone": "+15145551234",
  "city": "Sherbrooke",
  "ageGroup": "18+",
  "waiverAccepted": true,
  "source": "shareable_event_card"
}
```

Do not accept `causeId` from this public form.

## Minors

`ageGroup = under-18` must branch into a guardian/parental-consent flow before participation is considered confirmed.

## Security

- Do not expose Supabase service-role credentials to the card app.
- Keep writes behind the JPDB API.
- Add abuse/rate-limit protections for public guest registration.
- Do not expose email, phone, DOB/age details, payment data, or non-public profile fields in public event/card responses.
- Prevent duplicate registration for the same player/event.
- After registrations/payments exist, changing the event cause should require an explicit protected workflow.
