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

## QR registration URL

Each rendered card creates its QR code locally in the React app. No external QR service is required.

The QR points to the event's public URL with a stable registration intent marker:

```text
https://PUBLIC_EVENT_URL?register=1
```

If the API eventually returns an explicit `registrationUrl`, the frontend will prefer that value. Otherwise it derives the URL from the public event URL. Once guest registration is enabled, opening a single-event card with `register=1` opens the registration panel automatically. This keeps QR codes stable and shareable while the write endpoint remains independently feature-gated.

## Guest-first registration

The QR/social registration path must not require login before registration/payment.

The frontend contract is:

```text
POST /v1/calendar/events/:eventId/registrations
```

Example adult body:

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

Example minor fields are carried inside the same `participant` object:

```json
{
  "age_group": "under-18",
  "guardian_name": "Parent ou tuteur",
  "guardian_email": "guardian@example.com",
  "guardian_phone": "+15145550000",
  "guardian_consent": true
}
```

The backend must derive `competitionId` and the cause from the event. The client must not send either value.

The backend should:

1. validate that the event is published, scheduled, and open for registration;
2. derive the event's linked competition and organizer-selected cause;
3. normalize the participant email and find one unambiguous existing player or create a minimal private player record;
4. keep a newly created/matched player private by default; registration must not opt the player into the public directory;
5. ensure that private player is linked to the canonical Supabase/Auth platform user used to own registrations;
6. create the canonical registration with that `user_id`, the event-derived competition and the event-derived cause;
7. reject duplicate registration for the same canonical user/competition and enforce capacity atomically at persistence time;
8. return only a public-safe registration summary plus, when checkout is immediately available, a short-lived guest capability/token scoped to that registration;
9. allow the player to claim/activate and complete the already-linked account/profile later through the normal JPDB/Wix account flow.

This ownership model is not hypothetical: the existing Wix registration path already links `players.supabase_user_id` to a Supabase/Auth user, creates that Auth user with `email_confirm: false` when necessary, grants the participant role, and writes canonical registrations by `user_id`. Guest registration should reuse that same identity bridge instead of introducing a second ownership model.

The frontend tells the participant that their email is used to create or match this private player record. A guest registration is not consent to publish a profile.

The deployed `players` table is still not fully represented by checked-in migrations, so the exact minimal-player insert must not be guessed. Run `supabase/diagnostics/guest_registration_schema.sql` against the real JPDB Supabase project before implementing that persistence port or any schema migration. Do not create a parallel guest-registration table.

## Checkout handoff

The existing `/v1/registrations/:id/checkout` route is an authenticated participant route. A public card must **not** call it with a bare registration id.

A guest registration response may safely hand off payment in one of two ways:

- return an immediate backend-created hosted `checkoutUrl`; or
- return a short-lived guest capability/token scoped to the new registration, which the API explicitly accepts for guest checkout.

If neither is present, the card treats the registration as received and does not attempt an authenticated checkout request. This prevents a public registration id from accidentally becoming an authorization mechanism.

## Minors

`age_group = under-18` branches into a guardian/parental-consent flow. Guardian identity/contact fields and affirmative guardian consent are required before the frontend can submit. Backend validation must enforce the same rule; client-side `required` fields are not a security boundary.

## Security

- Never expose a Supabase service-role credential to the browser.
- Keep all writes behind the JPDB API.
- Rate-limit and abuse-protect public guest registration.
- Do not expose email, phone, age details, guardian details, payment data, internal player IDs, canonical Auth user IDs, or private profile fields in public card responses.
- Do not reveal whether an anonymous email matched an existing player/account; collision and duplicate details should collapse to a generic public conflict response.
- A guest checkout capability must be scoped to one registration, short lived, unguessable, and revocable/consumable; it must not become a general player credential.
- Player matching by email must handle collisions/duplicates explicitly rather than attaching a registration to an arbitrary row.
- After registrations/payments exist, changing an event cause should require an explicit protected workflow.
