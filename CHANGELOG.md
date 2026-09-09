# Changelog

All notable changes to SafariQuest (Pande Wilderness Safari) are recorded
here, newest first. This is a monorepo — `backend/` (Django REST API) and
`website/` (React/Vite SPA) are deployed as two separate Railway services;
entries below note which side(s) each change touched.

See `backend/README.md` and `website/README.md` for the current-state
architecture overview; this file is the story of how it got there.

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
