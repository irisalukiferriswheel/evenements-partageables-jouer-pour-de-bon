# Backend requirements for shareable event cards

The event-card frontend consumes the shared JPDB API. It must not talk directly to Supabase or invent a second event, cause, player, or registration model.

## Public event response

The existing public-safe detail route is:

```text
GET /v1/calendar/events/:eventId
```

The card expects the organizer-selected cause to be resolved by the backend and returned with the event. The API may temporarily resolve the existing `events.cause_name` against an approved cause record, but the durable model should persist the canonical cause id selected by the organizer.

Representative response:

```json
{
  "data": {
    "id": "uuid",
    "competitionId": "uuid",
    "title": "Basketball Knockout",
    "description": "...",
    "city": "Sherbrooke",
    "venue": "Parc local",
    "startAt": "2026-08-29T18:00:00.000Z",
    "feeAmount": 10,
    "feeCurrency": "CAD",
    "maxParticipants": 20,
    "reservedCount": 12,
    "spotsLeft": 8,
    "registrationOpen": true,
    "cause": {
      "id": "uuid",
      "name": "Maison des jeunes XYZ",
      "description": "...",
      "websiteUrl": null,
      "canonical": true
    }
  }
}
```

The cause is chosen by the organizer. It must never be chosen or replaced by the participant during card registration.

## Guest-first registration

The QR/social registration path must not require login before registration/payment.

The frontend contract is:

```text
POST /v1/calendar/events/:eventId/registrations
```

Example body:

```json
{
  "participant": {
    "first_name": "Julie",
    "last_name": "Tremblay",
    "email": "julie@example.com",
    "phone": "+15145551234",
    "city": "Sherbrooke",
    "age_group": "18+",
    "waiver_accepted": true
  },
  "source": "shareable_event_card"
}
```

The backend must derive `competitionId` and the cause from the event. The client must not send either value.

The backend should atomically:

1. validate that the event is published, scheduled, and open for registration;
2. derive the event's linked competition and organizer-selected cause;
3. normalize the participant email and find one unambiguous existing player or create a minimal private player record;
4. create the registration linked to that player;
5. reject duplicate registration for the same player/event;
6. return the registration plus a short-lived guest capability/token for the immediate checkout flow;
7. allow the player to claim/activate the profile later through the normal JPDB/Wix account flow.

The current canonical `registrations` table requires an Auth `user_id`, while the deployed `players` table is not yet fully represented by checked-in migrations. Do not implement guest registration by creating a parallel guest-registration table. First run the existing player-schema diagnostic against the real Supabase project, then evolve the canonical registration/player relationship with a migration.

## Minors

`age_group = under-18` must branch into a guardian/parental-consent flow before participation is considered confirmed.

## Security

- Never expose a Supabase service-role credential to the browser.
- Keep all writes behind the JPDB API.
- Rate-limit and abuse-protect public guest registration.
- Do not expose email, phone, age details, payment data, or private profile fields in public card responses.
- A guest checkout capability must be scoped to one registration, short lived, unguessable, and revocable/consumable; it must not become a general player credential.
- After registrations/payments exist, changing an event cause should require an explicit protected workflow.
