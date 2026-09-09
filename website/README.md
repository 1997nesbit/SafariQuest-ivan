# SafariQuest Frontend

React 19 + TypeScript + Vite single-page app for **Pande Wilderness Safari**.
This is the public marketing site, the tourist trip-planning flow and
account portal, the guide portal, and the internal admin/ops portal — all
one SPA, gated by role.

It talks to the Django REST API in the sibling `../backend/` over HTTPS with
credentialed (cookie-based) fetch calls. See `../backend/README.md` for the
API side of this same story, and the root `CHANGELOG.md` for how the two
got wired together in production.

## How the app is organized

```
src/
  api/          one file per backend resource (destinations.ts, safaris.ts,
                bookings.ts, ...) — each exports typed fetch functions and
                converts between the API's snake_case shape and the
                frontend's camelCase domain types
  auth/         AuthContext (session state, login/logout, role) + RequireRole
                (route guard component)
  lib/
    api.ts      the one place that knows the API base URL, attaches
                credentials, and retries a 401 once via /api/auth/refresh/
    useFetch.ts small hook wrapping the api/* functions with
                loading/error/data/refetch state
  components/   shared UI (Header, Footer, SafariCard, ...) plus
                per-portal layout shells: components/admin, components/
                account, components/guide, components/plan
  pages/        one file per route; pages/admin, pages/account, pages/guide,
                pages/plan mirror the portal split below
  data/         a few small local datasets (FAQs, guide reviews, etc.) that
                aren't worth a backend model yet — everything else is
                fetched live via api/
```

### The four portals, one router

`App.tsx` mounts everything under one `react-router` tree:

| Area | Routes | Who |
|---|---|---|
| Public site | `/`, `/destinations`, `/destinations/:id`, `/safaris`, `/safaris/:id`, `/about`, `/faqs`, `/experiences` | anyone |
| Trip planner | `/plan`, `/plan/experiences`, `/plan/details`, `/plan/review` | anyone (see below) |
| Auth | `/sign-in`, `/set-password` | anyone |
| Tourist account | `/account`, `/account/trips`, `/account/trips/:tripId`, `/account/invoices`, `/account/complaints`, `/account/profile` | `tourist` |
| Guide portal | `/guide`, `/guide/trips/:tripId`, `/guide/trips/:tripId/progress`, `/guide/reviews`, `/guide/support`, `/guide/profile` | `guide` |
| Admin/ops portal | `/admin`, `/admin/inquiries`, `/admin/clients`, `/admin/invoices`, `/admin/finance`, `/admin/pricing`, `/admin/guides`, `/admin/complaints`, `/admin/content`, `/admin/analytics`, `/admin/users` | `admin` / `sales` / `operations` |

`auth/RequireRole` wraps the account/guide/admin route trees and redirects
to `/sign-in` (or the correct portal home, via `ROLE_HOME`) if the signed-in
user's role doesn't match.

### Region → Park → Safari, mirrored from the backend

The trip planner and the public Destinations/Safaris pages follow the same
hierarchy the backend models: a tourist picks a **region**
(`api/destinations.ts`), sees the **parks** in it (`api/parks.ts`), and
picks from the **safaris** that actually visit those parks
(`api/safaris.ts`, filtered by `safari.parks`). `components/plan/` holds the
4-step planner's shared state (`TripPlanContext` /
`tripPlanStore.ts`) that carries the selected region → parks → safaris
across `/plan/experiences` → `/plan/details` → `/plan/review`.

### Admin content editing

`pages/admin/AdminContent.tsx` is the CMS-style hub with three tabs
(Regions, Parks, Safaris), each backed by a matching
`Admin*Form.tsx` (`AdminDestinationForm`, `AdminParkForm`,
`AdminSafariForm`) that reuses `components/admin/ImageDropzone.tsx` to
upload images through the backend's `/api/uploads/` endpoint before saving
the record. The admin bookings pipeline
(`AdminBookingsPipeline` / `AdminBookingDetail`) is a kanban over the
backend's `Booking.stage` field, with a quote builder and note thread per
booking.

### Auth flow

`auth/AuthContext.tsx` calls `GET /api/auth/me/` on mount to restore a
session from the HttpOnly cookies the backend sets on login (there is no
token stored in `localStorage`/JS-readable state — see the backend README's
cookie-auth section). `lib/api.ts` centralizes this: every request goes
through one `request()` helper that sets `credentials: 'include'`, and a
single 401 anywhere triggers one `/api/auth/refresh/` attempt before
failing for real.

## Local setup

```bash
cd website
pnpm install        # or npm install
cp .env.example .env  # set VITE_API_URL to your local backend, e.g. http://localhost:8000
pnpm dev
```

The dev server runs on Vite's default port (5173/5174) — make sure the
backend's `CORS_ALLOWED_ORIGINS` includes whichever one you're using.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | `tsc -b && vite build` — type-checks the whole project *and* builds `dist/` |
| `pnpm lint` | ESLint over the whole project |
| `pnpm preview` | Serve the built `dist/` locally |
| `pnpm start` | `serve -s dist -n -p $PORT` — what Railway runs in production |

**Typecheck note:** the root `tsconfig.json` is a TS *solution* file with no
files of its own (`{"files": [], "references": [...]}`); running
`tsc --noEmit -p .` directly against it silently reports no errors even
when there are real ones. Use `pnpm build` (which runs `tsc -b`, the
project-references-aware build mode) or
`npx tsc --noEmit -p tsconfig.app.json` for a real typecheck.

## Configuration (environment variables)

All `VITE_*` variables are baked into the JS bundle **at build time** — 
changing one in production requires a rebuild, not just a redeploy of the
same artifact.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. Falls back to `http://localhost:8000` if unset — which is exactly what caused production to show "Something went wrong" before this was wired up (see root `CHANGELOG.md`). |
| `VITE_CONTACT_ADDRESS`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_CONTACT_PHONE_HREF` | Footer/contact info. |
| `VITE_SOCIAL_FACEBOOK`, `VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_WHATSAPP` | Footer social links. |

## Deployment (Railway)

Deployed as its own Railway service (see `.railway/railway.ts` at the repo
root), building with `pnpm build` and serving the static `dist/` via
`pnpm start` (the `serve` package) on Railway's `$PORT`. It's a fully
separate deployment from the backend, on its own domain
(`pandewildernesstravels.com`) — which is why `VITE_API_URL` has to be an
absolute URL, and why the backend's CORS/CSRF/cookie settings matter (see
the backend README's deployment note on `AUTH_COOKIE_SAMESITE`).
