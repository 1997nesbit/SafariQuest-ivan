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
carries a `role`: `tourist`, `guide`, `sales`, `operations`, or `admin`. There
is no separate staff/customer table — the same model and the same JWT login
flow cover everyone, and the frontend decides which portal shell to render
based on `role` (see `ROLE_HOME` in the frontend's `AuthContext`).

Auth is **HttpOnly-cookie JWT**, not a bearer token the frontend has to
manage:

- `POST /api/auth/login/`, `/api/auth/register/` set `access_token` and
  `refresh_token` as HttpOnly cookies (see `AUTH_COOKIE_ACCESS` /
  `AUTH_COOKIE_REFRESH` in `settings.py`) and return `{"role": "..."}`.
- `POST /api/auth/refresh/` reads the refresh cookie and issues a new access
  cookie. The frontend's `lib/api.ts` calls this automatically on a 401 and
  retries the original request once.
- `GET /api/auth/me/` returns the current user's role/name/email; the
  frontend calls this on load to restore a session.
- `POST /api/auth/set-password/` completes the invite flow below.
- `accounts.authentication.CookieJWTAuthentication` is the DRF
  authentication class that reads the access cookie instead of an
  `Authorization` header.
- `accounts.permissions` holds the role-based permission classes used across
  every app (`IsAdminRole`, `IsAdminOrReadOnly`, `IsBookingStaffRole`, …).

**Staff invites:** `POST /api/users/` (admin-only) creates a `User` with
`is_active=False` and no usable password, then emails a set-password link
(`FRONTEND_URL` + `/set-password?...`). The invited user calls
`POST /api/auth/set-password/` with the token to activate their account —
this is how guides/sales/operations accounts get created; there is no public
sign-up for those roles (`POST /api/auth/register/` always creates a
`tourist`).

### Booking pipeline (`bookings` app)

A `Booking` moves through a fixed `STAGE_ORDER`: `new_inquiry → quoted →
deposit_paid → confirmed → completed`. It belongs to a `customer` (a
`tourist` User) and a `safari` (`SafariPackage`), and can have an
`assigned_guide` (`guides.Guide`). Line items live in `QuoteLineItem`
(each with a `label`, `cost`, and `markup_percent` — the customer-facing
quote price is cost × (1 + markup)); the `Booking.subtotal` property sums
them. `BookingNote` is an internal, timestamped note thread attached to a
booking (used by the admin bookings-pipeline kanban).

`BookingViewSet` (`bookings/views.py`) is where the pipeline lives day to
day:

- `partial_update` — move a booking to a new stage (with stage-order
  validation).
- `PATCH .../quote/` — edit line items and recompute the quote.
- `POST .../notes/` — add an internal note.
- `POST .../quote/send/` — email the finalized quote to the customer and
  advance the booking to `quoted`.

### Other apps

- **`guides`** — `Guide` roster (name, role, on-trip status, rating), used
  for `assigned_guide` and the admin staff/guides pages.
- **`pricing`** — `Season` records (date range + price multiplier) that the
  frontend's pricing calculator and the admin pricing page read.
- **`uploads`** — a single `ImageUploadView` (admin-only, JPEG/PNG/WEBP/GIF,
  8MB max) that all the admin content-editing forms (destinations, parks,
  safaris) use for image fields. Writes go through Django's `default_storage`
  — see "Object storage" below for where files actually end up.

## Routes

All routes are namespaced under `/api/` (see `config/urls.py`); everything
GET is public unless noted, everything else is role-gated.

| App | Base path | Notes |
|---|---|---|
| accounts | `/api/auth/` | login, logout, refresh, me, register, set-password |
| accounts | `/api/users/` | admin-only staff invite |
| destinations | `/api/destinations/` | regions — full CRUD, admin-write |
| destinations | `/api/parks/` | parks — full CRUD, admin-write |
| safaris | `/api/safaris/` | safari packages — full CRUD, admin-write |
| pricing | `/api/pricing/seasons/` | admin-only CRUD |
| guides | `/api/guides/` | admin-only CRUD |
| bookings | `/api/bookings/` | staff-role CRUD + pipeline actions above |
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
python manage.py seed_destinations   # the 5 regions
python manage.py seed_parks          # parks within those regions
python manage.py seed_safaris        # safari packages, itineraries, park links
```

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
| `CSRF_TRUSTED_ORIGINS` | Comma-separated origins trusted for unsafe (POST/PATCH/DELETE) requests. |
| `AUTH_COOKIE_SAMESITE` | `Lax` (default, same-site deployments) or `None` (required when the frontend and backend are on **different** domains — see the deployment note below). |
| `FRONTEND_URL` | Used to build links in emails (set-password, quote-sent). |
| `AWS_STORAGE_BUCKET_NAME` | S3/MinIO bucket for uploaded images. Unset → local disk (`MEDIA_ROOT`) instead — see "Object storage" below. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credentials for the bucket above. |
| `AWS_S3_ENDPOINT_URL` | S3-compatible API endpoint (MinIO's, not AWS's). |
| `AWS_S3_CUSTOM_DOMAIN` | Public host (+ bucket path, for path-style addressing) used to build the URLs returned to the frontend — see the note below on why this is a *different* value from `AWS_S3_ENDPOINT_URL` in production. |

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
