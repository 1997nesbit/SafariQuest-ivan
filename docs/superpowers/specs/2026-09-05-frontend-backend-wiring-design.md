# Frontend-Backend Wiring (Part 0 scope)

Date: 2026-09-05
Status: Approved

## Purpose

Replace mock data in the React frontend (`website/`) with live calls to the
Django backend (`backend/`) built in the prior "Django Backend Part 0" work,
for every area the backend actually supports: authentication, Destinations,
Safaris, Pricing Seasons, Guides, and Users. This closes the gap identified
after that backend shipped — the frontend currently has zero network calls
to it and still runs entirely on static TypeScript data files.

## Non-goals

- Anything requiring backend features that don't exist yet: bookings,
  inquiries, invoicing, complaints, finance/analytics dashboards, trip
  progress tracking, guide reviews/trips, FAQs, or the content builder.
  Those pages stay on mock data — building their backends is separate,
  future work.
- Granular RBAC (per-permission toggles) in AdminUsers — the backend's
  `User` model has only a single `role` field, not a permissions system.
- A password-set/activation flow for admin-invited users — already flagged
  as a known gap in `backend/README.md`; out of scope here too.
- Introducing a frontend test framework (Vitest/Jest) — none exists in this
  repo today; verification for this pass is manual, in-browser.
- Google OAuth ("Continue with Google" on the sign-in page).

## Backend additions (small, land first)

Two endpoints are needed that the Part 0 backend doesn't have, because
HttpOnly cookies are invisible to JS and because the users endpoint was
write-only:

1. **`GET /api/auth/me/`** — `accounts.views.MeView`. Returns `{"role": ...}`
   for the authenticated user (200) or 401 if not signed in. Used once on
   app load to restore `{role, isLoading}` session state without needing to
   read any cookie from JS.
2. **`GET /api/users/`** — added to the existing `accounts.views` users
   endpoint (currently `POST`-only `UserInviteView`). Admin-only. Returns a
   list of `{id, name, email, role}` for all users with role in
   `sales|operations|admin` (i.e. staff accounts, not tourists/guides).
   Implemented by converting `UserInviteView` to `generics.ListCreateAPIView`
   with a separate list serializer (`UserListSerializer`) that never exposes
   password-related fields.

Both are admin-only except `/api/auth/me/`, which is available to any
authenticated role (it's how every portal restores its own session).

## Frontend architecture

- **Env config**: `website/.env` (gitignored) with `VITE_API_URL`, defaulting
  to `http://localhost:8000` for local dev against the Django dev server.
- **API client** (`website/src/lib/api.ts`): a thin typed wrapper around
  `fetch`. Always sends `credentials: 'include'` so the backend's HttpOnly
  cookies flow on every request. On a `401` response (except from the
  refresh/login endpoints themselves, to avoid loops), it transparently
  calls `POST /api/auth/refresh/` once; on success it retries the original
  request once; on failure it surfaces the 401 to the caller. Exposes typed
  helpers per resource (`getDestinations()`, `getDestination(slug)`,
  `login(email, password)`, etc.) built on a couple of low-level
  `apiGet`/`apiPost`/`apiPatch`/`apiDelete` primitives.
- **Auth state** (`website/src/auth/AuthContext.tsx`): `AuthProvider` calls
  `GET /api/auth/me/` once on mount, exposing
  `{role: Role | null, isLoading: boolean, login, logout}` via context.
  `login()`/`logout()` call the real endpoints and update this state;
  `logout()` also clears it optimistically before the network call resolves
  (immediate UI feedback) and reconciles on response.
- **Route guards** (`website/src/auth/RequireRole.tsx`): wraps the `/admin`
  and `/guide` route subtrees. While `isLoading`, renders nothing (or a
  minimal loading state) to avoid a flash-redirect. Once loaded, if `role`
  doesn't match the required section, redirects to `/sign-in`.

## Page-by-page wiring

| Page(s) | Backend calls | Notes |
|---|---|---|
| `SignIn.tsx` | `POST /api/auth/login/` | Redirect by returned `role`: `tourist→/account`, `guide→/guide`, `sales|operations|admin→/admin`. Inline error message on 401. |
| `Header.tsx` | reads `AuthContext` | Sign In link swaps for a signed-in indicator when `role` is set; no direct network call here. |
| Guide portal sign-out link (`GuideProfile.tsx` or wherever it lives) | `AuthContext.logout()` → `POST /api/auth/logout/` | Redirects to homepage after, matching existing behavior. |
| `Destinations.tsx` | `GET /api/destinations/` | List view; loading/empty/error states. |
| `DestinationDetail.tsx` | `GET /api/destinations/<slug>/` | 404 → "not found" state. |
| `Safaris.tsx` | `GET /api/safaris/` | List view; loading/empty/error states. |
| `SafariDetail.tsx` | `GET /api/safaris/<slug>/` | 404 → "not found" state. |
| `AdminPricing.tsx` | `GET/POST/PATCH/DELETE /api/pricing/seasons/` | Rebuilt as a real `Season` CRUD table (name, start/end date, multiplier). Per-package price editing and the hardcoded 3-row season UI are removed — they don't correspond to any backend concept. |
| `AdminStaffGuides.tsx` (+ "Add New Staff") | `GET/POST /api/guides/` | List/filter/grid as today, backed by real data. Drops `reviewCount` and booking-id fields (not modeled server-side). |
| `AdminUsers.tsx` | `GET/POST /api/users/` | Real table from the new list endpoint. Create form invites via `POST`, role choices restricted to Sales Agent/Operations (matches backend's `validate_role`). The granular permissions-toggle UI is removed. |

`AdminGuideDetail.tsx` and any other detail/drill-down pages not listed
above stay on mock data for this pass (they weren't named in the design
discussion and pull in fields — reviews, active bookings — the backend
doesn't have).

## Error handling

- Every list/detail fetch has three states beyond the happy path: loading
  (skeleton), empty (no items), and error (network failure or 5xx) — never
  a silent blank page.
- A 401 on a protected page, after the one silent-refresh attempt fails,
  redirects to `/sign-in`.
- A 403 on an admin/guide-only write action shows an inline "not authorized"
  message rather than crashing or silently no-op'ing.

## Testing

- Backend: `APITestCase` coverage for `MeView` (200 authenticated / 401
  anonymous) and the new `GET /api/users/` list (200 admin, 401 anonymous,
  403 non-admin, correct field shape, excludes tourists/guides).
- Frontend: no automated test framework exists in this repo; verification
  is manual in-browser per page (dev server + backend dev server running
  together), covering the golden path and the loading/empty/error/401/403
  states called out above.
