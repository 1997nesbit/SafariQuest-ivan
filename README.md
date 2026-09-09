# SafariQuest — Pande Wilderness Safari

A full-stack platform for a Tanzania safari tour operator: a public
marketing site, a tourist trip-planning flow and account portal, a guide
portal, and an internal admin/ops portal (inquiries, quoting, bookings
pipeline, content management), all backed by one Django API.

Live at **[pandewildernesstravels.com](https://pandewildernesstravels.com)**.

## Repo layout

This is a monorepo with two independently deployed apps:

```
SafariQuest/
├── backend/    Django + Django REST Framework API — see backend/README.md
├── website/    React + TypeScript + Vite SPA — see website/README.md
└── .railway/   Infrastructure-as-code: how both are deployed on Railway
```

They're separate Railway services on separate domains, talking over HTTPS
with credentialed (cookie-based) fetch — not a shared server, not a shared
build. Each has its own README with full setup instructions; this file is
the map, not the manual.

## The core idea: Region → Park → Safari

Both sides of the app are organized around the same three-level hierarchy:

- A **region** (`Destination` in the backend) is a broad area of Tanzania —
  Arusha, Zanzibar, Kilwa, and so on.
- A region contains **parks** — specific places a tourist actually visits
  (Serengeti National Park, Ngorongoro Conservation Area, …).
- A **safari** is a bookable, priced itinerary that can span *multiple*
  parks across *multiple* regions (e.g. a safari that starts in Tarangire,
  passes through Ngorongoro and the Serengeti, and ends on a Zanzibar
  beach).

A tourist picks a region, sees the parks in it, and picks from the safaris
that actually stop at those parks. Admins manage all three levels from the
content-management tab of the admin portal. See `backend/README.md` for the
model definitions and `website/README.md` for how the frontend mirrors
this.

## Quick start

Run both sides locally, in separate terminals:

```bash
# Backend — see backend/README.md for full setup
cd backend
.venv/Scripts/python manage.py runserver

# Frontend — see website/README.md for full setup
cd website
pnpm dev
```

The frontend's `VITE_API_URL` needs to point at the backend
(`http://localhost:8000` by default), and the backend's
`CORS_ALLOWED_ORIGINS` needs to include whichever port Vite is running on.

## Where things are documented

| Question | Look here |
|---|---|
| How the API is structured, models, auth, roles | `backend/README.md` |
| How the frontend is structured, routing, portals | `website/README.md` |
| How everything is deployed on Railway, and why certain settings exist | `.railway/README.md` + the "Deployment" section of each app's README |
| What changed and when, including production incidents and their fixes | `CHANGELOG.md` |

## Deployment

Both services live in one Railway project, described as code in
`.railway/railway.ts` (see `.railway/README.md` for the `railway config
plan` / `apply` workflow). At a glance:

- **SafariQuest** (frontend) — builds and serves the Vite SPA, custom
  domain `pandewildernesstravels.com`.
- **Backend** — Django via gunicorn, migrations run on every deploy.
- **Postgres** — the backend's database.
- **Bucket** / **Console** — MinIO (S3-compatible object storage) for
  uploaded images, so they survive redeploys instead of vanishing with
  the container's ephemeral filesystem. Provisioned from Railway's
  `railwayapp-templates/minio` marketplace template, and — unlike
  everything else — deliberately **not** managed through
  `.railway/railway.ts` (see `backend/README.md`'s "Object storage"
  section for why, and the safety check to run before ever applying
  changes to that file).

Two settings matter enough to call out here (both are explained in full in
`backend/README.md`): since the frontend and backend are on different
domains, the backend's auth cookies must use `AUTH_COOKIE_SAMESITE=None`,
and `ALLOWED_HOSTS` must include Railway's healthcheck hostname or
deploys will fail health checks even though the app is fine.
