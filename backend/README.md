# SafariQuest Backend

Django + Django REST Framework API for **Pande Wilderness Safari**, a Tanzania
safari tour operator platform. It serves the public marketing site, a tourist
account portal, a guide portal, and an internal admin/ops portal (all in the
sibling `website/` React app), and models the full booking pipeline from
inquiry to completed trip.

## How the pieces fit together

```
website/ (React SPA)  ──HTTPS, cookies──►  backend/ (this app)  ──►  Postgres
     │                                            │
     └── VITE_API_URL points at this API   ALLOWED_HOSTS / CORS_ALLOWED_ORIGINS /
                                            CSRF_TRUSTED_ORIGINS point back at the SPA
```

The frontend is a fully separate deployment (its own Railway service, its own
domain). Nothing here renders HTML for end users — every route under `/api/`
returns JSON, and the only server-rendered pages are the Django admin
(`/admin/`) and this app's own DRF browsable API in development.

### The data model, region → park → safari

- **`Destination`** (`destinations` app) — a *region* of Tanzania (Arusha,
  Zanzibar, Kilwa, …). Owns a list of `DestinationExperience` entries (simple
  named activities) for the public destination page.
- **`Park`** (`destinations` app) — a specific park or "wonder" a tourist
  actually visits (Serengeti National Park, Ngorongoro Conservation Area, …),
  always scoped to exactly one `Destination` via `region`.
- **`SafariPackage`** (`safaris` app) — a bookable, priced itinerary. Has a
  many-to-many `parks` field, so a single safari can span multiple parks
  across multiple regions (e.g. a 12-day "Bush to Beach" package touching
  Tarangire, Ngorongoro, Serengeti, *and* the Zanzibar Beaches park). Each
  safari also owns an ordered list of `ItineraryDay` rows.

This is why the public site lets a tourist browse *by region*, see the parks
in that region, and then see which safaris actually stop there — the join is
`Destination → Park → SafariPackage.parks`.

### Accounts and roles (`accounts` app)

A single custom `User` model (`AUTH_USER_MODEL`, email as the username field)
carries a `role`: `tourist`, `guide`, or `admin`. There is no separate
staff/customer table — the same model and the same JWT login flow cover
everyone. A `tourist` can additionally carry `is_referral_agent` — being a
referral agent is a profile a tourist account switches on
(`POST /api/referrals/agents/activate/`), not a fourth role; see the
`referrals` app below. The backend decides where each user lands
(`User.home_path`, returned as `home` in auth responses) and the frontend
just follows it — a client-side role→home map is what once left the
then-separate `referral_agent` role unreachable from the sign-in page, see
`CHANGELOG.md`.

Auth is **HttpOnly-cookie JWT**, not a bearer token the frontend has to
manage:

- `POST /api/auth/login/`, `/api/auth/register/` set `access_token` and
  `refresh_token` as HttpOnly cookies (see `AUTH_COOKIE_ACCESS` /
  `AUTH_COOKIE_REFRESH` in `settings.py`) and return
  `{"role": ..., "is_referral_agent": ..., "home": ...}` — `home`
  (`User.home_path`) is what the frontend actually navigates to; `role`
  alone stopped being enough once a tourist can also be an agent.
- `POST /api/auth/refresh/` reads the refresh cookie and issues a new access
  cookie. The frontend's `lib/api.ts` calls this automatically on a 401 and
  retries the original request once.
- `GET /api/auth/me/` returns the current user's role/name/email; the
  frontend calls this on load to restore a session.
- `POST /api/auth/set-password/` completes the admin-invite flow below.
- `POST /api/auth/change-password/` lets any authenticated user change their
  own password (current password required).
- `accounts.authentication.CookieJWTAuthentication` is the DRF
  authentication class that reads the access cookie instead of an
  `Authorization` header.
- `accounts.permissions` holds the role-based permission classes used across
  every app (`IsAdminRole`, `IsAdminOrReadOnly`).

**Admin invites:** `POST /api/users/` (admin-only) creates another `User`
with `role="admin"`, `is_active=False` and no usable password, then emails a
set-password link (`FRONTEND_URL` + `/set-password?...`). The invited admin
calls `POST /api/auth/set-password/` with the token to activate their
account. There is no role picker on this endpoint — it only ever creates
admins.

**Guide accounts** are created and activated together in one step by an
admin, via `POST /api/guides/create-with-account/` (see the `guides` app
below) — nothing is emailed; a one-time generated password is returned in
the response for the admin to share directly. **Tourist accounts** are the
only fully self-service path: `POST /api/auth/register/`. Becoming a
referral agent is not account creation at all — `POST
/api/referrals/agents/register/` is the same self-service tourist signup
with `is_referral_agent=True` pre-set, for someone who has no account yet;
`POST /api/referrals/agents/activate/` is the same flag switched on for a
tourist who's already signed in — see the `referrals` app below.

Only a `tourist` account can be the customer on a booking —
`BookingCreateSerializer.validate()` rejects checkout from any other
signed-in role with a clear message, rather than silently attributing the
booking to a staff/agent account that `BookingViewSet.get_queryset()` would
then never surface back to them (see the booking pipeline section below,
and `CHANGELOG.md` for how this was found).

`PATCH /api/users/{id}/` (`UserDetailView`, admin-only) activates/deactivates
an existing **Administrator** account — the admin Users screen's toggle.
There's still no role picker anywhere; each role keeps its own dedicated
creation flow (guides via Staff & Guides, tourists via self-registration,
admins via invite), and an admin can't deactivate their own account. Every
call writes an `AuditLogEntry` (see the `audit` app below) so activity here
is traceable after the fact.

### Booking pipeline (`bookings` app)

A `Booking` moves through a fixed `STAGE_ORDER`: `new_inquiry → quoted →
deposit_paid → confirmed → completed`. It belongs to a `customer` (a
`tourist` User) and exactly one of `safari` (`SafariPackage`) or
`region_safari` (`region_safaris.RegionSafari`, mutually exclusive via a
`CheckConstraint`), and can have an `assigned_guide` (`guides.Guide`). Line
items live in `QuoteLineItem` (each with a `label`, `quantity`, and
`unit_price` — the customer-facing `quote_price` is `quantity × unit_price`);
the `Booking.subtotal` property sums them. `BookingNote` is an internal,
timestamped note thread attached to a booking (used by the admin
bookings-pipeline kanban).

Three more models hang off a completed-or-in-progress booking:

- **`TripMilestone`** — a day-by-day progress tracker snapshotted from the
  safari's itinerary when the booking is created. A guide marks the current
  milestone complete (`POST .../milestones/{id}/complete/`, optionally with a
  note/photo), which advances the next one to "current" — this is what the
  tourist's Trip Progress page and the guide's Update Progress page both
  read.
- **`Review`** — a tourist's post-trip rating (guide rating + trip rating +
  testimonial), submittable once a booking reaches `completed`
  (`POST .../review/`). Saving one recomputes the assigned guide's cached
  `rating` (`Guide.recompute_rating`).
- **`Invoice`** — issued one of two ways. Admin-quoted bookings get one
  auto-issued (`get_or_create`) the moment a quote is sent
  (`POST .../quote/send/`), due 14 days out, `status` set manually by Admin.
  A direct-checkout booking gets one from `POST .../pay/` instead (below),
  with `trip_total` populated — the only case where `remaining_balance`
  (`trip_total - amount`, `None` when `trip_total` is unset) means anything.
  `status` is `unpaid`/`deposit_paid`/`paid`; `effective_status` reports
  `overdue` instead once `due_date` has passed and it isn't `paid` — see
  `InvoiceQuerySet.with_effective_status()` below for how that's queried
  efficiently. Lives at its own top-level routes, `/api/invoices/` and
  `/api/finance/summary/` (see Routes).

`BookingViewSet` (`bookings/views.py`) is where the pipeline lives day to
day:

- `partial_update` — move a booking to a new stage (with stage-order
  validation); logs an `AuditLogEntry` on every real stage change.
- `POST .../pay/` — records a **mock** checkout deposit (there's no payment
  gateway; card details never reach the backend, only the `amount` and
  `trip_total` the checkout page already computed and showed the tourist —
  the same trust boundary the rest of the price math already crosses, since
  `Booking` stores no price of its own). Creates the `Invoice` above,
  advances the booking to `deposit_paid`, emails a confirmation. Optionally
  accepts a `referral_code` to redeem — see the `referrals` app below.
- `POST .../pay-balance/` — pays off whatever's left on that same invoice.
  Unlike `pay/`, the amount here is **computed server-side**
  (`invoice.remaining_balance`), never trusted from the client — there's
  nothing left to negotiate, it's exactly what remains. Advances the
  booking to `confirmed`. This is what lets a signed-in tourist settle their
  balance from `/account` without re-entering any credentials or card
  details — it's just another authenticated request on the same session.
- `PATCH .../quote/` — edit line items and recompute the quote.
- `POST .../notes/` — add an internal note.
- `POST .../quote/send/` — email the finalized quote to the customer,
  advance the booking to `quoted`, and issue its `Invoice`.
- `POST .../milestones/{id}/complete/`, `POST .../review/` — see above.

### Other apps

- **`guides`** — `Guide` roster: name, role, on-trip status, cached
  `rating`, plus a profile (`bio`, `languages`, `specialties`) and an ordered
  `GuideCertification` list a guide maintains themselves
  (`PATCH /api/guides/me/`, `POST /api/guides/me/certifications/`). Optionally
  linked to a `User` via `user` (one-to-one) — set when the account is
  created through `POST /api/guides/create-with-account/`, which creates the
  `Guide` row and its `User` together with a generated password (see Accounts
  above).
- **`region_safaris`** — `RegionSafari`: a bookable mini safari scoped to a
  single region (no cross-region itinerary), with its own itinerary days,
  highlights, and park links — the simpler counterpart to a multi-park
  `SafariPackage` (see the root README's "core idea" section). Has its own
  admin editor tab and full CRUD at `/api/region-safaris/`.
- **`team`** — `TeamMember`: the people under "Meet the Experts" on the About
  page. Deliberately not `guides.Guide` — that's the operational roster
  (ratings, availability, a login account) and includes people who aren't
  public-facing. English lives in `title`/`bio`/`photo_alt`; other languages
  in the `translations` JSON (`{"fr": {"title", "bio", "photo_alt"}}`), validated
  against `TRANSLATION_LOCALES` and stripped of empty entries, so "not
  translated" is always the *absence* of a key and the frontend falls back to
  English field by field. `photo` is a URL from the admin image upload, like
  safaris. Public read shows published members only — including to a
  logged-in admin, so previewing the site never shows drafts; admins pass
  `?all=true` to list them. `python manage.py seed_team` loads the original
  three members (with their English/French/German/Portuguese text) and never
  overwrites an existing one, so re-running it is safe after admin edits.
- **`promotions`** — `Promotion`: a sponsored event in the homepage's
  "Sponsoring Events" carousel. Deliberately minimal: an image, a title, a
  description and a phone number. The phone number opens WhatsApp. There is
  no outbound link and no click tracking, because partners handle their own
  bookings and commission. `is_published` is the only visibility control
  (admins turn events on and off). `GET /api/promotions/` is public and
  returns published events; admins can pass `?all=true` to include hidden
  ones. The serializer requires an http(s) image URL and a phone number of
  7 to 15 digits.
- **`pricing`** — `Season` records (date range + price multiplier),
  public-read so the checkout page can price a package for whatever trip
  date the tourist picked (`website/src/lib/seasonalPrice.ts`); admin-write
  for the admin pricing page.
- **`referrals`** — a field-sales referral program. An agent is a `tourist`
  account with `User.is_referral_agent` switched on, not a separate role, so
  one login can both book trips and refer others (the two sets of data stay
  apart: bookings via `Booking.customer`, codes via `ReferralCode.agent`).
  Staff and guide accounts can't be agents. `POST /api/referrals/agents/register/`
  creates a new tourist with the flag pre-set; `POST /api/referrals/agents/activate/`
  switches it on for an already-signed-in tourist (idempotent, 403 for
  staff/guides). `ReferralSettings` is a
  singleton row (`get_solo()`) holding the admin-editable discount %
  (tourist-facing, default 2%), commission % (agent-facing, default 5%) and
  `code_expiry_days` — **default 180 (six months), settable from 1 day to
  730 (two years)**, enforced in `ReferralSettingsSerializer`. It was 3 days;
  agents share a code once (a flyer, a screenshot) and expect it to keep
  working, so a short window silently killed codes people still held.
  `ReferralCode` (`agent` FK, an 8-char code from an unambiguous alphabet —
  no `0`/`O`/`1`/`I` — `contact_name`, `expires_at`) is single-use and
  expires lazily (`status`/`is_expired` are computed properties, not a
  cron-maintained field). An agent's own code is refused on their own
  booking (both at validate and, as a backstop, at redemption), so a
  login that can book *and* hold codes can't collect commission on its own
  trip: `POST /api/referrals/codes/` generates one,
  `GET /api/referrals/codes/mine/` lists an agent's own,
  `POST /api/referrals/codes/validate/` checks one at checkout before
  submit. Redemption happens inside `BookingViewSet.pay` (above), not at
  booking creation — `ReferralCode.objects.select_for_update().filter
  (is_used=False)` inside that same transaction is what makes "once one
  person uses it, others can't" race-safe — and creates a
  `ReferralRedemption` snapshotting the rates in effect at that moment (so a
  later admin rate change can't retroactively alter what's already owed)
  plus a `commission_status` (`pending`/`paid`) an admin flips manually via
  `POST /api/referrals/admin/redemptions/{id}/mark-paid/`.
- **`support`** — `SupportTicket`: a guide- or tourist-filed issue (optional
  timestamped `SupportTicketNote` thread), worked from the admin Complaints
  inbox. `status` (`open`/`in_progress`/`resolved`) changes log an
  `AuditLogEntry`. `GET /api/support/tickets/mine/` returns the signed-in
  user's own tickets (their account/guide-portal "My Complaints" view);
  everything else on `SupportTicketViewSet` is admin-only.
- **`analytics`** — `FunnelEvent`: one row per step (`visited` / `started` /
  `submitted`) of an anonymous visitor's Trip Curator journey, keyed by a
  random `session_id` the frontend generates and stores locally (not tied to
  any account). `POST /api/analytics/events/` is public and throttled;
  `GET /api/analytics/funnel/` (admin-only) aggregates unique sessions per
  step for the Admin Analytics page's conversion funnel.
- **`audit`** — `AuditLogEntry`: an admin-visible, append-only trail of
  state-changing actions. Not every mutation writes one — currently:
  admin-user invited/activated/deactivated, a booking's stage changing, a
  quote being sent, a mock deposit/balance payment being recorded, a
  referral code being redeemed, an invoice's status changing, a support
  ticket's status changing, and a guide account being created.
  `GET /api/audit-log/` (admin-only, paginated) backs the widget on the
  admin Users page.
- **`uploads`** — a single `ImageUploadView` (admin-only, JPEG/PNG/WEBP/GIF,
  8MB max) that all the admin content-editing forms (destinations, parks,
  safaris, region safaris, team, events) use for image fields. The
  format is decided from the file's own leading bytes
  (`detect_image_extension`), never from the request's Content-Type — that's
  a header the client chooses, so an HTML/SVG file renamed `.png` used to be
  accepted and then served back from our public bucket; the stored
  extension follows the bytes too. Writes go through Django's
  `default_storage` — see "Object storage" below for where files actually
  end up.

## Routes

All routes are namespaced under `/api/` (see `config/urls.py`); everything
GET is public unless noted, everything else is role-gated.

| App | Base path | Notes |
|---|---|---|
| accounts | `/api/auth/` | csrf, login, logout, refresh, me, register, set-password, change-password |
| accounts | `/api/users/` | admin-only staff invite (`POST`) + activate/deactivate (`PATCH .../{id}/`) |
| accounts | `/api/customers/` | admin-only, paginated — the Client Directory / Client 360 |
| destinations | `/api/destinations/` | regions — full CRUD, admin-write |
| destinations | `/api/parks/` | parks — full CRUD, admin-write |
| safaris | `/api/safaris/` | safari packages — full CRUD, admin-write |
| region_safaris | `/api/region-safaris/` | region-scoped mini safaris — full CRUD, admin-write |
| team | `/api/team/` | About-page team members — public-read (published only), admin-write; `?all=true` includes drafts for admins |
| promotions | `/api/promotions/` | sponsored events — public-read (published only), admin-write; `?all=true` includes hidden events for admins |
| pricing | `/api/pricing/seasons/` | public-read, admin-write |
| guides | `/api/guides/` | admin-only CRUD, plus `create-with-account/`, `me/`, `me/certifications/` |
| bookings | `/api/bookings/` | staff-role CRUD + pipeline actions above, paginated. `{id}/pay/` and `{id}/pay-balance/` are tourist-only (own booking) |
| bookings | `/api/invoices/` | admin-only list/detail + `{id}/remind/`, paginated — except `mine/`, any authenticated tourist's own (unpaginated) |
| bookings | `/api/finance/summary/` | admin-only revenue/collections snapshot |
| referrals | `/api/referrals/agents/register/` | public — self-serve signup: a new tourist account with the agent profile on |
| referrals | `/api/referrals/agents/activate/` | any signed-in tourist — switches their agent profile on (idempotent; 403 for staff/guides) |
| referrals | `/api/referrals/codes/` | agent-only `POST` (generate) + `mine/` (their own codes); `validate/` is any authenticated user, checkout-side (refuses your own code) |
| referrals | `/api/referrals/settings/` | `public/` is public-read (discount %, commission % and code lifetime — the signup page shows them); the admin-only base route reads/writes all three |
| referrals | `/api/referrals/admin/redemptions/` | admin-only list + `{id}/mark-paid/` |
| support | `/api/support/tickets/` | admin-only inbox (paginated) + `mine/`, `{id}/notes/` |
| analytics | `/api/analytics/events/` | public, throttled — funnel-step recording |
| analytics | `/api/analytics/funnel/` | admin-only funnel aggregation |
| audit | `/api/audit-log/` | admin-only, paginated |
| uploads | `/api/uploads/` | admin-only image upload |

Django admin is mounted at `/admin/` for direct database inspection/edits
outside the API.

## Local setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
cp .env.example .env      # then fill in SECRET_KEY, DATABASE_URL, etc.
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py createsuperuser
.venv/Scripts/python manage.py runserver
```

By default `DATABASE_URL` falls back to a local `db.sqlite3` file
(`config/settings.py`), but the project is set up for Postgres via
`dj-database-url` — set `DATABASE_URL=postgres://...` to use one locally too.

### Seeding demo content

Each of these is idempotent (`update_or_create`) and safe to re-run:

```bash
python manage.py seed_destinations     # the 5 regions
python manage.py seed_parks            # parks within those regions
python manage.py seed_safaris          # safari packages, itineraries, park links
python manage.py seed_region_safaris   # one region-scoped mini safari per region
```

### Seeding the admin user

`seed_admin` creates (or updates) a single `ROLE_ADMIN` user from environment
variables, rather than the interactive `createsuperuser` prompt. It's
idempotent — safe to run on every deploy — and always drives the user's
name/role/password/`is_staff`/`is_superuser`/`is_active` to match the
env vars, so rotating `ADMIN_PASSWORD` and re-running it changes the password.

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me python manage.py seed_admin
```

`ADMIN_NAME` is optional. Missing `ADMIN_EMAIL`/`ADMIN_PASSWORD` raises a
`CommandError` rather than silently doing nothing.

### Running tests

```bash
.venv/Scripts/python manage.py test
```

## Configuration (environment variables)

All of these are read in `config/settings.py`; see `.env` for local dev
defaults.

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key. Required (no insecure default) once `DEBUG=False`. |
| `DEBUG` | `True`/`False`. Must be `False` in any real deployment. |
| `ALLOWED_HOSTS` | Comma-separated hostnames Django will serve. Must be explicit hosts when `DEBUG=False` (no `*`). |
| `DATABASE_URL` | `dj-database-url`-format connection string. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API from a browser. |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated **extra** origins trusted for unsafe (POST/PATCH/DELETE) requests. `FRONTEND_URL`'s own origin is appended automatically, so you only need this for additional clients. |
| `AUTH_COOKIE_SAMESITE` | `Lax` (default, same-site deployments) or `None` (required when the frontend and backend are on **different** domains — see the deployment note below). |
| `FRONTEND_URL` | Used to build links in emails (set-password, quote-sent), **and** auto-added to `CSRF_TRUSTED_ORIGINS` so the SPA's writes pass Django's Origin check. |
| `NUM_PROXIES` | Number of trusted reverse proxies in front of this API. **Set to `1` on Railway.** This is the single "I am behind a trusted proxy" declaration and it governs two things: the client IP used for rate limiting (unset means DRF reads `REMOTE_ADDR`, which behind a proxy is the proxy itself — every visitor lands in one shared bucket and a single abuser can lock out all users), and whether `X-Forwarded-Proto` is trusted to tell Django the request arrived over HTTPS. |
| `AWS_STORAGE_BUCKET_NAME` | S3/MinIO bucket for uploaded images. Unset → local disk (`MEDIA_ROOT`) instead — see "Object storage" below. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credentials for the bucket above. |
| `AWS_S3_ENDPOINT_URL` | S3-compatible API endpoint (MinIO's, not AWS's). |
| `EMAIL_HOST` | SMTP host. **Setting it switches `EMAIL_BACKEND` to real SMTP**; leaving it unset keeps the console backend. With `DEBUG=False` and neither this nor an explicit `EMAIL_BACKEND`, startup fails rather than silently dropping mail. |
| `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | Standard SMTP credentials. Defaults: port `587`, TLS on. |
| `EMAIL_TIMEOUT` | Seconds before giving up on the SMTP server (default `10`). Without it a wedged mail host holds a worker open indefinitely. |
| `DEFAULT_FROM_EMAIL` | From address on outgoing mail. Every `send_notification` call passes `from_email=None` and inherits this. |
| `EMAIL_BACKEND` | Normally derived from `EMAIL_HOST`. Set it explicitly to `django.core.mail.backends.console.EmailBackend` to deploy without mail on purpose. |
| `SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS when `DEBUG=False` (default on, but only takes effect when `NUM_PROXIES` is set — redirecting without the proxy header would loop forever). |
| `SECURE_HSTS_SECONDS` | HSTS max-age, default `0` (off). **One-way door:** browsers refuse plain HTTP to the host for the full duration and you cannot call it back. Turn on deliberately, starting small. |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD` | `True`/`False`, both default `False`. Only meaningful with a non-zero `SECURE_HSTS_SECONDS`. |
| `AWS_S3_CUSTOM_DOMAIN` | Public host (+ bucket path, for path-style addressing) used to build the URLs returned to the frontend — see the note below on why this is a *different* value from `AWS_S3_ENDPOINT_URL` in production. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Read only by `manage.py seed_admin` (not at server startup) — see "Seeding the admin user" above. |
| `ADMIN_NAME` | Optional display name for the `seed_admin` user. |

### Transactional email

Four flows send mail: the admin invite and the booking-created account both
carry a set-password link, and Admin can send a quote or a payment reminder.
All four go through `config.mail.send_notification`, which logs a delivery
failure at error level instead of raising. That matters because three of them
mutate state first — the quote endpoint moves the booking to QUOTED and issues
an invoice before sending — so a propagating SMTP error would return a 500 for
work that had already committed, and the admin would retry a booking that was
in fact already quoted. `bookings/tests/test_send_quote.py` pins this down.

Note that mail is fire-and-forget inside the request cycle; there is no queue
or retry. `EMAIL_TIMEOUT` caps the damage a slow SMTP server can do, but a
real outage means those notifications are lost (logged, not resent).

### CSRF protection on a cookie-authenticated API

Credentials live in an HttpOnly cookie, which the browser attaches to
*every* request to this API — including ones initiated by some other site.
DRF wraps each `APIView` in `csrf_exempt`, so the `CsrfViewMiddleware` in
`MIDDLEWARE` never sees an API endpoint; the check runs inside
`accounts.authentication.CookieJWTAuthentication.enforce_csrf` instead, the
same way DRF's own `SessionAuthentication` does it. Safe methods
(GET/HEAD/OPTIONS/TRACE) are unaffected.

A client therefore has to send `X-CSRFToken` on every POST/PATCH/DELETE.
It cannot read the value out of the `csrftoken` cookie, because the SPA is
served from a different origin and `document.cookie` only exposes the
reading document's own cookies — so `GET /api/auth/csrf/` returns the token
in its body. `website/src/lib/api.ts` fetches it lazily, caches it in
memory, and re-fetches once on a CSRF failure.

Two ways this breaks in deployment:

- **The SPA's origin isn't trusted.** Django compares the request `Origin`
  against `CSRF_TRUSTED_ORIGINS` plus its own host, and a different port is
  already a different origin (`localhost:5173` vs `localhost:8000`). This is
  derived from `FRONTEND_URL` automatically; an extra client needs an
  explicit `CSRF_TRUSTED_ORIGINS` entry.
- **`AUTH_COOKIE_SAMESITE=None` without HTTPS.** Browsers drop a
  `SameSite=None` cookie that isn't `Secure`, so `settings.py` now refuses to
  start in that combination rather than failing mysteriously at runtime.

### Rate limiting

Login, signup, set-password, anonymous booking creation, and funnel-event
recording each carry a scoped throttle (`config/settings.py: THROTTLE_RATES`);
everything else falls back to a generous per-IP/per-user default that public
browsing won't hit. Counters live in the default cache, and nothing configures
`CACHES` — so that is `LocMemCache`: **per-process and wiped on restart**,
meaning the effective ceiling is `rate x gunicorn workers` and resets on every
redeploy. Good enough to blunt credential stuffing, but point `CACHES` at Redis
if you want the limits to be exact.

Rates are disabled while the test suite runs (LocMemCache would otherwise carry
counters between unrelated tests); `accounts/tests/test_throttling.py` re-enables
them explicitly so the behaviour stays covered.

### Multi-write operations and transactions

Every write that touches more than one row now commits atomically or not at
all: booking creation (customer + booking + milestones), sending a quote
(stage + invoice), editing a quote's line items (delete + recreate),
completing a trip milestone (current + next), submitting a review (review +
the guide's cached rating), and a guide editing their own name (Guide + the
linked User). Before this, a crash or an unlucky worker restart between two
of those writes could leave things like a booking with no itinerary, a quote
with no line items, or a trip permanently stuck on no "current" milestone.
Email is deliberately sent *after* the transaction commits in each case — it
is best-effort (see Transactional email above) and must not hold a database
connection open for an SMTP round trip.

### Role constants

`User.ROLE_TOURIST` / `ROLE_GUIDE` / `ROLE_ADMIN` / `ROLE_REFERRAL_AGENT`
(`accounts/models.py`) name the four values in `User.ROLE_CHOICES`. Every
`role == "..."` check and every `role="..."` assignment across `accounts`,
`bookings`, `guides`, and `referrals` goes through these now, rather than a
repeated string literal — the same idiom already used for `Booking.STAGE_*`,
`Invoice.STATUS_*`, and `SupportTicket.STATUS_*`, just applied to the one
model that was missing it.
`UserManager.create_user`'s `role` parameter can't default to
`self.model.ROLE_TOURIST` directly (`self` isn't available yet when Python
evaluates a default), so it defaults to `None` and substitutes inside the
method instead.

### Pagination

Five endpoints are paginated (`config/pagination.py: StandardPagination`,
25/page, `?page_size=` up to 100): bookings, invoices, customers, the admin
support-ticket inbox, and the audit log. Each was returning every matching
row, unbounded, on every request. Everything else — the admin-curated
catalog (destinations, parks, safaris, region safaris, seasons), the guide
roster, the admin user list — stays a bare array on purpose: that data is
small by nature (content someone typed in, or a staff roster), and several
of those endpoints are read by public, unauthenticated pages (the trip
planner, site browsing) that have no use for a pager.

A paginated response is `{count, next, previous, results}` instead of a bare
array. `SupportTicketViewSet.mine` (the customer/guide's own tickets) is
deliberately exempt — it builds its `Response` directly rather than going
through `list()`, so pagination never applies to it; that list is small and
bounded by definition (one person's own tickets).

The frontend absorbs this two ways, depending on what each page actually
needs — see `website/src/lib/api.ts` (`apiGetPage`, `apiGetAllPages`) and
`website/src/lib/usePaginatedFetch.ts`:
- Views that browse an unbounded list one page at a time (Admin Invoices,
  Finance, Complaints, the Users page's audit log widget) use a real pager.
- Views whose own logic needs the *whole* list — Admin Bookings Pipeline
  buckets every booking into Kanban columns by stage; Admin Customers
  computes revenue/repeat-rate stats and searches client-side across the
  full customer base — fetch and flatten every page transparently instead.
  A page-based pager would silently corrupt both: an admin would see an
  arbitrary 25-row slice scattered across Kanban columns, or global stats
  and search that only cover whichever page happened to load. Each request
  is still bounded server-side either way; only the total fetched by these
  two views is unchanged.

### Effective status is computed in SQL, not Python

`Invoice.effective_status` (unpaid/deposit_paid/paid vs. the derived
"overdue") is a Python property, so filtering or aggregating on it used to
mean loading every invoice into memory and evaluating the property row by
row — `InvoiceViewSet`'s `?status=` filter and `FinanceSummaryView`'s totals
both did this. `Invoice.objects.with_effective_status()`
(`bookings/models.py`) annotates the same logic as a SQL `CASE` expression,
so both now run as ordinary `.filter()`/`.aggregate()` calls. The two
implementations have to be kept in sync by hand — there was no way to derive
one from the other without a bigger rework — so if `effective_status` ever
changes, update `with_effective_status()` to match.

### A deployment gotcha worth knowing

If the frontend and this API are ever deployed on **different domains** (as
they are in production — `pandewildernesstravels.com` vs. a
`*.up.railway.app` backend URL), the auth cookies **must** use
`AUTH_COOKIE_SAMESITE=None`. With the default `Lax`, the login request
itself succeeds and sets the cookie, but the browser silently drops it on
the very next cross-site fetch (`/api/auth/me/`), which looks to the
frontend exactly like "wrong password." This bit us once in production —
don't reintroduce it.

### Object storage (MinIO)

Railway's container filesystem is ephemeral — anything the `uploads` app
wrote to local disk would vanish on the next deploy. In production, media
storage is backed by **MinIO** (an S3-compatible object store) instead,
deployed as its own two-service Railway template ("Bucket" = the S3 API +
data, "Console" = a web UI for browsing the bucket).

Once `AWS_STORAGE_BUCKET_NAME` is set (see the config table above),
`config/settings.py` swaps `STORAGES["default"]` to
`storages.backends.s3.S3Storage` (`django-storages`) — no other code
changes needed, since `ImageUploadView` and everything else already goes
through `default_storage`. Two endpoint-shaped variables matter, and they
are **not** the same value:

- `AWS_S3_ENDPOINT_URL` — the backend's own API calls (PUT/GET) go here.
  In production this is MinIO's **private** Railway network address
  (`http://bucket.railway.internal:9000`), so backend ↔ MinIO traffic
  never leaves Railway's internal network.
- `AWS_S3_CUSTOM_DOMAIN` — used only to build the URLs handed back to the
  frontend/browser, which can't reach the private address. This is
  MinIO's **public** domain plus the bucket name (path-style addressing —
  MinIO isn't on a per-bucket subdomain like AWS S3 would be), e.g.
  `bucket-production-xxxx.up.railway.app/safariquest-media`.

The bucket itself has a public-read policy (anonymous `s3:GetObject`) so
those URLs work directly in `<img>` tags with no signing.

**Important:** the Bucket/Console services are deliberately **not**
declared in `.railway/railway.ts` — an attempt to represent them there
produced a plan that would have deleted the whole MinIO setup (see the
comment at the top of that file for the full story). They're managed
directly (Railway dashboard, or `railway variable`/`railway ssh` scoped
with `--service Bucket`/`--service Console`). If you ever touch
`.railway/railway.ts`, run `railway config plan` and check for a
"Delete service Bucket" or "Delete group MinIO" line **before** running
`railway config apply` — if you see one, do not apply it.

## Deployment (Railway)

This repo's `.railway/railway.ts` (Infrastructure-as-Code, see the repo
root) provisions this app as its own service plus a managed Postgres
database, with `python manage.py collectstatic && migrate && gunicorn
config.wsgi` as the start command. `whitenoise` serves compressed static
files (mainly for `/admin/`) without a separate CDN. See the root
`CHANGELOG.md` for the history of how this deployment was set up and the
issues that came up along the way.
