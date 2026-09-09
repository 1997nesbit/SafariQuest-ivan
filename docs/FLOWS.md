# SafariQuest — Business & Product Flows

This is the source-of-truth narrative for how the business model works and
how a customer moves through the product. It's written from the owner's
own description of the business, updated as that description evolves.
Where the current codebase doesn't yet match a described flow, that's
called out explicitly under **Current implementation** — this document
records intent first, build status second.

See `README.md` for the technical architecture (models, routes, deploys);
this file is about *why* it's shaped that way.

## The two product surfaces

There are two distinct ways a customer engages with SafariQuest, and both
are built on the same underlying region → park hierarchy:

1. **Safari packages** — a priced, multi-day itinerary that can span
   destinations across *different* regions.
2. **Region experiences** — smaller, region-specific bookable activities,
   scoped to a single region's parks/places.

### 1. Safari packages (cross-region)

- A safari can contain destinations pulled from multiple different
  regions — it isn't confined to one area of Tanzania. A single package
  might combine a Serengeti/Ngorongoro circuit (Arusha region) with a
  beach extension (Zanzibar region).
- Each safari has a price the customer pays up front to attend.
- Admin creates and curates these packages.

**Current implementation:** `SafariPackage` (backend `safaris` app) has a
many-to-many `parks` field, so one safari legitimately spans parks across
multiple `Destination` (region) records — this matches the description
directly. See `backend/README.md`'s "Region → Park → Safari" section for
the model details.

### 2. Region experiences ("mini safaris")

- Each region (Arusha, Zanzibar, etc.) has its own parks/places with
  activities or experiences specific to that region.
- These are described as effectively **mini safaris created specifically
  for that region** — smaller, local, region-bound bookable products,
  distinct from the cross-region safari packages above. A customer
  browsing Arusha sees Arusha's own experiences and pays to attend just
  those, without needing to book a full multi-region package.

**Current implementation — gap:** today, a `Park` (backend
`destinations` app) carries descriptive content (about, wildlife, badge,
highlight) and `DestinationExperience` is a simple named-activity blurb
with no price or booking flow of its own. The trip planner and
`DestinationDetail` page currently surface region-scoped experiences by
filtering the *existing* `SafariPackage` list down to whichever ones touch
a park in that region (`safari.parks`), rather than through a dedicated
"mini safari" bookable product tied directly to a park. If the intent is
for a region's parks to have their *own* priced, independently-bookable
experiences (not just a filtered view of full safari packages), that's a
new booking construct to design — flag before building.

## Customer flow

1. Customer browses either a **region** (sees its parks/experiences) or
   the **safari packages** list (sees cross-region itineraries).
2. Customer selects and pays for either a safari package or a region
   experience.
3. Once paid/booked, the customer has an **account portal** where they can
   track the progress of that safari or region experience over the course
   of the trip.
4. Progress tracking works by the customer marking off, place by place,
   which stops on the itinerary they've actually attended.

**Current implementation — gap:** the account portal's trip-progress view
(`website/src/pages/account/TripProgress.tsx`) exists and renders a
milestone timeline (completed / current / upcoming), but it is currently
**read-only for the customer** — milestones are marked complete by the
*guide* (`pages/guide/GuideUpdateProgress.tsx`, via `markCurrentComplete`),
not self-reported by the tourist. The description above says the customer
"has to manually take[mark] the places that they have attended," which
implies customer-side write access to their own trip's progress. That's
not built yet — worth a decision on whether progress should be
guide-confirmed (current), customer-self-reported (as described), or
both (e.g. customer marks it, guide confirms it), before implementing.
Both `TripProgress` and `GuideUpdateProgress` still run on local mock
data (`src/data/myTrips.ts`, `src/data/guideTrips.ts`), not the live
`bookings` API, so this whole area is still pre-wiring regardless.

## Open questions from this pass

Captured here rather than decided unilaterally — resolve before building:

- Should region experiences ("mini safaris") become their own priced,
  bookable model distinct from `SafariPackage`, or stay as a filtered
  view over existing safari packages that happen to touch that region's
  parks?
- Who has write access to trip progress — customer, guide, or both? If
  both, does one confirm the other, or are they independent?
- Once decided, trip progress needs to move off `src/data/myTrips.ts` /
  `guideTrips.ts` mock data and onto the real `bookings` API (see
  `backend/README.md`'s booking pipeline section for the existing
  `Booking.stage` model this would presumably extend or parallel).

## Changelog

- **2026-09-10** — Initial document, transcribed from a verbal walkthrough
  of the business model: safari packages spanning multiple regions with
  up-front pricing; region-scoped "mini safari" experiences; a customer
  account portal for tracking trip progress by marking attended places.
  Cross-referenced against the current codebase and flagged two gaps
  (region experiences aren't a distinct bookable model yet; trip progress
  is guide-written, not customer-written, and both sides are still on
  mock data).
