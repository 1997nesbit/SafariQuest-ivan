# Django Backend — Part 0: System Access & Setup

Date: 2026-09-05
Status: Approved

## Purpose

Stand up the first slice of the SafariQuest backend: Django + DRF project covering
operation-manual items 0.1 (Sign In), 0.2 (Sign Out), and 0.3 (First-Time Platform
Setup). This replaces the current frontend prototype behavior where Sign In always
redirects to `/account` regardless of credentials, and Sign Out has no server-side
session to revoke.

Everything else in the ops manual (bookings, inquiries, invoicing, complaints, etc.)
is out of scope and will be its own sub-project/spec later.

## Non-goals

- Google OAuth ("Continue with Google") — deferred; email/password only for now.
- Wiring the existing React frontend up to call these endpoints — separate follow-up
  once the API exists and is verified.
- Any operation beyond Part 0 of the ops manual (bookings, invoices, complaints,
  analytics, etc.).

## Architecture

- **Django 5 + Django REST Framework**, new project at `backend/`, sibling to the
  existing `website/` frontend at the repo root.
- **Auth**: `djangorestframework-simplejwt` generates access + refresh tokens, but
  they are never returned in a JSON body — a custom login/logout view sets/clears
  them as **HttpOnly cookies**. A custom DRF authentication class reads the JWT from
  the cookie (not the `Authorization` header) on every protected request.
- **Custom User model** (`accounts.User`, email as the username field) with a `role`
  field: `tourist | guide | sales | operations | admin`. Login response includes
  `role` so the frontend can branch its redirect.
- **Database**: SQLite for local dev; Postgres in production via a `DATABASE_URL`
  env var (`dj-database-url` + `psycopg`), so it slots into the existing Railway IaC
  setup (`.railway/`) without further code changes.
- **CORS**: `django-cors-headers`, allowing the Vite dev origin with
  `CORS_ALLOW_CREDENTIALS = True` (required for HttpOnly cookies to flow between
  `localhost:5173` and the Django API on a different port).

## Apps / Components

| App | Owns |
|---|---|
| `accounts` | Custom `User` model, `role` field, login/logout/refresh views, `POST /api/users/` (invite Sales/Ops staff) |
| `destinations` | `Destination` (+ `DestinationExperience` related model) and `/api/destinations/` — field shape mirrors `website/src/data/destinations.ts` (`images`, `tags`, `experiences`, etc.) |
| `safaris` | `SafariPackage` (+ `ItineraryDay` related model) and `/api/safaris/` — mirrors `website/src/data/safaris.ts` (`highlights`, `included`, `excluded`, `itinerary`) |
| `pricing` | `Season` model (name, start date, end date, multiplier) and `/api/pricing/seasons/` — new; no existing frontend data file to mirror |
| `guides` | `Guide` model (name, role, status, rating) and `/api/guides/` — mirrors the guide-relevant fields of `website/src/data/adminStaff.ts` (reviews/bookings stay out of scope for Part 0) |

## Data flow — 0.1 Sign In

1. Frontend `POST /api/auth/login/` with `{email, password}`.
2. View authenticates against `accounts.User`.
3. On success: simplejwt issues access (short-lived) + refresh tokens, both set as
   HttpOnly cookies. Response body is `{role}` only — no tokens in JSON.
4. Frontend branches redirect off `role`: `tourist` → `/account`, `guide` → `/guide`,
   `sales`/`operations`/`admin` → `/admin`.

## Data flow — 0.2 Sign Out

1. Frontend `POST /api/auth/logout/`.
2. View reads the refresh token cookie, adds it to simplejwt's token blacklist
   (`rest_framework_simplejwt.token_blacklist` app) so it can never be reused from
   any device, then clears both cookies.

## Data flow — 0.3 First-Time Platform Setup

Standard authenticated CRUD, restricted to `role=admin`:

- `POST /api/destinations/`
- `POST /api/safaris/`
- `PATCH /api/pricing/seasons/`
- `POST /api/guides/`
- `POST /api/users/` (invite Sales Agent / Operations staff — creates a `User` with
  the given role; in dev, the invite email is printed via Django's console email
  backend rather than actually sent)

## Error handling

- Bad credentials on login → `401`, generic message (no user-enumeration).
- Expired/invalid/missing auth cookie on a protected route → `401`.
- Logout with an already-blacklisted or missing refresh token → `401` (idempotent;
  cookies are cleared regardless).
- Non-admin hitting an admin-only Part 0.3 endpoint → `403`.

## Testing

DRF `APITestCase` per app:

- `accounts`: login success/failure, logout + replay-attempt rejection (blacklisted
  token reused → `401`), role appears correctly in login response.
- `destinations` / `safaris` / `pricing` / `guides`: CRUD round-trip, admin-only
  write permission enforced (`403` for non-admin roles).

## Open questions / follow-ups (not blocking this spec)

- Frontend integration (pointing `SignIn.tsx` and the Guide portal's Sign Out link
  at these new endpoints) is a separate task after the backend is built and
  verified.
- Google OAuth can be added later via `django-allauth` once a Google Cloud OAuth
  app is set up.
