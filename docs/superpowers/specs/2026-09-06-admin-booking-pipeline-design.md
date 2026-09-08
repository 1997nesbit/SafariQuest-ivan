# Admin Booking Pipeline & Quoting

Date: 2026-09-06
Status: Approved

## Purpose

Give the existing admin booking-pipeline UI (`AdminBookingsPipeline.tsx`,
`AdminBookingDetail.tsx`, currently reading `website/src/data/adminBookings.ts`)
a real Django backend, so a raw inquiry can be tracked, quoted, guided, and
confirmed against persisted data instead of a static sample array. Covers
inquiry intake/kanban listing, the quote builder, stage progression, and
guide assignment (spec sections 2.1-2.4).

## Non-goals

- Wiring the public inquiry form or `Checkout.tsx` to actually create
  `Booking` records. Neither currently POSTs anywhere; that remains future
  work. For this pass, bookings are created via Django admin or a seed
  script for local testing/demo purposes.
- Real payment processing. "Deposit Paid" is a manually-triggered admin/ops
  action, not a payment-gateway webhook.
- Scheduled/cron automation for "trip end date passes" → Completed, or a
  guide's status auto-switching to "On Trip". Both become manual actions an
  admin/ops user performs; automating them requires job-scheduling
  infrastructure this repo doesn't have yet.
- Invoicing (`AdminInvoices.tsx`, `AdminInvoiceDocument.tsx`) — the "Generate
  & Send Invoice" button on `AdminBookingDetail.tsx` stays a no-op/navigation
  link, unrelated to this pipeline's stage machine.
- Client 360 (`AdminCustomerDetail.tsx`) — the "View Client 360" link stays
  as-is; that page's own backend is separate work.

## Data model (`backend/bookings/`, new Django app)

**`Booking`**
- `customer` — FK → `accounts.User` (expected role `tourist`).
- `safari` — FK → `safaris.SafariPackage`. Region and package title are
  derived from this at read time (`safari.destination`, `safari.title`),
  not duplicated onto `Booking`.
- `stage` — `CharField` with choices `new_inquiry | quoted | deposit_paid |
  confirmed | completed`, default `new_inquiry`. `STAGE_ORDER` is a module
  constant giving the fixed forward sequence.
- `start_date`, `end_date` — `DateField`. Replace the prototype's
  `dateRange` display string; the frontend formats the human string from
  these.
- `guests` — `PositiveIntegerField`.
- `assigned_guide` — FK → `guides.Guide`, `null=True, blank=True`.
- `message` — `TextField`, the guest's original inquiry text.
- `created_at` — `DateTimeField(auto_now_add=True)`.

**`QuoteLineItem`** — FK `booking` (`related_name="line_items"`), `label`
(CharField), `cost` (`PositiveIntegerField`), `markup_percent`
(`PositiveIntegerField`), `order` (`PositiveIntegerField`, for stable
display ordering). Quote price per line = `cost * (1 + markup_percent/100)`;
the booking subtotal is computed on read, never stored.

**`BookingNote`** — FK `booking` (`related_name="notes"`), `author` — FK →
`accounts.User`, `text` (`TextField`), `created_at` (`auto_now_add=True`).

## Permissions

New `IsBookingStaffRole` in `accounts/permissions.py`, following the
existing `IsAdminRole` pattern: authenticated and `request.user.role in
("sales", "operations", "admin")`. Applied to every endpoint below —
matches the spec's `INITIATOR: Sales Agent, Operations, Administrator`.

## Stage transition rules

Enforced server-side (in the serializer's `validate_stage`), not just in
the UI:

- A `stage` change must move exactly one step forward in `STAGE_ORDER`
  relative to the booking's current stage. No skipping, no going backward.
- Setting `stage` to `quoted` is rejected on the generic update endpoint —
  it's only reachable through the dedicated send-quote action (below),
  because that action must also dispatch the customer email atomically with
  the stage change.
- `deposit_paid`, `confirmed`, and `completed` are all set the same way: a
  plain `PATCH` to the booking with `{"stage": "..."}`. This covers 2.3's
  three trigger rows uniformly — the two nominally "System" rows (deposit
  paid, trip end date passes) become an admin/ops user clicking a "Mark
  Deposit Paid" / "Mark Completed" button, since no payment or scheduling
  system exists to trigger them automatically (see Non-goals).

## Endpoints (all under `IsBookingStaffRole`)

| Method & path | Purpose |
|---|---|
| `GET /api/bookings/?stage=&region=&guide=` | List for the kanban. `stage` filters on the `stage` field; `region` filters on `safari__destination`; `guide` accepts a guide id or the literal `unassigned` (`assigned_guide__isnull=True`). |
| `GET /api/bookings/{id}/` | Full detail: booking fields + nested `line_items` + nested `notes`, plus a computed `subtotal`. |
| `PATCH /api/bookings/{id}/` | Partial update for `assigned_guide` (2.4) and/or `stage` (2.3, subject to the rules above). Both fields optional per request; either or both may be sent. |
| `PATCH /api/bookings/{id}/quote/` | Replace the full line-item set for the booking (delete-and-recreate, same pattern as `safaris.SafariPackageSerializer`'s itinerary handling). Response includes the recomputed `subtotal`. |
| `POST /api/bookings/{id}/notes/` | Add an internal note; `author` is set from `request.user`, not client input. |
| `POST /api/bookings/{id}/quote/send/` | Validates the booking has at least one line item, sets `stage="quoted"`, and sends an email to `customer.email` via `django.core.mail.send_mail` (same call pattern as `UserInviteView.perform_create`). Rejects if the booking isn't currently in a pre-quote stage. |

## Frontend

**`website/src/api/bookings.ts`** (new, mirrors `guides.ts`/`pricing.ts`):
typed `Booking`, `QuoteLineItem`, `BookingNote` interfaces in camelCase;
snake_case↔camelCase mapping functions; `getBookings(filters)`,
`getBooking(id)`, `updateBooking(id, {assignedGuide?, stage?})`,
`updateQuote(id, lineItems)`, `sendQuote(id)`, `addNote(id, text)`.

**`AdminBookingsPipeline.tsx`**: swap the static `adminBookings` import for
`useFetch(() => getBookings({region, guide: guideFilter}), [region,
guideFilter])`, following `AdminStaffGuides.tsx`'s loading/error pattern.
Server-side filtering replaces the current client-side `.filter()`.

**`AdminBookingDetail.tsx`**: `useFetch(() => getBooking(id), [id])` for the
booking. Quote Builder's "Save Draft" calls `updateQuote`; "Send Final
Quote" calls `sendQuote` then `refetch()`. "Post Note" calls `addNote` then
`refetch()` and clears the textarea. A new guide-assignment control (select
from `getGuides()`, filtered to `Available`, per 2.4) calls `updateBooking`
with `assignedGuide`. New "Mark Deposit Paid" / "Mark Confirmed" / "Mark
Completed" buttons appear contextually based on current stage and call
`updateBooking` with the next `stage`.

**`website/src/data/adminBookings.ts`** is deleted once both pages no
longer import it.

## Testing

Backend: Django test modules under `backend/bookings/tests/`, following the
existing per-concern-file convention (`test_*.py` per endpoint/behavior,
seen in `accounts/tests/`) — list/filter, detail, quote update + subtotal
math, quote send (stage change + email + rejection when already quoted),
notes, guide assignment, and stage-transition validation (reject skip,
reject backward, reject direct-to-quoted).

Frontend: no test framework exists in this repo (noted as a gap in the
prior wiring spec too); verification is manual, in-browser, against the
running Django dev server.
