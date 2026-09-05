# Frontend-Backend Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data in `website/` with live calls to the Django backend in `backend/`, for auth, destinations, safaris, pricing seasons, guides, and users — everything the backend currently supports.

**Architecture:** Two small backend additions (`GET /api/auth/me/`, `GET /api/users/`) land first. Then a thin frontend API layer (`src/lib/api.ts` low-level client + `useFetch` hook + per-resource typed modules under `src/api/`) that maps backend snake_case fields onto the exact camelCase shapes the existing components already expect, so most pages need only their data source swapped, not rewritten. `AuthContext` + `RequireRole` guard the `/admin` and `/guide` route trees. AdminPricing and AdminUsers are rebuilt (per an explicit scope decision) to match what the backend actually models.

**Tech Stack:** React 19, TypeScript, react-router-dom v7, native `fetch` (no new dependency), Django backend already built.

## Global Constraints

- Backend lives at `backend/`, frontend at `website/` — this plan touches both.
- Every network call from the frontend sends `credentials: 'include'` so the backend's HttpOnly cookies flow.
- A `401` (except from `/api/auth/login/` or `/api/auth/refresh/` themselves) triggers exactly one silent `POST /api/auth/refresh/` retry before giving up.
- Backend DRF `DecimalField`s (`rating`, `multiplier`) serialize as JSON strings — every frontend type mapping must `Number(...)` them.
- Out of scope: bookings, inquiries, invoicing, complaints, finance/analytics, trips, guide reviews, FAQs, content builder, Google OAuth, granular RBAC permissions, password-set flow for invited users. Their pages are untouched.
- No new frontend test framework — verification is manual, in-browser, against both dev servers running together.

---

### Task 1: Backend — `GET /api/auth/me/`

**Files:**
- Modify: `backend/accounts/views.py`
- Modify: `backend/accounts/urls.py`
- Create: `backend/accounts/tests/test_me.py`

**Interfaces:**
- Produces: `GET /api/auth/me/` → `accounts.views.MeView`, registered as `path("me/", MeView.as_view(), name="me")` in `accounts/urls.py` (already included at `api/auth/` in `config/urls.py` — no change needed there).

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_me.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class MeViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("me")
        self.user = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide")

    def test_anonymous_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_returns_role(self):
        self.client.post(reverse("login"), {"email": "guide@example.com", "password": "pw12345"})
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "guide"})

    def test_works_after_silent_refresh(self):
        self.client.post(reverse("login"), {"email": "guide@example.com", "password": "pw12345"})
        self.client.cookies[__import__("django.conf", fromlist=["settings"]).settings.AUTH_COOKIE_ACCESS] = "garbage"
        refresh_response = self.client.post(reverse("refresh"))
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"role": "guide"})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_me
```

Expected: FAIL — `NoReverseMatch: 'me' is not a registered namespace`.

- [ ] **Step 3: Write the view**

Append to `backend/accounts/views.py`:

```python
from rest_framework.permissions import IsAuthenticated


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"role": request.user.role}, status=status.HTTP_200_OK)
```

- [ ] **Step 4: Wire up the URL**

`backend/accounts/urls.py`:

```python
from django.urls import path

from .views import LoginView, LogoutView, MeView, RefreshView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
]
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_me
```

Expected: `Ran 3 tests ... OK`

- [ ] **Step 6: Run the full backend test suite**

```bash
cd backend
.venv/Scripts/python manage.py test
```

Expected: all tests pass (51 total — 50 existing + 1 new file's 3, minus none removed... confirm the exact count in your output, just ensure zero failures).

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/views.py accounts/urls.py accounts/tests/test_me.py
git commit -m "feat(accounts): add GET /api/auth/me/ for session restore"
```

---

### Task 2: Backend — `GET /api/users/` (list, admin-only)

**Files:**
- Modify: `backend/accounts/serializers.py`
- Modify: `backend/accounts/views.py`
- Create: `backend/accounts/tests/test_users_list.py`

**Interfaces:**
- Consumes: `accounts.permissions.IsAdminRole` (existing).
- Produces: `GET /api/users/` → `accounts.views.UserInviteView` (converted from `CreateAPIView` to `ListCreateAPIView`), returning a JSON array of `{id, name, email, role}` for users whose `role` is `sales`, `operations`, or `admin` (i.e. staff — excludes `tourist`/`guide`). `POST /api/users/` behavior is unchanged.

- [ ] **Step 1: Write the failing test**

`backend/accounts/tests/test_users_list.py`:

```python
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("invite-user")
        self.admin = User.objects.create_user(email="admin@example.com", password="pw12345", role="admin", name="Admin One")
        self.sales = User.objects.create_user(email="sales@example.com", password="pw12345", role="sales", name="Sales One")
        self.tourist = User.objects.create_user(email="tourist@example.com", password="pw12345", role="tourist", name="Tourist One")
        self.guide = User.objects.create_user(email="guide@example.com", password="pw12345", role="guide", name="Guide One")

    def _login_as(self, user):
        self.client.post(reverse("login"), {"email": user.email, "password": "pw12345"})

    def test_anonymous_cannot_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_list(self):
        self._login_as(self.sales)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_sees_only_staff_roles(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = {row["email"] for row in response.data}
        self.assertEqual(emails, {"admin@example.com", "sales@example.com"})
        self.assertNotIn("tourist@example.com", emails)
        self.assertNotIn("guide@example.com", emails)

    def test_list_response_shape_has_no_password_fields(self):
        self._login_as(self.admin)
        response = self.client.get(self.url)
        row = next(r for r in response.data if r["email"] == "sales@example.com")
        self.assertEqual(set(row.keys()), {"id", "name", "email", "role"})

    def test_post_still_creates_a_user(self):
        self._login_as(self.admin)
        response = self.client.post(self.url, {"email": "new@example.com", "name": "New", "role": "operations"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_users_list
```

Expected: FAIL — `test_admin_sees_only_staff_roles` gets a `405 Method Not Allowed` (GET isn't implemented on the current `CreateAPIView`).

- [ ] **Step 3: Add the list serializer**

Append to `backend/accounts/serializers.py`:

```python
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email", "role"]
```

- [ ] **Step 4: Convert the view to list + create**

In `backend/accounts/views.py`, replace the `UserInviteView` class with:

```python
STAFF_ROLES = ("sales", "operations", "admin")


class UserInviteView(generics.ListCreateAPIView):
    permission_classes = [IsAdminRole]
    queryset = User.objects.filter(role__in=STAFF_ROLES).order_by("name")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserInviteSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        send_mail(
            subject="You've been invited to SafariQuest",
            message=(
                f"Hi {user.name or user.email},\n\n"
                f"You've been invited to join SafariQuest as {user.get_role_display()}. "
                "An administrator will help you set up access."
            ),
            from_email=None,
            recipient_list=[user.email],
        )
```

Add the needed imports at the top of `backend/accounts/views.py`:

```python
from django.contrib.auth import get_user_model

from .serializers import LoginSerializer, UserInviteSerializer, UserListSerializer

User = get_user_model()
```

(Remove any now-duplicate `UserInviteSerializer` import if one already exists — keep a single import line.)

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend
.venv/Scripts/python manage.py test accounts.tests.test_users_list
```

Expected: `Ran 5 tests ... OK`

- [ ] **Step 6: Run the full backend test suite**

```bash
cd backend
.venv/Scripts/python manage.py test
```

Expected: all tests pass, zero failures (including the pre-existing `test_users.py` invite tests — confirm they still pass unchanged, since `POST` behavior didn't change).

- [ ] **Step 7: Commit**

```bash
cd backend
git add accounts/serializers.py accounts/views.py accounts/tests/test_users_list.py
git commit -m "feat(accounts): add GET /api/users/ admin-only staff list"
```

---

### Task 3: Frontend — core API client and fetch hook

**Files:**
- Create: `website/.env`
- Create: `website/.env.example`
- Modify: `website/.gitignore` (or create if absent — check first)
- Create: `website/src/lib/api.ts`
- Create: `website/src/lib/useFetch.ts`

**Interfaces:**
- Produces: `apiGet<T>(path)`, `apiPost<T>(path, body?)`, `apiPatch<T>(path, body)`, `apiDelete(path)`, `ApiError` (class with `.status`), all in `website/src/lib/api.ts`. `useFetch<T>(fetcher: () => Promise<T>, deps: unknown[])` returning `{data: T | null, loading: boolean, error: string | null, refetch: () => void}` in `website/src/lib/useFetch.ts`.

- [ ] **Step 1: Check for an existing `.gitignore` in `website/`**

```bash
cat website/.gitignore
```

If `.env` is not already ignored there, add a line `\n.env\n` to `website/.gitignore`. `backend/`'s own `.gitignore` is separate and doesn't cover this directory.

- [ ] **Step 2: Create the env files**

`website/.env`:

```env
VITE_API_URL=http://localhost:8000
```

`website/.env.example`:

```env
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 3: Write the low-level API client**

`website/src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

let refreshInFlight: Promise<boolean> | null = null

function attemptRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') return body.detail
  } catch {
    // no JSON body — fall through
  }
  return response.statusText || `Request failed with status ${response.status}`
}

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  const isAuthEndpoint = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/refresh')
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      return request<T>(path, init, true)
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: 'DELETE' })
}
```

- [ ] **Step 4: Write the fetch hook**

`website/src/lib/useFetch.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from './api'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, refetch }
}
```

- [ ] **Step 5: Verify it compiles**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors (these two files aren't imported anywhere yet, so this just checks their own syntax/types compile standalone — `tsc -b` will still type-check the whole project; confirm no new errors were introduced compared to before this task).

- [ ] **Step 6: Commit**

```bash
cd website
git add .env.example .gitignore src/lib/api.ts src/lib/useFetch.ts
git commit -m "feat(api): add typed fetch client with silent-refresh-on-401"
```

(`.env` itself is gitignored and intentionally not committed.)

---

### Task 4: Frontend — auth context, session restore, and route guards

**Files:**
- Create: `website/src/api/auth.ts`
- Create: `website/src/auth/AuthContext.tsx`
- Create: `website/src/auth/RequireRole.tsx`
- Modify: `website/src/App.tsx`

**Interfaces:**
- Consumes: `apiGet`/`apiPost` from `../lib/api` (Task 3).
- Produces: `website/src/api/auth.ts` exports `type Role = 'tourist' | 'guide' | 'sales' | 'operations' | 'admin'`, `login(email, password): Promise<{role: Role}>`, `logout(): Promise<void>`, `fetchMe(): Promise<{role: Role}>`. `website/src/auth/AuthContext.tsx` exports `AuthProvider` and `useAuth(): {role: Role | null, isLoading: boolean, login: typeof login, logout: () => Promise<void>}`. `website/src/auth/RequireRole.tsx` exports `RequireRole({allow}: {allow: Role[]})` — a layout route component (renders `<Outlet/>` or redirects).

- [ ] **Step 1: Write the auth API module**

`website/src/api/auth.ts`:

```typescript
import { apiGet, apiPost } from '../lib/api'

export type Role = 'tourist' | 'guide' | 'sales' | 'operations' | 'admin'

interface RoleResponse {
  role: Role
}

export function login(email: string, password: string): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/api/auth/login/', { email, password })
}

export function logout(): Promise<void> {
  return apiPost<void>('/api/auth/logout/')
}

export function fetchMe(): Promise<RoleResponse> {
  return apiGet<RoleResponse>('/api/auth/me/')
}
```

- [ ] **Step 2: Write the AuthContext**

`website/src/auth/AuthContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, login as apiLogin, logout as apiLogout, type Role } from '../api/auth'
import { ApiError } from '../lib/api'

interface AuthContextValue {
  role: Role | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<Role>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((res) => {
        if (!cancelled) setRole(res.role)
      })
      .catch((err: unknown) => {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          // Unexpected error (network down, etc.) — still treat as signed out,
          // but don't hide it from the console.
          console.error('Failed to restore session', err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string): Promise<Role> {
    const res = await apiLogin(email, password)
    setRole(res.role)
    return res.role
  }

  async function logout(): Promise<void> {
    setRole(null)
    try {
      await apiLogout()
    } catch (err) {
      console.error('Logout request failed (session cleared client-side regardless)', err)
    }
  }

  return <AuthContext.Provider value={{ role, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
```

- [ ] **Step 3: Write the route guard**

`website/src/auth/RequireRole.tsx`:

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from '../api/auth'

export function RequireRole({ allow }: { allow: Role[] }) {
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 4: Wire `AuthProvider` and guards into `App.tsx`**

In `website/src/App.tsx`:

Add imports near the top (after the existing page imports):

```typescript
import { AuthProvider } from './auth/AuthContext'
import { RequireRole } from './auth/RequireRole'
```

Wrap the existing `<Routes>` tree in `<AuthProvider>` — change:

```typescript
    <BrowserRouter>
      <ScrollManager />
```

to:

```typescript
    <BrowserRouter>
      <AuthProvider>
      <ScrollManager />
```

and add the matching closing `</AuthProvider>` immediately before the final `</BrowserRouter>`.

Wrap the `/guide` and `/admin` route trees with the guard. Change:

```typescript
        <Route path="/guide">
          <Route index element={<GuideSchedule />} />
```

to:

```typescript
        <Route path="/guide" element={<RequireRole allow={['guide']} />}>
          <Route index element={<GuideSchedule />} />
```

and change:

```typescript
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
```

to:

```typescript
        <Route element={<RequireRole allow={['sales', 'operations', 'admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
```

Since this second change adds a nesting level, every other `<Route path="..." element={...} />` line currently inside the `/admin` block (from `inquiries` through `users`) must be indented one level deeper, and the block needs one extra closing `</Route>` before the existing closing tag that used to match `<Route path="/admin" ...>`. Read the current file structure carefully (`App.tsx:105-122` in the version before this task) and make sure the JSX nesting balances — the `/admin` routes stay listed in the same order, just one level deeper, with `RequireRole`'s `<Route>` as their new outer wrapper and `AdminLayout`'s `<Route>` immediately inside it.

- [ ] **Step 5: Type-check and manually verify**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors.

Then, with the backend running (`cd backend && .venv/Scripts/python manage.py runserver`) and the frontend dev server running (`cd website && pnpm dev`), open a browser to `http://localhost:5173/admin` while signed out — expect an immediate redirect to `/sign-in` (not a flash of the admin dashboard). Open `http://localhost:5173/guide` while signed out — same expectation.

- [ ] **Step 6: Commit**

```bash
cd website
git add src/api/auth.ts src/auth/AuthContext.tsx src/auth/RequireRole.tsx src/App.tsx
git commit -m "feat(auth): add AuthContext, session restore, and route guards for /admin and /guide"
```

---

### Task 5: Frontend — wire SignIn.tsx to real login

**Files:**
- Modify: `website/src/pages/SignIn.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `../auth/AuthContext` (Task 4).

- [ ] **Step 1: Replace the mock submit handler**

In `website/src/pages/SignIn.tsx`, replace:

```typescript
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeSlash, GoogleLogo } from '@phosphor-icons/react'

type Tab = 'signin' | 'signup'

export function SignIn() {
  const [tab, setTab] = useState<Tab>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // No backend/auth yet — simulate a successful sign-in by entering the account area.
    navigate('/account')
  }
```

with:

```typescript
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeSlash, GoogleLogo } from '@phosphor-icons/react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'

type Tab = 'signin' | 'signup'

const ROLE_HOME: Record<string, string> = {
  tourist: '/account',
  guide: '/guide',
  sales: '/admin',
  operations: '/admin',
  admin: '/admin',
}

export function SignIn() {
  const [tab, setTab] = useState<Tab>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setSubmitting(true)
    try {
      const role = await login(email, password)
      navigate(ROLE_HOME[role] ?? '/account')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Incorrect email or password.' : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
```

- [ ] **Step 2: Wire the form fields' `name` attributes and the submit button's disabled/error state**

The sign-in form (not the sign-up tab, which stays out of scope/mocked) needs `name="email"` and `name="password"` on its inputs so `FormData` can read them, and should show the error/submitting state. Find this block:

```typescript
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="signin-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                  Email Address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  placeholder="explorer@example.com"
                  required
                  autoComplete="email"
                  className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
```

Add `name="email"` to that `<input>`:

```typescript
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="explorer@example.com"
                  required
                  autoComplete="email"
                  className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
```

Find the password input:

```typescript
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
```

Add `name="password"`:

```typescript
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
```

Add an error message and disable the submit button while submitting. Find the submit button:

```typescript
              <button
                type="submit"
                className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                Sign In
                <ArrowRight size={16} />
              </button>
            </form>
```

Replace with:

```typescript
              {error && (
                <p role="alert" className="text-error font-label-sm text-label-sm -mt-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing In…' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>
```

- [ ] **Step 3: Remove the "Continue with Google" button's fake success path**

That button currently calls `navigate('/account')` directly (a leftover from the pre-backend mock). Since Google OAuth is out of scope, change it to a disabled/inert affordance rather than a fake sign-in. Find:

```typescript
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="w-full mt-8 min-h-[44px] border border-sand-stone bg-surface-container-lowest text-on-surface font-label-md py-3 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3"
          >
            <GoogleLogo size={20} />
            Continue with Google
          </button>
```

Replace with:

```typescript
          <button
            type="button"
            disabled
            title="Google sign-in isn't available yet"
            className="w-full mt-8 min-h-[44px] border border-sand-stone bg-surface-container-lowest text-on-surface-variant font-label-md py-3 rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-3"
          >
            <GoogleLogo size={20} />
            Continue with Google
          </button>
```

- [ ] **Step 4: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manually verify in the browser**

With both dev servers running: sign in with a real user's credentials created via `manage.py createsuperuser` (role `admin`) or via the Django admin (`/admin/` on the backend, not the frontend) for a `tourist`/`guide` role — confirm each role lands on the right page (`/account`, `/guide`, `/admin`). Try a wrong password — confirm the inline error appears and the page doesn't navigate.

- [ ] **Step 6: Commit**

```bash
cd website
git add src/pages/SignIn.tsx
git commit -m "feat(sign-in): wire sign-in form to real login, redirect by role"
```

---

### Task 6: Frontend — auth-aware Header and real guide sign-out

**Files:**
- Modify: `website/src/components/Header.tsx`
- Modify: `website/src/pages/guide/GuideProfile.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `../auth/AuthContext` (Task 4).

- [ ] **Step 1: Make the Header reflect real auth state**

In `website/src/components/Header.tsx`, add the import:

```typescript
import { useAuth } from '../auth/AuthContext'
```

Add the hook call inside the `Header` function body, right after `const [menuOpen, setMenuOpen] = useState(false)`:

```typescript
  const { role, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }
```

Add `useNavigate` to the existing `react-router-dom` import:

```typescript
import { NavLink, useNavigate } from 'react-router-dom'
```

Replace the desktop Sign In link:

```typescript
          <NavLink
            to="/sign-in"
            className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <UserCircle size={20} />
            Sign In
          </NavLink>
```

with:

```typescript
          {role ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
            >
              <UserCircle size={20} />
              Sign Out
            </button>
          ) : (
            <NavLink
              to="/sign-in"
              className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
            >
              <UserCircle size={20} />
              Sign In
            </NavLink>
          )}
```

Replace the equivalent mobile-menu Sign In link:

```typescript
          <NavLink
            to="/sign-in"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 ${
                isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
              }`
            }
          >
            <UserCircle size={20} />
            Sign In
          </NavLink>
```

with:

```typescript
          {role ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 text-on-surface-variant hover:bg-surface-container-low"
            >
              <UserCircle size={20} />
              Sign Out
            </button>
          ) : (
            <NavLink
              to="/sign-in"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 ${
                  isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <UserCircle size={20} />
              Sign In
            </NavLink>
          )}
```

- [ ] **Step 2: Wire the guide portal's Sign Out link to real logout**

In `website/src/pages/guide/GuideProfile.tsx`, add the import:

```typescript
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
```

(Merge `useNavigate` into the existing `import { Link } from 'react-router-dom'` line — change it to `import { Link, useNavigate } from 'react-router-dom'`.)

Inside the `GuideProfile` function, near the top, add:

```typescript
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate('/')
  }
```

Replace the Sign Out `Link`:

```typescript
          <Link
            to="/"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-error/30 text-error font-label-md text-label-md"
          >
            <SignOut size={20} />
            Sign Out
          </Link>
```

with:

```typescript
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-error/30 text-error font-label-md text-label-md"
          >
            <SignOut size={20} />
            Sign Out
          </button>
```

- [ ] **Step 3: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify**

Sign in, confirm the header shows "Sign Out" instead of "Sign In" on both desktop and mobile widths. Click it, confirm you land on `/` and the header reverts to "Sign In". Sign in as a guide, go to `/guide/profile`, click Sign Out there too, confirm the same result.

- [ ] **Step 5: Commit**

```bash
cd website
git add src/components/Header.tsx src/pages/guide/GuideProfile.tsx
git commit -m "feat(auth): reflect real sign-in state in Header, wire guide portal sign-out"
```

---

### Task 7: Frontend — wire Destinations and DestinationDetail to the API

**Files:**
- Create: `website/src/api/destinations.ts`
- Modify: `website/src/pages/Destinations.tsx`
- Modify: `website/src/pages/DestinationDetail.tsx`

**Interfaces:**
- Consumes: `apiGet` from `../lib/api`, `useFetch` from `../lib/useFetch` (Task 3).
- Produces: `website/src/api/destinations.ts` exports `interface DestinationExperience {name, description}`, `interface Destination {id, name, images, imageAlt, badge, tags, bestTimeToVisit, highlight, linkLabel, about, wildlife, gettingThere, experiences}` (same shape as the old `data/destinations.ts` types — deliberately, so `DestinationSlideshow` and any other consumer needs no changes), `getDestinations(): Promise<Destination[]>`, `getDestination(id: string): Promise<Destination>`.

- [ ] **Step 1: Write the destinations API module**

`website/src/api/destinations.ts`:

```typescript
import { apiGet } from '../lib/api'

export interface DestinationExperience {
  name: string
  description: string
}

export interface Destination {
  id: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
  about: string
  wildlife: string
  gettingThere: string
  experiences: DestinationExperience[]
}

interface DestinationApiShape {
  slug: string
  name: string
  images: string[]
  image_alt: string
  badge: string
  tags: string[]
  best_time_to_visit: string
  highlight: string
  link_label: string
  about: string
  wildlife: string
  getting_there: string
  experiences: DestinationExperience[]
}

function mapDestination(raw: DestinationApiShape): Destination {
  return {
    id: raw.slug,
    name: raw.name,
    images: raw.images,
    imageAlt: raw.image_alt,
    badge: raw.badge,
    tags: raw.tags,
    bestTimeToVisit: raw.best_time_to_visit,
    highlight: raw.highlight,
    linkLabel: raw.link_label,
    about: raw.about,
    wildlife: raw.wildlife,
    gettingThere: raw.getting_there,
    experiences: raw.experiences,
  }
}

export async function getDestinations(): Promise<Destination[]> {
  const raw = await apiGet<DestinationApiShape[]>('/api/destinations/')
  return raw.map(mapDestination)
}

export async function getDestination(id: string): Promise<Destination> {
  const raw = await apiGet<DestinationApiShape>(`/api/destinations/${id}/`)
  return mapDestination(raw)
}
```

- [ ] **Step 2: Wire `Destinations.tsx`**

Replace the import:

```typescript
import { destinations } from '../data/destinations'
```

with:

```typescript
import { getDestinations } from '../api/destinations'
import { useFetch } from '../lib/useFetch'
```

Inside the `Destinations` function, before the `return`, add:

```typescript
  const { data: destinations, loading, error } = useFetch(getDestinations, [])
```

Wrap the grid section's content to handle the three states. Find:

```typescript
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {destinations.map((destination, i) => (
```

Change the opening of that block to branch on state — replace:

```typescript
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {destinations.map((destination, i) => (
            <Reveal
```

with:

```typescript
        {loading && <p className="text-center text-on-surface-variant py-20">Loading destinations…</p>}
        {error && <p className="text-center text-error py-20">{error}</p>}
        {!loading && !error && destinations && destinations.length === 0 && (
          <p className="text-center text-on-surface-variant py-20">No destinations are available yet.</p>
        )}
        {!loading && !error && destinations && destinations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {destinations.map((destination, i) => (
            <Reveal
```

and find the matching closing of that grid `<div>`:

```typescript
            </Reveal>
          ))}
        </div>
      </section>
```

(the one immediately following the destination card's closing tags, inside the "Explore by Regions" section) — change it to:

```typescript
            </Reveal>
          ))}
        </div>
        )}
      </section>
```

- [ ] **Step 3: Wire `DestinationDetail.tsx`**

Replace the imports:

```typescript
import { destinations } from '../data/destinations'
import { safariPackages } from '../data/safaris'
```

with:

```typescript
import { getDestination, type Destination } from '../api/destinations'
import { getSafaris, type SafariPackage } from '../api/safaris'
import { useFetch } from '../lib/useFetch'
```

Replace the lookup logic:

```typescript
export function DestinationDetail() {
  const { id } = useParams<{ id: string }>()
  const destination = destinations.find((d) => d.id === id)

  if (!destination) {
```

with:

```typescript
export function DestinationDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: destination, loading, error } = useFetch<Destination>(() => getDestination(id!), [id])
  const { data: safariPackages } = useFetch<SafariPackage[]>(getSafaris, [])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !destination) {
```

(the rest of that `if` block — the "Destination Not Found" markup and its closing brace — stays exactly as it is; only the condition changed).

Below that block, the line:

```typescript
  const relatedPackages = safariPackages.filter((p) =>
```

needs `safariPackages` to tolerate `null` while still loading — change to:

```typescript
  const relatedPackages = (safariPackages ?? []).filter((p) =>
```

- [ ] **Step 4: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors (Task 8 creates `../api/safaris` — if you're executing tasks out of order, this step will fail until Task 8 lands; if executing in plan order, Task 8 comes right after this one, so add a note in your task report if you had to stub anything).

- [ ] **Step 5: Manually verify**

With the backend running and at least one destination created (via `POST /api/destinations/` as an admin, or Django admin at `/admin/destinations/destination/add/`), visit `/destinations` and confirm it renders from the API (check the Network tab for the `GET /api/destinations/` call). Visit `/destinations/<slug>` for a real slug and a fake one, confirm the detail and not-found paths both work.

- [ ] **Step 6: Commit**

```bash
cd website
git add src/api/destinations.ts src/pages/Destinations.tsx src/pages/DestinationDetail.tsx
git commit -m "feat(destinations): wire Destinations and DestinationDetail to the live API"
```

---

### Task 8: Frontend — wire Safaris and SafariDetail to the API

**Files:**
- Create: `website/src/api/safaris.ts`
- Modify: `website/src/pages/Safaris.tsx`
- Modify: `website/src/pages/SafariDetail.tsx`
- Modify: `website/src/components/SafariCard.tsx`

**Interfaces:**
- Consumes: `apiGet` from `../lib/api`, `useFetch` from `../lib/useFetch` (Task 3).
- Produces: `website/src/api/safaris.ts` exports `interface ItineraryDay {day, title, description}`, `interface SafariPackage {id, title, image, imageAlt, rating, days, accommodation, price, badge?, signature?, destination, overview, highlights, included, excluded, itinerary}` (same shape as the old `data/safaris.ts` types), `getSafaris(): Promise<SafariPackage[]>`, `getSafari(id: string): Promise<SafariPackage>`.

- [ ] **Step 1: Write the safaris API module**

`website/src/api/safaris.ts`:

```typescript
import { apiGet } from '../lib/api'

export interface ItineraryDay {
  day: number
  title: string
  description: string
}

export interface SafariPackage {
  id: string
  title: string
  image: string
  imageAlt: string
  rating: number
  days: number
  accommodation: string
  price: number
  badge?: string
  signature?: boolean
  destination: string
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

interface SafariApiShape {
  slug: string
  title: string
  image: string
  image_alt: string
  rating: string
  days: number
  accommodation: string
  price: number
  badge: string
  signature: boolean
  destination: string
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

function mapSafari(raw: SafariApiShape): SafariPackage {
  return {
    id: raw.slug,
    title: raw.title,
    image: raw.image,
    imageAlt: raw.image_alt,
    rating: Number(raw.rating),
    days: raw.days,
    accommodation: raw.accommodation,
    price: raw.price,
    badge: raw.badge || undefined,
    signature: raw.signature,
    destination: raw.destination,
    overview: raw.overview,
    highlights: raw.highlights,
    included: raw.included,
    excluded: raw.excluded,
    itinerary: raw.itinerary,
  }
}

export async function getSafaris(): Promise<SafariPackage[]> {
  const raw = await apiGet<SafariApiShape[]>('/api/safaris/')
  return raw.map(mapSafari)
}

export async function getSafari(id: string): Promise<SafariPackage> {
  const raw = await apiGet<SafariApiShape>(`/api/safaris/${id}/`)
  return mapSafari(raw)
}
```

- [ ] **Step 2: Wire `Safaris.tsx`**

Replace the import:

```typescript
import { safariPackages } from '../data/safaris'
```

with:

```typescript
import { getSafaris } from '../api/safaris'
import { useFetch } from '../lib/useFetch'
```

Inside the `Safaris` function, right after the existing `useState` calls (`duration`, `budget`, `destination`), add:

```typescript
  const { data: safariPackages, loading, error } = useFetch(getSafaris, [])
```

Update the `useMemo` to tolerate `null` while loading — replace:

```typescript
  const filtered = useMemo(
    () =>
      safariPackages.filter(
```

with:

```typescript
  const filtered = useMemo(
    () =>
      (safariPackages ?? []).filter(
```

and its dependency array — replace:

```typescript
    [duration, budget, destination],
  )
```

with:

```typescript
    [safariPackages, duration, budget, destination],
  )
```

Wire the loading/error states into the grid section. Find:

```typescript
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        {filtered.length > 0 ? (
```

Replace with:

```typescript
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        {loading && <p className="text-center text-on-surface-variant py-20">Loading safaris…</p>}
        {error && <p className="text-center text-error py-20">{error}</p>}
        {!loading && !error && filtered.length > 0 ? (
```

- [ ] **Step 3: Wire `SafariDetail.tsx`**

Replace the import:

```typescript
import { safariPackages } from '../data/safaris'
```

with:

```typescript
import { getSafari, type SafariPackage } from '../api/safaris'
import { useFetch } from '../lib/useFetch'
```

Replace the lookup logic:

```typescript
export function SafariDetail() {
  const { id } = useParams<{ id: string }>()
  const safari = safariPackages.find((p) => p.id === id)

  if (!safari) {
```

with:

```typescript
export function SafariDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: safari, loading, error } = useFetch<SafariPackage>(() => getSafari(id!), [id])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !safari) {
```

(the rest of that `if` block's markup and closing brace stay unchanged).

- [ ] **Step 4: Update `SafariCard.tsx`'s type import**

Replace:

```typescript
import type { SafariPackage } from '../data/safaris'
```

with:

```typescript
import type { SafariPackage } from '../api/safaris'
```

- [ ] **Step 5: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors (this also resolves the `../api/safaris` dependency Task 7's `DestinationDetail.tsx` needed).

- [ ] **Step 6: Manually verify**

Visit `/safaris`, confirm it loads from the API and the duration/budget/destination filters still work against live data. Visit `/safaris/<slug>` for a real and a fake slug. Visit `/destinations/<slug>` again (from Task 7) and confirm "Safaris to {destination}" now renders using live safari data too.

- [ ] **Step 7: Commit**

```bash
cd website
git add src/api/safaris.ts src/pages/Safaris.tsx src/pages/SafariDetail.tsx src/components/SafariCard.tsx
git commit -m "feat(safaris): wire Safaris and SafariDetail to the live API"
```

---

### Task 9: Frontend — rebuild AdminPricing as real Season CRUD

**Files:**
- Create: `website/src/api/pricing.ts`
- Modify: `website/src/pages/admin/AdminPricing.tsx`

**Interfaces:**
- Consumes: `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from `../lib/api`, `useFetch` from `../lib/useFetch` (Task 3).
- Produces: `website/src/api/pricing.ts` exports `interface Season {id, name, startDate, endDate, multiplier}`, `getSeasons()`, `createSeason(input)`, `updateSeason(id, input)`, `deleteSeason(id)`.

- [ ] **Step 1: Write the pricing API module**

`website/src/api/pricing.ts`:

```typescript
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

export interface Season {
  id: number
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

export interface SeasonInput {
  name: string
  startDate: string
  endDate: string
  multiplier: number
}

interface SeasonApiShape {
  id: number
  name: string
  start_date: string
  end_date: string
  multiplier: string
}

function mapSeason(raw: SeasonApiShape): Season {
  return {
    id: raw.id,
    name: raw.name,
    startDate: raw.start_date,
    endDate: raw.end_date,
    multiplier: Number(raw.multiplier),
  }
}

function toApiPayload(input: SeasonInput) {
  return {
    name: input.name,
    start_date: input.startDate,
    end_date: input.endDate,
    multiplier: input.multiplier,
  }
}

export async function getSeasons(): Promise<Season[]> {
  const raw = await apiGet<SeasonApiShape[]>('/api/pricing/seasons/')
  return raw.map(mapSeason)
}

export async function createSeason(input: SeasonInput): Promise<Season> {
  const raw = await apiPost<SeasonApiShape>('/api/pricing/seasons/', toApiPayload(input))
  return mapSeason(raw)
}

export async function updateSeason(id: number, input: SeasonInput): Promise<Season> {
  const raw = await apiPatch<SeasonApiShape>(`/api/pricing/seasons/${id}/`, toApiPayload(input))
  return mapSeason(raw)
}

export function deleteSeason(id: number): Promise<void> {
  return apiDelete(`/api/pricing/seasons/${id}/`)
}
```

- [ ] **Step 2: Rebuild `AdminPricing.tsx`**

Replace the entire file contents with:

```typescript
import { useState, type FormEvent } from 'react'
import { CalendarBlank, Coins, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react'
import { createSeason, deleteSeason, getSeasons, updateSeason, type Season, type SeasonInput } from '../../api/pricing'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const EMPTY_FORM: SeasonInput = { name: '', startDate: '', endDate: '', multiplier: 1 }

export function AdminPricing() {
  const { data: seasons, loading, error, refetch } = useFetch(getSeasons, [])
  const [editing, setEditing] = useState<Season | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<SeasonInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setCreating(true)
    setEditing(null)
  }

  function openEdit(season: Season) {
    setForm({ name: season.name, startDate: season.startDate, endDate: season.endDate, multiplier: season.multiplier })
    setFormError(null)
    setEditing(season)
    setCreating(false)
  }

  function closeDrawer() {
    setCreating(false)
    setEditing(null)
  }

  async function handleDelete(season: Season) {
    if (!window.confirm(`Delete "${season.name}"?`)) return
    try {
      await deleteSeason(season.id)
      refetch()
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to delete season.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editing) {
        await updateSeason(editing.id, form)
      } else {
        await createSeason(form)
      }
      closeDrawer()
      refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save season.')
    } finally {
      setSubmitting(false)
    }
  }

  const drawerOpen = creating || editing !== null

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-[26px] text-on-surface mb-1">Pricing Engine</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Manage seasonal price multipliers applied across the safari catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-2.5 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shrink-0 shadow-sm"
        >
          <Plus size={18} />
          Add Season
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        {loading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading seasons…</p>}
        {error && <p className="p-10 text-center text-error text-sm">{error}</p>}
        {!loading && !error && seasons && seasons.length === 0 && (
          <p className="p-10 text-center text-on-surface-variant text-sm">No seasons configured yet.</p>
        )}
        {!loading && !error && seasons && seasons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Season</th>
                  <th className="px-5 py-3 font-medium">Date Range</th>
                  <th className="px-5 py-3 font-medium">Multiplier</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {seasons.map((season) => (
                  <tr key={season.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Coins size={18} className="text-savanna-green" />
                        <span className="font-label-md text-sm text-on-surface">{season.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarBlank size={16} />
                        {season.startDate} — {season.endDate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{season.multiplier}x</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openEdit(season)} className="p-1.5 text-outline hover:text-savanna-green rounded transition-colors">
                          <PencilSimple size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(season)} className="p-1.5 text-outline hover:text-error rounded transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={closeDrawer}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0 flex items-center justify-between">
              <h3 className="font-headline-md text-[18px] text-on-surface">{editing ? 'Edit Season' : 'Add Season'}</h3>
              <button type="button" onClick={closeDrawer} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors">
                <X size={20} />
              </button>
            </div>
            <form id="season-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="season-name" className="block font-label-md text-sm text-on-surface mb-1.5">Name</label>
                <input
                  id="season-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="season-start" className="block font-label-md text-sm text-on-surface mb-1.5">Start Date</label>
                  <input
                    id="season-start"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
                <div>
                  <label htmlFor="season-end" className="block font-label-md text-sm text-on-surface mb-1.5">End Date</label>
                  <input
                    id="season-end"
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="season-multiplier" className="block font-label-md text-sm text-on-surface mb-1.5">Multiplier</label>
                <input
                  id="season-multiplier"
                  type="number"
                  step={0.05}
                  min={0}
                  required
                  value={form.multiplier}
                  onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              {formError && <p role="alert" className="text-error font-label-sm text-sm">{formError}</p>}
            </form>
            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeDrawer} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="season-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Saving…' : 'Save Season'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors. If `Trash` isn't exported by the installed `@phosphor-icons/react` version, substitute `TrashSimple` (check `node_modules/@phosphor-icons/react/dist/icons/` for the exact available name before substituting).

- [ ] **Step 4: Manually verify**

Sign in as an admin, visit `/admin/pricing`. Add a season, confirm it appears in the table. Edit it, confirm the multiplier/dates update. Delete it, confirm it's removed. Sign in as a non-admin staff role (sales/operations) and confirm the page still loads (guarded at the route level by Task 4, not per-action here — the backend's `IsAdminRole` will still 403 any sales/operations write attempt if you want to double check that edge case manually).

- [ ] **Step 5: Commit**

```bash
cd website
git add src/api/pricing.ts src/pages/admin/AdminPricing.tsx
git commit -m "feat(admin): rebuild AdminPricing as real Season CRUD against /api/pricing/seasons/"
```

---

### Task 10: Frontend — wire AdminStaffGuides to the API

**Files:**
- Create: `website/src/api/guides.ts`
- Modify: `website/src/pages/admin/AdminStaffGuides.tsx`

**Interfaces:**
- Consumes: `apiGet`/`apiPost` from `../lib/api`, `useFetch` from `../lib/useFetch` (Task 3).
- Produces: `website/src/api/guides.ts` exports `type GuideRole`, `type GuideStatus`, `interface Guide {id, name, role, status, rating}`, `getGuides()`, `createGuide(input)`.

- [ ] **Step 1: Write the guides API module**

`website/src/api/guides.ts`:

```typescript
import { apiGet, apiPost } from '../lib/api'

export type GuideRole = 'Senior Guide' | 'Expert Guide' | 'Driver-Guide' | 'Camp Chef' | 'Tour Helper'
export type GuideStatus = 'Available' | 'On Trip' | 'Off-Duty'

export interface Guide {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: number
}

export interface GuideInput {
  name: string
  role: GuideRole
  status: GuideStatus
}

interface GuideApiShape {
  id: number
  name: string
  role: GuideRole
  status: GuideStatus
  rating: string
}

function mapGuide(raw: GuideApiShape): Guide {
  return { id: raw.id, name: raw.name, role: raw.role, status: raw.status, rating: Number(raw.rating) }
}

export async function getGuides(): Promise<Guide[]> {
  const raw = await apiGet<GuideApiShape[]>('/api/guides/')
  return raw.map(mapGuide)
}

export async function createGuide(input: GuideInput): Promise<Guide> {
  const raw = await apiPost<GuideApiShape>('/api/guides/', input)
  return mapGuide(raw)
}
```

- [ ] **Step 2: Wire `AdminStaffGuides.tsx`**

Replace the import:

```typescript
import { adminStaff, type StaffRole, type StaffStatus } from '../../data/adminStaff'
```

with:

```typescript
import { createGuide, getGuides, type Guide, type GuideRole, type GuideStatus } from '../../api/guides'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
```

Replace every occurrence of the type names `StaffRole` with `GuideRole` and `StaffStatus` with `GuideStatus` in this file (they appear in `ROLES`, `STATUSES`, `ROLE_ICON`, `STATUS_BADGE`, and the `useState` calls) — these are pure renames, the values themselves (`'Senior Guide'`, `'Available'`, etc.) are unchanged.

Inside the `AdminStaffGuides` function, replace:

```typescript
export function AdminStaffGuides() {
  const [role, setRole] = useState<StaffRole | 'All'>('All')
  const [status, setStatus] = useState<StaffStatus | 'All'>('All')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = adminStaff.filter((s) => (role === 'All' || s.role === role) && (status === 'All' || s.status === status))
  const topRated = [...adminStaff].sort((a, b) => b.rating - a.rating).slice(0, 3)
```

with:

```typescript
export function AdminStaffGuides() {
  const [role, setRole] = useState<GuideRole | 'All'>('All')
  const [status, setStatus] = useState<GuideStatus | 'All'>('All')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<GuideRole>('Senior Guide')
  const [addError, setAddError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: guides, loading, error, refetch } = useFetch(getGuides, [])
  const allGuides = guides ?? []
  const filtered = allGuides.filter((s) => (role === 'All' || s.role === role) && (status === 'All' || s.status === status))
  const topRated = [...allGuides].sort((a, b) => b.rating - a.rating).slice(0, 3)

  async function handleAddStaff(event: React.FormEvent) {
    event.preventDefault()
    setAddError(null)
    setSubmitting(true)
    try {
      await createGuide({ name: addName, role: addRole, status: 'Available' })
      setAddOpen(false)
      setAddName('')
      refetch()
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to add staff member.')
    } finally {
      setSubmitting(false)
    }
  }
```

`s.reviewCount` no longer exists on `Guide` (the backend doesn't track it). Find the two places it's rendered:

```typescript
                      <span className="font-label-sm text-xs text-on-surface-variant ml-2">({s.reviewCount} reviews)</span>
```

Delete that whole `<span>` (grid view review count).

```typescript
                      <span className="font-label-sm text-xs text-on-surface-variant">
                        {s.rating} ({s.reviewCount} reviews)
                      </span>
```

Replace with:

```typescript
                      <span className="font-label-sm text-xs text-on-surface-variant">{s.rating}</span>
```

(top-rated sidebar).

Wire the "Add New Staff" button to open the drawer — find:

```typescript
        <button
          type="button"
          className="flex items-center gap-2 bg-savanna-green text-on-primary py-3 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap shrink-0"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
```

Replace with:

```typescript
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-savanna-green text-on-primary py-3 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap shrink-0"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
```

Add loading/error handling right after the filter bar, before the `<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">` line:

```typescript
      {loading && <p className="text-center text-on-surface-variant py-10">Loading staff…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
```

and add the matching closing `)}` right before the file's final closing `</div>\n  )\n}` (the outer wrapper's close) — i.e. after the "Top Guides" sidebar's closing `</div>` and before the component function's own closing `</div>`.

Add the "Add New Staff" drawer markup right before the component's final closing `</div>\n  )\n}`, after the change above:

```typescript
      {addOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
              <h3 className="font-headline-md text-[18px] text-on-surface">Add New Staff</h3>
            </div>
            <form id="add-staff-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleAddStaff}>
              <div>
                <label htmlFor="staff-name" className="block font-label-md text-sm text-on-surface mb-1.5">Full Name</label>
                <input
                  id="staff-name"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="staff-role" className="block font-label-md text-sm text-on-surface mb-1.5">Role</label>
                <select
                  id="staff-role"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as GuideRole)}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                >
                  {(['Senior Guide', 'Expert Guide', 'Driver-Guide', 'Camp Chef', 'Tour Helper'] as GuideRole[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {addError && <p role="alert" className="text-error font-label-sm text-sm">{addError}</p>}
            </form>
            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="add-staff-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
```

Add `import type { FormEvent } from 'react'` if using `React.FormEvent` didn't already resolve (prefer `event: FormEvent` with a named import, consistent with the rest of the codebase's style — adjust the `handleAddStaff` signature accordingly: `async function handleAddStaff(event: FormEvent) {`).

- [ ] **Step 3: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify**

Sign in as admin, visit `/admin/guides`. Confirm the grid/list views render live guides, filters work, top-rated sidebar shows real data. Click "Add New Staff", submit a new guide, confirm it appears in the list after the drawer closes.

- [ ] **Step 5: Commit**

```bash
cd website
git add src/api/guides.ts src/pages/admin/AdminStaffGuides.tsx
git commit -m "feat(admin): wire AdminStaffGuides to the live /api/guides/ endpoint"
```

---

### Task 11: Frontend — wire AdminUsers to the API

**Files:**
- Create: `website/src/api/users.ts`
- Modify: `website/src/pages/admin/AdminUsers.tsx`

**Interfaces:**
- Consumes: `apiGet`/`apiPost` from `../lib/api`, `useFetch` from `../lib/useFetch` (Task 3).
- Produces: `website/src/api/users.ts` exports `type StaffRole = 'sales' | 'operations' | 'admin'`, `interface AdminUserRecord {id, name, email, role}`, `getUsers()`, `inviteUser(input: {name, email, role: 'sales' | 'operations'})`.

- [ ] **Step 1: Write the users API module**

`website/src/api/users.ts`:

```typescript
import { apiGet, apiPost } from '../lib/api'

export type StaffRole = 'sales' | 'operations' | 'admin'
export type InvitableRole = 'sales' | 'operations'

export interface AdminUserRecord {
  id: number
  name: string
  email: string
  role: StaffRole
}

export interface InviteUserInput {
  name: string
  email: string
  role: InvitableRole
}

export function getUsers(): Promise<AdminUserRecord[]> {
  return apiGet<AdminUserRecord[]>('/api/users/')
}

export function inviteUser(input: InviteUserInput): Promise<AdminUserRecord> {
  return apiPost<AdminUserRecord>('/api/users/', input)
}
```

- [ ] **Step 2: Rebuild `AdminUsers.tsx`**

Replace the entire file contents with:

```typescript
import { useState, type FormEvent } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { getUsers, inviteUser, type AdminUserRecord, type InvitableRole, type StaffRole } from '../../api/users'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administrator',
  sales: 'Sales Agent',
  operations: 'Operations',
}

const ROLE_BADGE: Record<StaffRole, string> = {
  admin: 'bg-terracotta/15 text-terracotta',
  sales: 'bg-golden-sun/15 text-secondary',
  operations: 'bg-savanna-green/15 text-savanna-green',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminUsers() {
  const { data: users, loading, error, refetch } = useFetch(getUsers, [])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('sales')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openCreate() {
    setName('')
    setEmail('')
    setRole('sales')
    setFormError(null)
    setCreating(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await inviteUser({ name, email, role })
      setCreating(false)
      refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to invite user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Users &amp; Roles</h2>
          <p className="text-on-surface-variant text-sm">Manage staff accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          Invite Staff
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        {loading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading users…</p>}
        {error && <p className="p-10 text-center text-error text-sm">{error}</p>}
        {!loading && !error && users && users.length === 0 && (
          <p className="p-10 text-center text-on-surface-variant text-sm">No staff accounts yet.</p>
        )}
        {!loading && !error && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {users.map((u: AdminUserRecord) => (
                  <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_BADGE[u.role]}`}>
                          {initials(u.name || u.email)}
                        </div>
                        <span className="font-label-md text-sm text-on-surface">{u.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={() => setCreating(false)}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-[18px] text-on-surface">Invite Staff</h3>
                <button type="button" onClick={() => setCreating(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-on-surface-variant text-sm">Send an invite to a new Sales Agent or Operations staff member.</p>
            </div>

            <form id="invite-user-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-user-name" className="block font-label-md text-sm text-on-surface mb-1.5">Full Name</label>
                <input
                  id="new-user-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              <div>
                <label htmlFor="new-user-email" className="block font-label-md text-sm text-on-surface mb-1.5">Email Address</label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pandewildernesssafari.com"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              <div>
                <p className="block font-label-md text-sm text-on-surface mb-2">Role</p>
                <div className="flex gap-2">
                  {(['sales', 'operations'] as InvitableRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-label-md transition-colors ${
                        role === r ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p role="alert" className="text-error font-label-sm text-sm">{formError}</p>}
            </form>

            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="invite-user-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

Note: the "Activity Log" sidebar from the old version is removed entirely — it depended on a `lastActive` field the backend doesn't track (per the design spec's explicit scope decision), and there's no other data to replace it with in this pass.

- [ ] **Step 3: Type-check**

```bash
cd website
pnpm exec tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify**

Sign in as admin, visit `/admin/users`. Confirm the table shows real staff accounts (create one via `manage.py createsuperuser` beforehand if the table is empty). Click "Invite Staff", submit a Sales Agent invite, confirm it appears in the table after the drawer closes. Confirm the backend console (wherever `runserver` is running) printed the invite email via the console email backend.

- [ ] **Step 5: Commit**

```bash
cd website
git add src/api/users.ts src/pages/admin/AdminUsers.tsx
git commit -m "feat(admin): wire AdminUsers to the live /api/users/ endpoint, drop mock RBAC UI"
```

---

### Task 12: Full verification pass and cleanup

**Files:**
- None created — this task is verification only, plus removing now-dead mock data files if nothing else references them.

**Interfaces:**
- Consumes: everything from Tasks 1–11.

- [ ] **Step 1: Confirm no remaining references to the old mock data for wired resources**

```bash
cd website
grep -rn "from '../data/destinations'" src/ --include=*.tsx --include=*.ts
grep -rn "from '../data/safaris'" src/ --include=*.tsx --include=*.ts
grep -rn "from '../data/adminStaff'" src/ --include=*.tsx --include=*.ts
grep -rn "from '../data/adminUsers'" src/ --include=*.tsx --include=*.ts
```

Expected: no matches (adjust the relative `../` depth per the grep tool's actual working directory — use `grep -rn "data/destinations'"` etc. without the leading `../` to catch every import depth if the above returns nothing but you're unsure).

- [ ] **Step 2: Run the full type-check and lint**

```bash
cd website
pnpm exec tsc -b --noEmit
pnpm run lint
```

Expected: zero errors from both. Fix anything that surfaces (most likely: an unused import left behind from a Task 7-11 edit) before proceeding.

- [ ] **Step 3: Full backend test suite (confirm the two new backend endpoints didn't regress anything)**

```bash
cd backend
.venv/Scripts/python manage.py test
```

Expected: all tests pass, zero failures.

- [ ] **Step 4: Manual end-to-end smoke test**

With both dev servers running (`backend`: `manage.py runserver`; `website`: `pnpm dev`):

1. Seed a small dataset: one `Destination`, one `SafariPackage` (with 2+ itinerary days), one `Season`, one `Guide`, and (via `createsuperuser`) one admin user — either via the Django admin at `http://localhost:8000/admin/` or via the API directly with a signed-in admin session.
2. Sign out (if signed in), visit `/`, confirm the Destinations and Safaris sections of the homepage/nav still work (spot-check any homepage carousel that also reads from `data/destinations.ts`/`data/safaris.ts` — if `Home.tsx` wasn't in this plan's scope, note it as a follow-up rather than silently leaving it half-wired; check `website/src/pages/Home.tsx` for `from '../data/destinations'` or `from '../data/safaris'` imports and report what you find).
3. Sign in as the seeded admin, confirm redirect to `/admin`, confirm `/admin/pricing`, `/admin/guides`, `/admin/users` all show live data.
4. Sign out, confirm the header reverts and `/admin` now redirects to `/sign-in`.
5. Restart the frontend dev server (simulating a page reload with an existing session) after signing in again — confirm the session is restored (still shows signed-in state, doesn't bounce to `/sign-in`) via the `GET /api/auth/me/` call on load.

- [ ] **Step 5: Report findings on `Home.tsx`**

If Step 4.2 found that `Home.tsx` (or any other page not in this plan's task list) also imports from `data/destinations.ts` or `data/safaris.ts`, do not silently modify it — this plan's scope was explicitly agreed with the user as the pages listed in Tasks 5–11. Note it in your final report as a follow-up item instead.

- [ ] **Step 6: Commit (if Step 1's grep required any cleanup, or if nothing needs committing, skip this step)**

```bash
cd website
git add -A
git commit -m "chore: verify frontend-backend wiring end to end"
```

(Only run this if there are actual changes from Step 1/2 cleanup — an empty `git status` means nothing to commit here, which is fine.)

---

## Self-Review Notes

- **Spec coverage:** Backend additions (`/api/auth/me/`, `/api/users/` list) → Tasks 1–2. API client/hook → Task 3. Auth context/guards → Task 4. SignIn → Task 5. Header/guide sign-out → Task 6. Destinations/DestinationDetail → Task 7. Safaris/SafariDetail/SafariCard → Task 8. AdminPricing rebuild → Task 9. AdminStaffGuides → Task 10. AdminUsers rebuild → Task 11. Verification → Task 12. Every page named in the spec's page-by-page table has a task.
- **Placeholder scan:** no TBD/TODO markers; every step has complete code, not descriptions of code.
- **Type consistency:** `Destination`/`SafariPackage`/`ItineraryDay`/`DestinationExperience` types are defined once (Tasks 7–8) and reused by their exact names in dependent tasks (`DestinationDetail.tsx` importing `SafariPackage` from `../api/safaris` in Task 7, `SafariCard.tsx`'s import swap in Task 8). `ApiError`, `apiGet`/`apiPost`/`apiPatch`/`apiDelete`, and `useFetch` (Task 3) are referenced by identical names throughout Tasks 4–11. `useAuth()`'s return shape (`role`, `isLoading`, `login`, `logout`) is defined once in Task 4 and consumed identically in Tasks 5–6.
