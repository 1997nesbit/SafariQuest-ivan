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
                bookings.ts, invoices.ts, support.ts, ...) — each exports
                typed fetch functions and converts between the API's
                snake_case shape and the frontend's camelCase domain types
  auth/         AuthContext (session state, login/logout, role) + RequireRole
                (route guard component)
  lib/
    api.ts            the one place that knows the API base URL, attaches
                      credentials, handles CSRF, and retries a 401 once via
                      /api/auth/refresh/
    caseMap.ts        shared snake_case ↔ camelCase mapping helper
                      (fromApiShape/toApiShape) — every api/*.ts mapper is
                      built on this instead of hand-writing the same
                      field-by-field conversion in each file
    useFetch.ts       small hook wrapping the api/* functions with
                      loading/error/data/refetch state
    usePaginatedFetch.ts  the paginated counterpart to useFetch, for the
                      handful of endpoints that return {count, next,
                      previous, results} — see "Paginated lists" below
    funnelTracking.ts fires the Trip Curator funnel events (visited/started/
                      submitted) the admin Analytics page's funnel reads
    seasonalPrice.ts  applies a Season's multiplier to a package's base
                      price for a given trip date, client-side (checkout)
  components/   shared UI (Header, Footer, SafariCard, ...) plus
                per-portal layout shells: components/admin, components/
                account, components/guide, components/plan
  pages/        one file per route; pages/admin, pages/account, pages/guide,
                pages/plan, pages/agent mirror the portal split below
  data/         a couple of small local datasets (FAQs, static "experiences"
                copy) that aren't backed by a model on purpose — everything
                else is fetched live via api/
```

### The five portals, one router

`App.tsx` mounts everything under one `react-router` tree:

| Area | Routes | Who |
|---|---|---|
| Public site | `/`, `/destinations`, `/destinations/:id`, `/safaris`, `/safaris/:id`, `/region-safaris/:id`, `/about`, `/faqs`, `/experiences`, `/become-agent` | anyone |
| Trip planner | `/plan`, `/plan/experiences`, `/plan/details`, `/plan/review`, `/plan/account`, `/plan/payment` | anyone (see Checkout below) |
| Direct checkout | `/safaris/:id/book`, `/region-safaris/:id/book` | anyone |
| Auth | `/sign-in`, `/set-password` | anyone |
| Tourist account | `/account`, `/account/trips`, `/account/trips/:tripId`, `/account/invoices`, `/account/complaints`, `/account/profile` | `tourist` |
| Guide portal | `/guide`, `/guide/trips/:tripId`, `/guide/trips/:tripId/progress`, `/guide/reviews`, `/guide/support`, `/guide/profile` | `guide` |
| Referral agent portal | `/agent` | a `tourist` with the agent profile on (`isReferralAgent`) |
| Admin portal | `/admin`, `/admin/inquiries`, `/admin/clients`, `/admin/invoices`, `/admin/invoices/:invoiceId`, `/admin/finance`, `/admin/pricing`, `/admin/guides`, `/admin/complaints`, `/admin/referrals`, `/admin/content` (Safaris / Region Safaris / Regions / Parks / Team / Sponsoring Events tabs, each with its own `Admin*Form`), `/admin/analytics`, `/admin/users` (includes the audit-log widget) | `admin` |

`auth/RequireRole` wraps the guide and admin route trees and redirects to
`/sign-in` if the signed-in user's role doesn't match. `/agent` uses
`auth/RequireAgent` instead: being a referral agent is a profile on a
tourist account (`user.isReferralAgent`), not a role, so `RequireRole` can't
express it. A signed-out visitor goes to `/sign-in?next=/agent`; a
signed-in tourist without the profile goes to `/become-agent`, where one
click activates it. `/account` additionally self-redirects any signed-in
non-tourist role to their own dashboard — it isn't wrapped in `RequireRole`
(a tourist can also reach it signed *out*, mid-checkout), so the guard lives
inside `AccountLayout` instead.

**Where a user lands is decided by the backend**, not a client-side map:
login, register and set-password responses carry `home` (`User.home_path`),
which `AuthContext` returns and `useHomeNavigate` (`i18n/useLocale.ts`)
follows; the header's Dashboard button uses `localizeHome(locale,
user.home)`. `SignIn.tsx` honours a same-site `?next=` over `home`. There's
deliberately no `ROLE_HOME` table any more — a role alone no longer
determines the landing page (an agent who has never booked lands on
`/agent`, everyone else on `/account`). See `CHANGELOG.md`.

### Region → Park → Safari, mirrored from the backend

The trip planner and the public Destinations/Safaris pages follow the same
hierarchy the backend models: a tourist picks a **region**
(`api/destinations.ts`), sees the **parks** in it (`api/parks.ts`), and
picks from the **safaris** that actually visit those parks
(`api/safaris.ts`, filtered by `safari.parks`). `components/plan/` holds the
4-step planner's shared state (`TripPlanContext` /
`tripPlanStore.ts`) that carries the selected region → parks → safaris
across `/plan/experiences` → `/plan/details` → `/plan/review`.

### Checkout and payment

A booking can't be completed without an account and a (mock) deposit —
there are two independent checkout flows that both end the same way:

- **Direct checkout** (`pages/Checkout.tsx`, `kind: 'safari' | 'regionSafari'`
  — one component serving both `/safaris/:id/book` and
  `/region-safaris/:id/book`) is a single-page wizard with local `step`
  state: details → account (skipped if already signed in) → review →
  payment.
- **Trip Curator checkout** is the routed equivalent —
  `pages/plan/PlanReview.tsx` → `PlanAccount.tsx` → `PlanPayment.tsx` —
  sharing `TripPlanContext` state across the extra route boundaries instead
  of local component state. `components/plan/usePlanSelections.ts` is the
  one place both `PlanReview` and `PlanPayment` derive "what's actually
  selected" (destinations/experiences/primary product) from
  `plan.experienceIds`, so they can't drift out of sync with each other —
  it also exposes a `loading` flag: evaluating a "select something" guard
  before its own `getSafaris()`/`getRegionSafaris()` fetches resolve is
  exactly the bug that used to flash a false validation error on Review.

Both flows share rather than duplicate the account/payment UI:
`components/checkout/AccountFields.tsx` (register/sign-in toggle),
`MockCardFields.tsx` (mock card inputs — clearly labeled test mode; nothing
here ever reaches the backend, only the resulting deposit amount does), and
`ReferralCodeField.tsx` (see Referral program below). Both end on one
shared `/booking-confirmed` screen (`state: {title, paidAmount,
paidToEmail}`) rather than each having their own.

Only a signed-in `tourist` (or nobody, i.e. checkout will create the
account) can reach the payment step — `Checkout.tsx` and `PlanReview.tsx`
both check `user.role` and show a "Sign In Required" screen with a sign-out
button if a guide/admin account is signed in, instead of
letting them fill out the whole form and hit a 400 at the very end (the
backend rejects it too — see `backend/README.md`'s accounts section).

**Paying off the rest, later:** once the deposit is paid, `pages/account/
MyTrips.tsx` shows a "Pay Remaining Balance" button on any trip that still
has one (`GET /api/invoices/mine/`'s `remainingBalance`), calling
`payRemainingBalance()` — just another authenticated request on the same
cookie session, no re-entered credentials or card details.

### Referral program

A field-sales referral system, backed by the `referrals` Django app (see
`backend/README.md` for the full model). Being an agent is a profile on an
ordinary tourist account, so one login can both book trips and refer others.
A visitor joins at `/become-agent` (`pages/ReferralSignup.tsx`, which adapts
to signed-out / tourist / already-agent states and shows the commission rate
and validity up front); a traveller who just booked gets a one-click
"Refer & Earn" card on `/booking-confirmed` (`activateReferralAgent()`).
From `pages/agent/AgentDashboard.tsx` (`/agent`, with a "My Trips" link back
to the tourist area) they generate single-use codes — each shown once with
its expiry (180 days by default, admin-configurable), plus a running list of
their own codes with a status badge (active/used/expired) and, once
redeemed, the resulting booking and commission owed/paid.

At checkout, `components/checkout/ReferralCodeField.tsx` shows the live
discount rate, validates a code on blur
(`POST /api/referrals/codes/validate/`) and discounts the deposit if it's
active. `pages/admin/AdminReferrals.tsx` is the admin side: a settings card
for the discount/commission percentages and code lifetime, and a table of
every redemption with a "Mark Paid" action. `AdminCustomers.tsx` has
Travellers / Agents filter tabs so agents who never travel don't skew the
customer stats.

### Admin content editing

`pages/admin/AdminContent.tsx` is the CMS-style hub with six tabs
(Safaris, Region Safaris, Regions, Parks, Team, Sponsoring Events), each backed by a
matching `Admin*Form.tsx` (`AdminSafariForm`, `AdminRegionSafariForm`,
`AdminDestinationForm`, `AdminParkForm`, `AdminTeamMemberForm`,
`AdminPromotionForm`, the Sponsoring Events form) that reuses
`components/admin/ImageDropzone.tsx` to upload images through the backend's
`/api/uploads/` endpoint before saving the record. The admin bookings
pipeline (`AdminBookingsPipeline` / `AdminBookingDetail`) is a kanban over
the backend's `Booking.stage` field, with a quote builder and note thread
per booking.

### Financial ops, CRM, and analytics (admin)

- `AdminInvoices` / `AdminInvoiceDocument` / `AdminFinance` read
  `api/invoices.ts` — a real, paginated invoice register plus a printable
  A4 document (`window.print()`, no server-generated PDF) and a
  revenue/collections summary. Invoices are issued automatically server-side
  when a quote is sent; there's no create flow here, only status updates and
  a "send reminder" action.
- `AdminCustomers` / `AdminCustomerDetail` (Client Directory / Client 360)
  read `api/customers.ts`, including each customer's invoice history now
  that invoices exist.
- `AdminComplaints` and the tourist/guide `AccountComplaints` /
  `GuideSupport` pages all read `api/support.ts` — one real `SupportTicket`
  model behind all three views (admin sees everything; tourists/guides see
  only their own, via `GET /api/support/tickets/mine/`).
- `AdminAnalytics` computes its KPI cards and tables client-side from real
  `getBookings()`/`getSafaris()` data (no dedicated analytics endpoint for
  those), plus a real conversion funnel from `api/analytics.ts` —
  `lib/funnelTracking.ts` fires a `visited`/`started`/`submitted` event at
  each Trip Curator step, keyed by an anonymous per-browser session id.
- The Users page's Activity Log widget reads `api/auditLog.ts`
  (`GET /api/audit-log/`), and its activate/deactivate control calls
  `PATCH /api/users/{id}/`.

### Auth flow

`auth/AuthContext.tsx` calls `GET /api/auth/me/` on mount to restore a
session from the HttpOnly cookies the backend sets on login (there is no
token stored in `localStorage`/JS-readable state — see the backend README's
cookie-auth section). `lib/api.ts` centralizes this: every request goes
through one `request()` helper that sets `credentials: 'include'`, and a
single 401 anywhere triggers one `/api/auth/refresh/` attempt before
failing for real. It also fetches and caches a CSRF token (`GET
/api/auth/csrf/`), since the SPA's origin differs from the API's and
`document.cookie` can't read the API's `csrftoken` cookie across that
boundary — every unsafe request (POST/PATCH/DELETE) sends it back as
`X-CSRFToken`, and a 403 naming CSRF triggers one re-fetch-and-retry, the
same shape as the 401/refresh handling above.

Every request also carries a timeout (20s, 60s for `apiUpload`) — without
one, a hung backend left a caller's `loading` state `true` forever, with no
error and no way out. And `parseErrorMessage` reports every invalid field
from a DRF validation error, not just the first — a form with several bad
fields used to make you fix one, resubmit, and get told about the next.

### Paginated lists

Five backend endpoints return `{count, next, previous, results}` instead of
a bare array (see the backend README's Pagination section for which ones
and why). Two matching primitives in `lib/api.ts` handle that:

- `apiGetPage<T>(path)` — one page, normalized to `{results, count, hasNext,
  hasPrevious}`. Pair it with `lib/usePaginatedFetch.ts` (the paginated
  counterpart to `useFetch`) for a view that browses the list one page at a
  time with a `<Pager>` (`components/admin/Pager.tsx`) — see
  `pages/admin/AdminInvoices.tsx` for the pattern.
- `apiGetAllPages<T>(path, params)` — fetches every page and flattens it.
  For the handful of API-client functions (`getBookings`, `getCustomers`)
  whose callers need the *whole* list rather than one page: a customer's own
  trips, a guide's own schedule, an admin view that computes stats or
  searches across every row. Reach for a real pager by default; only fall
  back to this when the consuming page's own logic — not just habit — needs
  the complete set. Getting this backwards is worse in different directions:
  a real pager under a "must have everything" view (Kanban columns, global
  stats, cross-page search) *silently* shows wrong data, while defaulting to
  auto-follow-all everywhere quietly defeats the point of paginating in the
  first place.

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
| `VITE_API_URL` | Base URL of the backend API. **Required for `vite build`** — the build itself fails without it (`vite.config.ts`), rather than silently shipping a bundle hardcoded to `http://localhost:8000`, which is what caused production to show "Something went wrong" the first time (see root `CHANGELOG.md`). Falls back to `http://localhost:8000` for `vite dev` only. |
| `VITE_CONTACT_ADDRESS`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_CONTACT_PHONE_HREF` | Footer/contact info. |
| `VITE_CONTACT_SECONDARY_NAME`, `VITE_CONTACT_SECONDARY_EMAIL`, `VITE_CONTACT_SECONDARY_PHONE` | Optional second contact shown in the footer. |
| `VITE_SOCIAL_FACEBOOK`, `VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_WHATSAPP` | Footer social links, genuinely optional — empty in `.env`/`.env.example` today. Typed `string \| undefined`, not `string`; the footer only renders each icon when its value is set (`components/Footer.tsx`), rather than the `href="#"` dead links an unconditional render used to produce. |

## Deployment (Railway)

Deployed as its own Railway service (see `.railway/railway.ts` at the repo
root), building with `pnpm build` and serving the static `dist/` via
`pnpm start` (the `serve` package) on Railway's `$PORT`. It's a fully
separate deployment from the backend, on its own domain
(`pandewildernesstravels.com`) — which is why `VITE_API_URL` has to be an
absolute URL, and why the backend's CORS/CSRF/cookie settings matter (see
the backend README's deployment note on `AUTH_COOKIE_SAMESITE`).
