# Changelog

All notable changes to SafariQuest (Pande Wilderness Safari) are recorded
here, newest first. This is a monorepo — `backend/` (Django REST API) and
`website/` (React/Vite SPA) are deployed as two separate Railway services;
entries below note which side(s) each change touched.

See `backend/README.md` and `website/README.md` for the current-state
architecture overview; this file is the story of how it got there.

## 2026-09-27 — Confirm-password and a show/hide toggle on every password form

Every form in the app that sets a password now has a confirm field and a
show/hide toggle. Before this, the pattern existed only on `SignIn.tsx`'s
Sign In tab (a local, hand-rolled toggle, copy-pasted nowhere else) and
nowhere had a confirm field at all — including the Sign Up tab on that same
page, which used a bare, uncontrolled `<input type="password">`.

- New shared `components/PasswordInput.tsx`: the toggle, plus an optional
  `customValidity` prop that feeds the browser's native form validation — a
  non-empty message blocks submit without the parent page wiring anything
  up, which is what a live "passwords don't match" check needs.
- Applied to `AccountFields.tsx` (shared by Checkout and the Trip Curator),
  `ReferralSignup.tsx`, `SetPassword.tsx` (replacing its own local toggle
  and gaining a confirm field it never had), and last, the Sign Up tab on
  `SignIn.tsx` — the one form the audit for this found still missing both.
- Added `confirmPassword` / `confirmPasswordPlaceholder` /
  `passwordsDontMatch` to the `auth` locale namespace (all four languages),
  matching the phrasing `booking.account.*` already used elsewhere.
- Frontend only — no backend change.

## 2026-09-26 to 2026-09-27 — Referral agent becomes a profile on a tourist account, not a separate one

Six client-reported issues, the largest being that a customer who wanted to
refer friends had to register an entirely separate account to do it — the
same person, two logins, two sets of trips-vs-codes they could never see
together. `referral_agent` was a `User.role` value, mutually exclusive with
`tourist`.

**Backend (`accounts`, `referrals`, `bookings`)**
- `referral_agent` is gone from `User.ROLE_CHOICES`; being an agent is now
  `User.is_referral_agent`, a flag any `tourist` account can carry. A data
  migration (`accounts/0004_referral_agent_profile.py`) moves every existing
  `referral_agent` to `role="tourist"` with the flag set, keeping their
  login and codes intact; reversible, though a tourist who'd since also
  booked a trip loses that on the way back down (the old model had no way
  to express both).
- New `POST /api/referrals/agents/activate/` — turns the flag on for the
  signed-in tourist, idempotent, 403 for staff/guide accounts. Alongside
  the existing `POST /api/referrals/agents/register/` (now creates a
  tourist with the flag pre-set, for someone with no account yet).
- Login/register/set-password responses changed from `{"role": "..."}` to
  including `home` (`User.home_path`) directly — role alone no longer
  determines landing page: an agent who has never booked (a hotel, a
  travel agent — someone who joined only to refer) lands on `/agent`; an
  agent who also has trips lands on `/account` and switches over from
  there, since seeing their own trips first is more useful.
  `AuthContext`'s `login`/`register`/`setPassword` now resolve to that
  path instead of a bare role; `useRoleHomeNavigate` became
  `useHomeNavigate`.
- Booking creation now excludes the agent's own code from working on their
  own booking (`.exclude(agent=request.user)`) — a backstop alongside the
  validate endpoint, now that the same login can book *and* hold codes.

**Frontend**
- `AgentDashboard.tsx` gained a "My Trips" link into the (localized)
  tourist account area — the same login now has both.
- `BookingConfirmed.tsx`: a "Refer & Earn" card inviting a traveller who
  just booked to become an agent in one click (`activateReferralAgent()`),
  right when they're most enthusiastic — no new account, no new login.
- `AdminCustomers.tsx` gained Travellers/Agents filter tabs. Agents who
  joined to refer, not to travel, would otherwise inflate the "new
  customers with no bookings" outreach list and drag down the repeat rate.
- `ReferralCodeField.tsx` (checkout) now shows the live discount rate and
  mentions, in one line, that the traveller can get their own code.

**Referral code lifetime — a direct client complaint**
- The default was 3 days. An agent who shares a code once (a flyer, a
  screenshot in someone's gallery) needs it to still work weeks or months
  later, not just within the first few days. Default raised to 180 days;
  an admin can set anywhere from 1 day to 2 years
  (`MIN_CODE_EXPIRY_DAYS`/`MAX_CODE_EXPIRY_DAYS`, enforced server-side).
  `AdminReferrals.tsx`'s settings form gained the field — it wasn't
  editable from the UI at all before.
- `referrals/migrations/0002_longer_code_expiry.py` also re-dates every
  *unused* code already issued under the old 3-day default, counted from
  when it was originally created — an agent holding an old screenshot
  isn't left with a code that already lapsed before this shipped.
- Shown on the signup page itself: "Each code stays valid for 6 months."

**Other fixes in this batch**
- `DestinationDetail.tsx`: the Experiences section only rendered when a
  region had *no* parks, so a region with both (e.g. Arusha) silently
  never showed its experiences. Both sections now render independently,
  each gated on having content rather than on the other being absent.
- Footer gained an optional secondary contact (name/phone/email, all
  `VITE_CONTACT_SECONDARY_*`) and a "Refer & Earn" link.
- Header nav was already cleaned up in an earlier pass — see the 2026-09-17
  entry below.

## 2026-09-26 — About-page team moves to the database, with per-language text

The "Meet the Experts" section was three people hardcoded in `About.tsx`
(names and photos) and the four locale files (titles, bios, photo
descriptions), so changing anyone meant a code change and a deploy. It now
reads from the backend and is editable from the admin.

**Backend**
- New `team` app: `TeamMember` (name, title, bio, photo URL, photo alt text,
  display order, published flag) with a `translations` JSON field for
  French, German and Portuguese. English stays in the plain fields and is the
  fallback. Public `GET /api/team/` (published only), admin write.
- Chosen over reusing `guides.Guide` because that's the operational roster —
  ratings, availability, a login account — and includes people who aren't
  public-facing; two of the three people on the page (a guest experience
  director, an itinerary planner) aren't guides at all.
- Translations are validated on save (known languages and fields only, text
  only) and empty entries are dropped, so a missing translation is always the
  absence of a key. Unknown languages are rejected loudly rather than
  silently dropped.
- Drafts are hidden from the public list even for a logged-in admin, so
  previewing the About page shows what visitors see; the content manager asks
  for `?all=true`.
- `seed_team` carries over the original three members with all four
  languages' existing text, and never overwrites a member that already exists.
- Field limits enforced server-side: bio capped at 2,000 characters, the same
  caps applied to every translated title/bio/photo description (translations
  used to be unbounded), and photo URLs restricted to http/https.
- **Image uploads now check the file itself, not the browser's claim.**
  `ImageUploadView` trusted the request's Content-Type, so an HTML or SVG file
  renamed `.png` was accepted and, with the bucket public-read, served back
  from our own storage. It now reads the file's leading bytes (JPEG, PNG, GIF,
  WebP) and stores it under the extension that matches. This applies to every
  admin image upload — safaris and destinations as well as team photos.
- Fixed local uploads failing with `Could not find config for 'default' in
  settings.STORAGES`: `STORAGES` only gained a `default` when a bucket was
  configured, and Django 5.1+ no longer supplies one, so an environment without
  a bucket (local dev) had no file storage at all. Local disk is now declared
  explicitly. Production, which always has a bucket, was never affected.

**Frontend**
- `About.tsx` fetches the team and picks the text for the current site
  language, falling back to English field by field. With no published
  members the section hides instead of showing a heading over nothing; a
  member with no photo gets an initials avatar.
- Admin: new **Team** tab in the Content Manager, and an add/edit form with
  one tab per language (a dot shows which have text) and photo upload
  through the existing image uploader.
- Removed the now-unused `team.members` keys from the four `about.json`
  locale files; the section heading and subtitle stay there, being UI text.

**Deploying this**
- Railway runs the migration on deploy, but the production table starts
  empty and the About section stays hidden until it has members: run
  `python manage.py seed_team` there (or add people in the admin).
- The seeded photos are the design-mockup placeholder URLs the page shipped
  with; replace them with real uploads. Photos uploaded through a local
  admin point at `localhost`, so upload them through the production admin.

## 2026-09-17 — Unified header dashboard, a sign-in/out audit, and paying off the remaining balance

**Sign-in/out audit, at the user's request**
- Audited sign-in/out end to end across all four roles (tourist, guide,
  admin, referral agent). Found two real bugs, both stemming from the same
  root cause: a fourth role (`referral_agent`, added the day before) wasn't
  propagated everywhere a role→redirect mapping lived.
- `SignIn.tsx` kept its own local, duplicate `ROLE_HOME` map (missing
  `referral_agent`) instead of importing the canonical one from
  `api/auth.ts` — an agent signing in through the generic `/sign-in` page
  (rather than staying on `/become-agent`, which redirects correctly) was
  misrouted to `/account`, a dead end for their role. Deduplicated onto the
  shared map.
- `/account` had no role gate at all — any authenticated role landing there
  (via the bug above, or a stale bookmark) saw silently empty "My
  Trips"/"Invoices" panels (both scoped server-side to
  `customer=request.user`) with no indication why. `AccountLayout` now
  redirects any non-tourist role to their real dashboard.

**Header: unified Dashboard + Sign Out**
- Previously each role got different header treatment: admin and guide had
  small icon-only links (`ShieldCheck`→`/admin`, `Binoculars`→`/guide`)
  next to a generic sign-out icon; tourist and referral agent had no
  dashboard link at all beyond that same generic icon. All four roles now
  get one pattern once signed in: a labeled **Dashboard** button (routes
  via the shared `ROLE_HOME` map) plus a separate **Sign Out** button, on
  both desktop and mobile.

**Pay the remaining balance, without re-authenticating**
- `Invoice` gained `trip_total` (captured from the checkout page's own
  price computation at deposit time — the same trust boundary the deposit
  `amount` already crosses, since `Booking` has never stored a price of its
  own) and a computed `remaining_balance` property.
- New `POST /api/bookings/{id}/pay-balance/` pays off whatever's left on a
  booking's invoice — unlike the deposit, the amount here is computed
  server-side (`trip_total - amount`), never trusted from the client, since
  there's nothing left to negotiate. Advances the booking to `confirmed`,
  emails a confirmation, logs the action.
- `MyTrips.tsx` shows a "Pay Remaining Balance" button directly on any trip
  that has one outstanding — it's just another authenticated request on the
  same cookie session, so the tourist never re-enters credentials or card
  details.
- Both checkout flows (`Checkout.tsx`, `PlanPayment.tsx`) now always send
  `trip_total` alongside the deposit `amount`, not only when a referral
  code happens to be present (previously the only reason it was ever sent).

## 2026-09-14 — Referral agent program

> **Superseded 2026-09-26/27** — `referral_agent` here is a `User.role`
> value, a separate account from a tourist's. It was replaced with
> `User.is_referral_agent`, a flag any tourist account can carry, and the
> default code lifetime (3 days below) was raised to 180. See the
> 2026-09-26 → 2026-09-27 entry above. The rest of this entry (the model,
> the commission/discount mechanics, redemption) is still accurate.

A field-sales referral system: an agent signs up, generates single-use
referral codes for prospects, and earns a commission when a code converts
into a paid booking. Discount and commission percentages are
admin-editable (defaults 2% / 5%), not hardcoded.

**New `referrals` Django app**
- `ReferralSettings` — a singleton row (`get_solo()`) holding the
  admin-editable discount % and commission %, plus how many days an unused
  code stays valid (default 3).
- `ReferralCode` — `agent` FK, an 8-character code (unambiguous alphabet —
  no `0`/`O`/`1`/`I` — via `secrets.choice`, collision-checked), optional
  `contact_name`, `expires_at` (set from `ReferralSettings.code_expiry_days`
  at creation), `is_used`. `status` (`active`/`used`/`expired`) is a
  computed property rather than a stored/cron-maintained field — checked
  lazily wherever a code is read or redeemed.
- `ReferralRedemption` — one per booking, snapshotting the discount/
  commission rates in effect at redemption time (so a later admin rate
  change can't retroactively alter what's already owed), the trip total,
  and a `commission_status` (`pending`/`paid`) an admin flips manually once
  payout happens, matching "paid out once the customer's trip is complete."
- A new `User.ROLE_REFERRAL_AGENT` — fully self-serve signup
  (`POST /api/referrals/agents/register/`, no admin approval gate), same
  JWT-cookie sign-in as every other role.
- Redemption happens inside the existing `BookingViewSet.pay` action, not
  at booking creation, so an abandoned checkout never burns a code —
  `ReferralCode.objects.select_for_update().filter(is_used=False)` inside
  the same `transaction.atomic()` block that records the deposit is what
  makes "once one person uses it, others can't" race-safe.

**Frontend**
- `/become-agent` (`ReferralSignup.tsx`) — public self-serve signup.
- `/agent` (`AgentDashboard.tsx`, `RequireRole allow={['referral_agent']}`)
  — generate a code, see all your codes with status badges, and the
  commission owed/paid on each redeemed one.
- A shared `ReferralCodeField` (validate-on-blur) dropped into the payment
  step of both checkout flows — a valid code discounts the deposit live,
  before submit.
- `AdminReferrals.tsx` — a settings card (edit the discount/commission %)
  plus a table of every redemption with a "Mark Paid" action, following the
  same `useFetch` + table + badge pattern as the rest of the admin portal.
- Header nav: pulled "Become a Referral Agent" out of the primary nav
  links (where it read as an oddly long entry crowding three one-word
  items and the "Plan Your Journey" CTA) into its own compact "Refer &
  Earn" pill.

## 2026-09-13 → 2026-09-14 — Booking now requires an account and a (mock) deposit

Tourists could previously "complete" a booking with no account and no
payment — pure inquiry, indistinguishable from a maybe-someday lead. Closed
that gap end to end, for both booking paths, with a mock payment (card
fields never leave the browser; real card processing is still PLANNED).

**Backend**
- New `BookingViewSet.pay` action (`POST /api/bookings/{id}/pay/`) —
  records a mock deposit, creates an `Invoice`, advances the booking to
  `deposit_paid`, emails a confirmation to the account's registered
  address. `InvoiceViewSet.mine` (`GET /api/invoices/mine/`) gives a
  tourist their own payment history.

**Frontend — two checkout flows, one pattern**
- Direct checkout (`Checkout.tsx`, `/safaris/:id/book`) is a single-page
  wizard: details → account (skipped if already signed in) → review →
  payment. The Trip Curator (`PlanReview` → `PlanAccount` → `PlanPayment`)
  is the routed equivalent, sharing `TripPlanContext` state across the
  extra steps.
- Both reuse new shared components rather than duplicating the account/
  payment UI a second time: `AccountFields` (register/sign-in toggle),
  `MockCardFields` (mock card inputs, clearly labeled test mode),
  `SafariLikeDetail` (the detail-page layout both `SafariDetail` and the
  new `RegionSafariDetail` render).
- **Region Safaris get a real checkout for the first time** — previously
  only selectable inside the Trip Curator picker, with no standalone
  detail or booking page at all. Added `RegionSafariDetail.tsx` and
  generalized `Checkout` to take a `kind: 'safari' | 'regionSafari'` prop
  instead of being safari-only.
- Both flows land on one unified `/booking-confirmed` screen; the old,
  separate `/inquiry-received` page is deleted (route, import, and all) —
  a user reported landing on two different confirmation pages depending on
  which flow they used, and explicitly asked for one.

**Two race-condition bugs found and fixed along the way**
- `PlanReview.tsx` evaluated its "select an experience" validation before
  its `getSafaris()`/`getRegionSafaris()` fetches had resolved — on a slow
  connection, a user who *had* selected a region safari briefly saw
  "Select at least one experience before continuing." Fixed by gating the
  check on a combined `loading` flag from all three fetches involved.
- `PlanPayment.tsx` had the same class of bug one step further down: its
  redirect guard checked `primaryPrice === undefined` before its own
  fetches resolved, immediately bouncing back to `/plan/review` — which
  looked to the user like the page "just reloading and doing nothing" on
  clicking Continue.

**A third bug, surfaced by the new referral role**
- Signing in as a non-tourist account (first hit via the new referral-agent
  role, but latent for guide/admin too) and then trying to check out
  produced a raw Django 404 ("No Booking matches the given query.") instead
  of a real error: `BookingCreateSerializer` blindly attributed the
  booking to whichever authenticated account was signed in regardless of
  role, while `BookingViewSet.get_queryset()` only ever scopes bookings to
  `tourist`/`guide`/`admin` — so a non-tourist-owned booking became
  invisible to the `pay` endpoint's lookup. Fixed at the source:
  `BookingCreateSerializer.validate()` now rejects checkout from any
  signed-in non-tourist account with a clear message, and both
  `Checkout.tsx`/`PlanReview.tsx` show a friendly "Sign In Required" screen
  (with a Sign Out button) the moment a wrong-role account lands on
  checkout, instead of letting them fill out the whole form first.

## 2026-09-13 — Trip Curator hand-off, a lost error message, and the Invoice document redesign

**Destination → Trip Curator hand-off**
- "Start Planning" on a Destination Detail page used to drop the visitor on
  the generic `/plan` region picker — even though they'd just picked a
  region. It now links straight to `/plan/experiences?region=<id>`;
  `TripPlanContext` pre-selects that region (same `?param=` hand-off pattern
  already used for the About page's `?interest=`), and `PlanExperiences`
  auto-selects every real experience (safaris and region safaris alike) for
  that region once, so the visitor starts on a fully pre-filled experiences
  step instead of an empty picker for a region they've already committed to.
  Guarded by a ref rather than a state dependency so it fires exactly once
  and never re-adds something the visitor deliberately deselects.

**Checkout: adults/children are free-form now**
- `Checkout.tsx`'s guest-count fields were `<select>` dropdowns capped at
  "4+ Adults" / "2 Children". Replaced with real number inputs (min 1 / min
  0), so a group of any size can be entered directly instead of being
  forced into an artificial ceiling.

**A validation error that silently became "Bad Request"**
- Booking creation correctly rejects an anonymous inquiry whose email
  already belongs to a real, password-protected account (a deliberate
  security decision from earlier in this project — it must never silently
  attach a new booking to a stranger's real account). But that specific
  `ValidationError({"email": "..."})` is raised from inside
  `BookingCreateSerializer.create()` — the one path that runs *after*
  `is_valid()` already passed, so it skips DRF's automatic
  `as_serializer_error()` list-wrapping and came back as a bare string
  instead of the `{"field": ["message"]}` shape used everywhere else.
  `website/src/lib/api.ts`'s error parser only recognized array-shaped
  field errors, so it silently dropped the message and fell back to a bare
  "Bad Request" — reproduced via `manage.py shell` + `django.test.Client`
  (bypasses the endpoint's `10/hour` throttle) to get the exact 79-byte
  response the user saw. Fixed on both sides: the backend now wraps the
  message in a list like every other validation error, and the frontend
  parser is now defensive against either shape so a future one-off raise
  like this can't silently regress into the same dead end. Added a
  regression test asserting the exact response shape.

**Invoice document redesign**
- Reworked `AdminInvoiceDocument.tsx` against another old Stitch mockup:
  branded header (real address/phone/email from the site's existing
  `VITE_CONTACT_*` config, not invented), a formatted invoice number
  (`INV-{year}-{id}`), and a new **Trip Reference** card (package, dates,
  guest count) — added `start_date`/`end_date`/`guests` to
  `InvoiceDetailSerializer`, sourced straight from the real `booking`, no
  new model fields needed.
- Added a **Payment Schedule** panel (30% deposit / 70% balance) computed
  from the invoice's real `amount` using the exact same 30% figure
  `Checkout.tsx` already quotes at booking time — not a second, disconnected
  number. The balance's due date is shown as "before departure" rather than
  a fabricated specific date, since `Invoice` only tracks one `due_date`
  (the deposit's).
- Did **not** add the mockup's VAT line (same precedent as the Inquiry
  Detail redesign) or fabricate bank/SWIFT account details for the payment
  instructions footer — that text now says details are shared directly by
  the safari consultant, consistent with how guide account credentials are
  already handled off-system elsewhere in this project.

## 2026-09-13 — Inquiry Detail & Quote Builder redesign, and a pricing model change

Reworked the admin Inquiry Detail page against an old Stitch-generated design
mockup, and simplified quote line-item pricing.

**Quote line items: cost+markup% → quantity × unit price**
- `QuoteLineItem` used to store an internal `cost` and a `markup_percent`
  and compute the customer-facing `quote_price` from both. Replaced with a
  `quantity` field (new) and a direct `unit_price` (renamed from `cost`;
  `markup_percent` removed), so `quote_price = quantity × unit_price` — the
  admin now types what the customer pays per unit, not an internal cost to
  mark up. Migrated via a `RenameField` (not drop+recreate), so existing
  quote amounts on already-quoted bookings were preserved. Updated the
  `QuoteLineItemSerializer`/`QuoteLineItemInputSerializer`, every backend
  test that created a `QuoteLineItem`, and both frontend consumers
  (`AdminBookingDetail`'s quote builder, `AdminInvoiceDocument`'s printable
  invoice).
- This reverses a design decision made and documented earlier in this same
  cleanup pass — the cost+markup% model was kept there specifically to avoid
  regressing "real, tested" functionality when the mockup was first compared
  against the live page. Once asked directly ("why do I have a markup
  column?"), it turned out that split was never a deliberate business
  requirement — it was inherited from how the model happened to get built,
  not from an actual need to track internal cost separately from price.

**Inquiry Detail page (`AdminBookingDetail.tsx`)**
- Replaced the full 5-node stage stepper (new_inquiry → quoted →
  deposit_paid → confirmed → completed) with a compact 3-step visual
  matching the mockup (Inquiry Received → Quote Drafting → Invoiced) —
  purely a presentational remap of the same real `Booking.stage` (invoicing
  happens automatically the moment a quote sends, so "Drafting" and
  "Invoiced" complete together); the underlying 5-stage state machine is
  unchanged everywhere else (Kanban pipeline, tourist trip progress, guide
  portal, analytics) since collapsing it for real would have broken all of
  those.
- Moved the primary call-to-action into the header as **"Generate & Send
  Invoice"** (pre-quote) — it's the existing save-then-send action, just
  relabeled and repositioned to match the mockup's single prominent button;
  removed the now-redundant duplicate "Send Final Quote" button. Post-quote,
  the header falls back to the real stage badge + the correct "Mark X"
  advance action, since that lifecycle (deposit/confirm/complete) still
  needs to happen somewhere.
- Quote table gained a **Qty** column; Submission Details gained **Package**
  and a computed **Duration** (real days between the booking's dates, not
  fabricated); "Guest Message" relabeled to "Special Requests" to match the
  mockup's wording. Did **not** add the mockup's VAT/tax line (explicitly
  out of scope per instruction) or its "Regions of interest"/"Experiences"
  chips (the real `Booking` model ties to exactly one safari/region-safari —
  multi-region/experience detail was a deliberate earlier decision to fold
  into the guest message rather than fabricate fields that don't exist).

## 2026-09-11 → 2026-09-13 — Financial ops, CRM, analytics, RBAC, security hardening, a full rebrand, and an API-layer cleanup

The largest batch since the initial build-out: closed most of the
remaining "PLANNED" gaps in the ops manual, removed the last of the mock
data, hardened the API, and re-themed the whole site to match the real
Pande Wilderness logo.

**Security (backend)**
- CSRF enforcement on every unsafe request: `GET /api/auth/csrf/` hands the
  SPA a token (cookie-based CSRF can't be read cross-origin), verified in
  `CookieJWTAuthentication.enforce_csrf`; `website/src/lib/api.ts` attaches
  `X-CSRFToken` and retries once on a CSRF-shaped 403.
- Scoped rate throttling (`config/settings.py: THROTTLE_RATES`) on login,
  signup, set-password, anonymous booking creation, and funnel-event
  recording, to blunt credential stuffing / spam without a Redis dependency
  yet (counters live in the per-process `LocMemCache` for now).

**Reliability: transactions, query fixes, and config that only breaks in production**
- Six multi-write operations now commit atomically instead of as separate
  saves: booking creation (customer + booking + milestones), sending a quote
  (stage + invoice), editing a quote's line items (delete-then-recreate),
  completing a trip milestone (current + next), submitting a review (review
  + the guide's cached rating), and a guide editing their own name (`Guide`
  + the linked `User`). A crash or a bad redeploy landing mid-sequence used
  to be able to leave things like a booking with no itinerary, or a trip
  permanently stuck with no "current" milestone. Notification email is sent
  *after* each transaction commits — best-effort, and must not hold a
  database connection open for an SMTP round trip.
- `EMAIL_BACKEND` was hardcoded to the console backend in every environment
  — invite, quote-sent, and payment-reminder emails were being silently
  dropped in production. Now derived from `EMAIL_HOST` (`config/mail.py`
  wraps delivery so a bounced email logs an error instead of 500ing a
  request whose writes already committed), and startup refuses to proceed
  with `DEBUG=False` and neither `EMAIL_HOST` nor an explicit `EMAIL_BACKEND`
  set, rather than dropping mail with no signal that anything was wrong.
- Added the HTTPS/proxy settings a Railway deployment needs but didn't have:
  `SECURE_PROXY_SSL_HEADER` (gated on the new `NUM_PROXIES` setting, which
  also fixes rate-limiting reading every visitor's IP as the proxy's),
  `SECURE_SSL_REDIRECT`, and opt-in HSTS.
- `vite.config.ts` now refuses to build without `VITE_API_URL` set, instead
  of silently shipping a bundle hardcoded to `http://localhost:8000` (this
  is what caused the original "Something went wrong" production incident
  documented below — the build-time guard exists so it can't recur).
  `VITE_SOCIAL_*` are optional in practice (empty in `.env`/`.env.example`)
  but were typed as required `string`; the footer rendered three dead
  `href="#"` social links because of it, now gated on the value being
  present the same way `About.tsx` already did.
- Two N+1s and a wrong count, all query-only fixes with no behavior change:
  a guide's rating distribution went from 7 queries to 2 (one `GROUP BY`
  instead of five per-star `.count()` calls); the guide list now
  `prefetch_related`s certifications; the funnel's "confirmed" count was
  filtering on `region_safari__isnull=False`, silently excluding every
  multi-region `SafariPackage` booking from the admin-facing conversion
  metric.
- `User.role` gained named constants (`ROLE_TOURIST`/`ROLE_GUIDE`/
  `ROLE_ADMIN`) — the same idiom `Booking.STAGE_*`/`Invoice.STATUS_*`
  already used, applied to the one model that was still comparing against
  raw `"admin"`/`"guide"`/`"tourist"` string literals in 17 places.

**Financial operations (5.1 / 5.2 / 5.3 of the ops manual)**
- New `Invoice` model (`bookings` app): auto-issued when a quote is sent,
  due 14 days out, `unpaid`/`deposit_paid`/`paid` set manually by Admin
  (no payment gateway), with a computed `overdue` status
  (`InvoiceQuerySet.with_effective_status()`, done in SQL so filtering/
  totals don't load every row into Python).
- `AdminInvoices` (filterable, paginated register), `AdminInvoiceDocument`
  (a real printable A4 invoice via `window.print()`, now with the payment
  status dropdown it was missing — the update endpoint already existed,
  nothing in the UI had ever called it, so every invoice stayed "unpaid"
  forever and Finance's "Total Collected" always read $0), and
  `AdminFinance` (revenue/collections/outstanding stat cards + a
  reminder-email action) replaced their "isn't set up yet" placeholders.
- Seasonal pricing is now actually applied: `Season.multiplier` (already
  existed) is read at checkout (`lib/seasonalPrice.ts`) to price the
  package for the tourist's chosen trip date, instead of sitting unused.

**CRM & Support (7.1 / 7.2)**
- Client Directory / Client 360 (`AdminCustomers` / `AdminCustomerDetail`)
  now surfaces each customer's invoice history, closing the last gap noted
  there.
- New `support` app (`SupportTicket` + `SupportTicketNote`): one real model
  behind three previously-mock screens — the admin Complaints inbox, and
  the tourist/guide "My Complaints" pages (`GET /api/support/tickets/mine/`).

**Region Safaris get an admin editor**
- `RegionSafari` (added earlier, API-only) now has its own Content Manager
  tab and `AdminRegionSafariForm`, instead of only being editable via
  Django admin or a seed command.

**Trip lifecycle & guide profile**
- `TripMilestone` (day-by-day progress, snapshotted from the itinerary at
  booking time) and `Review` (post-trip rating, recomputes the guide's
  cached `rating`) back the tourist Trip Progress and guide Update Progress
  pages for real.
- `Guide` gained `bio`, `languages`, `specialties`, and an ordered
  `GuideCertification` list, editable by the guide themselves
  (`PATCH /api/guides/me/`).

**Analytics & audit (8.1 / 8.2 / 9.2)**
- `AdminAnalytics`'s KPI cards and tables were already real (computed
  client-side from bookings/safaris); added a real conversion **funnel**
  behind them — new `analytics` app (`FunnelEvent`), tracked anonymously per
  browser session at each Trip Curator step
  (`lib/funnelTracking.ts` → `POST /api/analytics/events/`), aggregated at
  `GET /api/analytics/funnel/`.
- New `audit` app (`AuditLogEntry`): an admin-visible trail covering
  admin-user invited/activated/deactivated, a booking's stage changing, a
  quote being sent, an invoice's status changing, a support ticket's status
  changing, and a guide account being created. Backs a new widget on the
  admin Users page.
- `PATCH /api/users/{id}/` (admin-only) can now activate/deactivate an
  existing Administrator account — previously the Users screen could only
  invite, never edit, an account. Still no role picker; each role keeps its
  own dedicated creation flow.

**Pagination**
- Five endpoints that previously returned every matching row, unbounded,
  are now paginated (`config/pagination.py: StandardPagination`, 25/page):
  bookings, invoices, customers, the admin support-ticket inbox, and the
  audit log. `lib/usePaginatedFetch.ts` + `components/admin/Pager.tsx` on
  the frontend for views that browse one page at a time; `apiGetAllPages`
  for the few views (Kanban pipeline, customer stats/search) whose own
  logic needs the complete list regardless.

**Mock data removal**
- Deleted the remaining frontend mock datasets
  (`src/data/{adminComplaints,adminCustomers,adminInvoices,adminStaff,
  destinations,guideReviews,guideTrips,myTrips,safaris}.ts`) now that every
  screen they backed reads live data. Anything still genuinely unbuilt shows
  an explicit "isn't set up yet" empty state instead of fabricated content.

**Rebrand: Pande Wilderness color palette**
- Re-themed the entire site to match the operator's actual logo (a
  heritage-brown safari badge) instead of the placeholder green/orange
  "Savanna Heritage" palette. Since every component already used the
  semantic design tokens in `src/index.css` (`bg-savanna-green`,
  `text-terracotta`, `bg-surface-container-lowest`, …) with zero hardcoded
  Tailwind palette classes anywhere, this was a single-file value swap —
  token names unchanged, every hex redefined to a warm brown/tan/cream
  family. Also updated the one hardcoded hex outside that file (a decorative
  dot pattern) and the browser `theme-color` meta tag.

**Frontend reliability**
- `lib/api.ts` had no request timeout — a hung backend left every caller's
  `loading` state `true` forever, with no error and no way out. Added a
  20s default / 60s for uploads (an 8MB image over a slow connection
  legitimately needs longer than a JSON call), verified against a socket
  that accepts a connection and never responds.
- `parseErrorMessage` read only the first field of a DRF validation error —
  a form with several invalid fields only ever heard about one of them,
  fixed it, resubmitted, and got told about the next. Now reports every
  field; a single-field error (the common case) is worded exactly as
  before.
- Fixed the one pre-existing lint error and two stale `eslint-disable`
  comments (`AdminBookingDetail.tsx`, `GuideProfile.tsx`) — both were an
  editable draft (quote line items; guide bio/availability/name)
  re-syncing from freshly-fetched data inside a `useEffect`, which this
  repo's `react-hooks/set-state-in-effect` rule correctly flags. Rewritten
  to compare against the previous value in state and reset during render
  instead — the same pattern `lib/usePaginatedFetch.ts` already used.
  `eslint .` is clean project-wide for the first time.
- `About.tsx`'s contact form showed "Inquiry sent" and discarded whatever
  was typed — it had never been wired to a backend, and its three fields
  (name/email/interest) can't satisfy `POST /api/bookings/` anyway (no
  dates, guests, or safari). Replaced with a hand-off into the Trip
  Curator (`/plan?interest=...`), which already reaches the real inquiries
  pipeline; the chosen interest survives into the booking's notes.

**API-layer cleanup (frontend)**
- Every `api/*.ts` file had hand-written, near-identical snake_case ↔
  camelCase mapping functions (several files even had two independent copies
  of `mapBooking`/`BookingApiShape`). Extracted a shared
  `lib/caseMap.ts` (`fromApiShape`/`toApiShape`, unit-tested), then rewrote
  all twelve affected API client files on top of it — net effect: less code per file,
  one mapping bug surface instead of twelve, no behavior change (verified live
  across every affected admin/public page after the migration).
- Error-UI audit: `Home.tsx` (signature packages section) and
  `GuideTripDetail.tsx` had no fallback for a failed fetch; both now check
  `error` from `useFetch` like every other page already did.

## 2026-09-09 — Docs, and object storage for uploaded images

**Docs**
- Added a root `README.md` tying `backend/` and `website/` together, and
  rewrote both apps' READMEs to describe the real current architecture
  instead of scaffold boilerplate. Added this file.

**Infra / Backend**
- Uploaded images (via the `uploads` app) were being written to the
  backend container's local disk — ephemeral on Railway, so every
  redeploy would have silently wiped them. Provisioned **MinIO**
  (S3-compatible object storage) as a two-service Railway template
  ("Bucket" + "Console"), created a public-read bucket for media, and
  added `django-storages` so `default_storage` (and therefore
  `ImageUploadView`, unchanged) writes there instead — falls back to
  local disk automatically when `AWS_STORAGE_BUCKET_NAME` is unset (e.g.
  local dev).
- Learned the hard way that this beta version of Railway's IaC engine
  (`.railway/railway.ts`) can't safely represent a service that was
  provisioned from a marketplace template: declaring Bucket/Console to
  "protect" them from being flagged as undeclared resources instead
  produced a plan that deleted the MinIO group and several
  Railway-injected variables Console needs to log in. Reverted that —
  MinIO is managed directly (`railway variable`/dashboard), and the IaC
  file now carries a loud comment plus a documented pre-flight check
  (`railway config plan`, look for a "Delete service Bucket" line) before
  ever running `apply` again.

## 2026-09-08 — Production deployment: backend goes live

The site had a frontend deployed on Railway but no backend at all — every
API call resolved to `http://localhost:8000` in visitors' browsers, so
Destinations/Safaris (and everything else) showed "Something went wrong."

**Infra**
- Provisioned a Django **Backend** service and a managed **Postgres**
  database in the Railway project, via `.railway/railway.ts`
  (Infrastructure-as-Code), sourced from `backend/`.
- Added `gunicorn` (production WSGI server) and `whitenoise` (compressed
  static file serving for `/admin/`) to the backend.
- Added an env-driven `CSRF_TRUSTED_ORIGINS` setting (backend).
- Set `VITE_API_URL` on the frontend service to the new backend's public
  URL and rebuilt (this is baked in at build time, not read at runtime).
- **Bug 1 — healthcheck 400s:** Railway's healthcheck prober sends
  `Host: healthcheck.railway.app`, which Django rejected as a disallowed
  host. Diagnosed by temporarily enabling `django.security`/
  `django.request` console logging and gunicorn's access/error log —
  fixed by adding that host (plus `.railway.internal`, `localhost`,
  `127.0.0.1`) to `ALLOWED_HOSTS`.
- **Bug 2 — "Incorrect email or password" for everyone:** login itself
  returned 200 and set the auth cookie, but the very next request
  (`/api/auth/me/`) came back 401, because the frontend
  (`pandewildernesstravels.com`) and backend (a `*.up.railway.app`
  subdomain) are different domains and the auth cookie was
  `SameSite=Lax` — browsers drop `Lax` cookies on cross-site fetches.
  Fixed with `AUTH_COOKIE_SAMESITE=None` on the backend.
- Seeded the production database (`seed_destinations`, `seed_parks`,
  `seed_safaris`) and created the first production admin user via
  `railway ssh`.

**Backend**
- `feat(backend): production deployment readiness for Railway` — gunicorn,
  whitenoise, `CSRF_TRUSTED_ORIGINS`.
- `debug(backend): log django.security/django.request warnings to console`
  — added temporarily to diagnose the healthcheck 400s above; kept, since
  Django silently swallows these by default with `DEBUG=False`.

## 2026-09-08 — Region → Park → Safari data model, image fixes, portal build-out

A large batch of work syncing local-only progress into the fork and, from
there, upstream.

**Data model change**
- Clarified requirement: a safari can span multiple parks across multiple
  regions; a region contains multiple parks/wonders; tourists pick a
  region and see what's bookable there.
- Added a new `Park` model (`destinations` app) sitting between
  `Destination` (now conceptually "region") and `SafariPackage`.
  `SafariPackage.region` (a single FK) was replaced with
  `SafariPackage.parks` (a many-to-many to `Park`), so one safari can
  legitimately touch several parks in several regions (e.g. "Bush to
  Beach" spans Tarangire, Ngorongoro, Serengeti, and the Zanzibar Beaches
  park).
- Added `seed_parks` management command; updated `seed_safaris` to link
  safaris to parks by slug instead of a single region string.
- Backend: `Park` model/serializer/viewset/admin, `/api/parks/` routes.
- Frontend: `api/parks.ts` client; `AdminParkForm.tsx` + a "Parks" tab in
  `AdminContent.tsx` for admin CRUD; `DestinationDetail.tsx` and the trip
  planner's experience picker rebuilt to show parks-within-a-region and
  the safaris that visit each one.

**Uploads**
- New `uploads` Django app: a single admin-only `ImageUploadView`
  (JPEG/PNG/WEBP/GIF, 8MB max) that all the admin content forms use.
- Frontend `components/admin/ImageDropzone.tsx` + `api/uploads.ts`.

**Full portal build-out** (frontend, matching Stitch-generated mockups)
- Redesigned Home, About, Destinations, Safari/Destination detail pages
  against the original design mockups.
- Built the tourist account portal: My Trips, Trip Progress, Invoices,
  Complaints, Profile.
- Built the guide portal: Trips, Reviews, Support, Update Progress.
- Built the 4-step trip planner (destinations → experiences → details →
  review) with its own `TripPlanContext`/`tripPlanStore`.
- Redesigned the admin portal shell (`AdminLayout`) and added the
  remaining admin pages: Analytics, Customers, Finance, Invoices,
  Complaints.
- Trimmed the public header nav down to Destinations, Safaris, About Us,
  and the "Plan Your Journey" CTA (the rest — Experiences, FAQs links —
  were developer-only scaffolding).

**Image quality pass**
- Found several destination/park/safari images that were leftover test
  uploads or literal screenshots rather than real photos: Zanzibar's
  destination photo had browser chrome baked into it; "Great Migration
  Path" showed a resting lion pride instead of any migration scene (its
  own gallery had the correct river-crossing photo, just not set as the
  cover); "Bush to Beach" was a screenshot of a webpage, title bar
  included; Arusha had four completely unrelated test-upload images; the
  Tarangire & Manyara park image had UI chrome and camera EXIF text
  burned into it.
- Fixed by promoting the correct existing photos where available,
  sourcing one properly-licensed replacement from Wikimedia Commons
  (Zanzibar), and re-running the seed commands to reset anything that had
  drifted from the seed data during earlier admin-panel testing.

**Process note:** this work was synced from the local machine → the
user's fork (`1997nesbit/SafariQuest-ivan`, PR #1 then #2) → upstream
(`SvanteRomero/SafariQuest`, PR #1), since the Railway frontend service
deploys from the upstream repo's `main`.

## 2026-09-06 — Booking pipeline

**Backend**
- `Booking`, `QuoteLineItem`, `BookingNote` models. A booking moves
  through `new_inquiry → quoted → deposit_paid → confirmed → completed`
  and belongs to a tourist + a `SafariPackage`, optionally an assigned
  `Guide`.
- `IsBookingStaffRole` permission (sales/ops/admin).
- `BookingViewSet`: list/detail with stage/region/guide filters, guide
  assignment, validated stage transitions, a quote line-item replace
  endpoint, an internal-notes endpoint, and a send-final-quote endpoint
  that emails the customer and advances the booking to `quoted`.

**Frontend**
- `api/bookings.ts` client.
- Wired the admin bookings-pipeline kanban and the booking detail page to
  the real API, removing the last of the `adminBookings` mock data.

## 2026-09-05 → 2026-09-06 — Wiring the frontend to the live backend

Up to this point the frontend ran entirely on local mock data
(`src/data/*.ts`). This phase replaced it piece by piece with the real API.

- `lib/api.ts`: typed fetch client with credentialed requests and a
  silent-refresh-on-401 retry.
- `auth/AuthContext.tsx` + `RequireRole.tsx`: session restore via
  `GET /api/auth/me/`, role-gated route guards for `/admin` and `/guide`.
- Sign-in form wired to real login with role-based redirect; Create
  Account tab wired to tourist self-registration
  (`POST /api/auth/register/`).
- `/set-password` page added for admin-invited accounts (guides/staff are
  invited via `POST /api/users/`, which creates an inactive user and
  emails a set-password link — there's no public sign-up for those
  roles).
- Header reflects real sign-in state; guide portal sign-out wired up.
- Destinations, DestinationDetail, Safaris, SafariDetail wired to the
  live API.
- Admin sidebar shows the real signed-in user; dashboard "Karibu" greeting
  uses the real name.
- `AdminPricing` rebuilt as real `Season` CRUD; `AdminStaffGuides` and
  `AdminUsers` wired to `/api/guides/` and `/api/users/`, dropping the
  mock RBAC UI.
- Verification pass: fixed lint errors, weak-password validation message,
  mutually-exclusive loading states, 401 → sign-in redirect, DRF error
  message parsing, and a guide-identity bug.

## 2026-09-05 — Django backend, Part 0

The backend didn't exist before this. Scaffolded from scratch per a
written design spec + implementation plan (see git history for the
`docs:` commits), covering sign-in/out and first-time platform setup.

- Django project scaffold; custom `User` model with a `role` field
  (`tourist`/`guide`/`sales`/`operations`/`admin`) instead of Django's
  default is_staff/is_superuser split.
- Cookie-based JWT auth: `POST /api/auth/login/` sets HttpOnly access +
  refresh cookies; `accounts.authentication.CookieJWTAuthentication` reads
  the cookie instead of an `Authorization` header;
  `POST /api/auth/logout/` blacklists the refresh token;
  `POST /api/auth/refresh/` reissues the access cookie;
  `GET /api/auth/me/` for session restore.
- `IsAdminRole` / `IsAdminOrReadOnly` permission classes.
- Admin-only `POST /api/users/` to invite Sales/Ops staff (later extended
  to guides).
- First content models + full CRUD: `Destination`, `SafariPackage`,
  `Season` (pricing), `Guide` — each admin-write, public-read.
- Hardening pass: `DEBUG` secure by default, guard against the insecure
  dev `SECRET_KEY` reaching production, env-driven cookie `SameSite`,
  nested destination/safari create-or-update wrapped in
  `transaction.atomic`, closed an `ALLOWED_HOSTS=*` bypass that could
  slip through in production.

## 2026-09-04 — Deployment infra groundwork

- Migrated Railway configuration to Infrastructure-as-Code
  (`.railway/railway.ts`).
- Repo hygiene: stopped tracking `designs/` and `.DS_Store`, added
  `.vscode/` to `.gitignore`.

## 2026-07-29 → 2026-07-31 — Frontend scaffold

The very first commits: initial site structure, page layout, and
branding, before the backend existed and before this became a monorepo in
the current sense.

- Initial Vite + React + TypeScript scaffold.
- Railway deployment config for the frontend (NIXPACKS, later switched to
  RAILPACK), with a `serve`-based production start script.
- Site structure: pages, layout components, branding assets; renamed to
  "Pande Wilderness Safari" across the site.
- `DestinationSlideshow` component; destination data extended to support
  multiple images per destination.
- Centralized contact info (address/email/phone/socials) into
  `VITE_CONTACT_*` / `VITE_SOCIAL_*` environment variables instead of
  hardcoding them in components.
