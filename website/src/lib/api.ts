function stripTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

// vite.config.ts refuses to build without VITE_API_URL, so this fallback only
// ever applies to `vite dev`. The trailing slash is trimmed because every
// caller passes a path that already starts with one. Trimmed with a loop
// rather than a /\/+$/ regex — flagged as super-linear-backtracking-prone by
// static analysis, so avoided rather than argued with.
const API_BASE = stripTrailingSlashes(import.meta.env.VITE_API_URL ?? 'http://localhost:8000')

// Without this, a hung backend (or a dropped connection that never resolves)
// left every caller's loading state true forever, with no error and no way
// out — indistinguishable from "still loading". Uploads get a longer budget:
// an 8MB image (uploads.ImageUploadView's cap) over a slow connection can
// genuinely take longer than an ordinary JSON request.
const DEFAULT_TIMEOUT_MS = 20_000
const UPLOAD_TIMEOUT_MS = 60_000

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
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

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// The API authenticates with an httpOnly cookie, so it enforces CSRF on every
// unsafe request. The token can't be read out of the csrftoken cookie here:
// this app is served from a different origin than the API, and document.cookie
// only exposes cookies belonging to the reading document's own origin. So we ask
// the API for the value, keep it in memory, and echo it back in the header —
// the cookie itself still rides along and is what the server compares against.
let csrfToken: string | null = null
let csrfInFlight: Promise<string | null> | null = null

function fetchCsrfToken(): Promise<string | null> {
  if (!csrfInFlight) {
    csrfInFlight = fetch(`${API_BASE}/api/auth/csrf/`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { csrfToken?: string } | null) => {
        csrfToken = body?.csrfToken ?? null
        return csrfToken
      })
      .catch(() => null)
      .finally(() => {
        csrfInFlight = null
      })
  }
  return csrfInFlight
}

interface Retried {
  auth?: boolean
  csrf?: boolean
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retried: Retried = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const isUnsafe = UNSAFE_METHODS.has(method)

  const csrfHeader: Record<string, string> = {}
  if (isUnsafe) {
    const token = csrfToken ?? (await fetchCsrfToken())
    if (token) csrfHeader['X-CSRFToken'] = token
  }

  // Each retry below (auth refresh, CSRF re-fetch) makes its own recursive
  // request() call, so it gets its own fresh timeout window rather than
  // inheriting whatever was left of this one.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      signal: init.signal ?? controller.signal,
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...csrfHeader,
        ...init.headers,
      },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'The request took too long and was cancelled. Check your connection and try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  const isAuthEndpoint = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/refresh')
  if (response.status === 401 && !retried.auth && !isAuthEndpoint) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      return request<T>(path, init, { ...retried, auth: true }, timeoutMs)
    }
  }

  // A rotated server secret or an expired token invalidates the cached value,
  // which comes back as a 403. Re-fetch and retry once rather than making the
  // user reload the page. Narrowed to CSRF failures so a genuine permission
  // denial isn't paying for a pointless second round trip.
  if (response.status === 403 && !retried.csrf && isUnsafe) {
    const body = await response.clone().text()
    if (body.includes('CSRF')) {
      csrfToken = null
      const token = await fetchCsrfToken()
      if (token) {
        return request<T>(path, init, { ...retried, csrf: true }, timeoutMs)
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      onUnauthorized?.()
    }
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') return body.detail
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      // DRF normally returns one array of messages per invalid field, but a
      // ValidationError({...}) raised by hand outside is_valid()'s own
      // validation pass (e.g. from inside a serializer's create()) skips
      // that normalization and can carry a bare string instead of a
      // single-item array — accept either shape rather than silently
      // dropping the message and falling back to a bare "Bad Request".
      // This used to read only the first field and drop the rest — fine
      // when exactly one field is wrong (the common case, kept below with
      // no format change), but a form with several invalid fields only ever
      // heard about one of them, fixed one, resubmitted, and got told about
      // the next.
      const fieldErrors = Object.entries(body)
        .map(([field, value]) => {
          const message =
            Array.isArray(value) && typeof value[0] === 'string'
              ? value[0]
              : typeof value === 'string'
                ? value
                : null
          return message ? { field, message } : null
        })
        .filter((entry): entry is { field: string; message: string } => entry !== null)

      if (fieldErrors.length === 1) return fieldErrors[0].message
      if (fieldErrors.length > 1) {
        return fieldErrors.map(({ field, message }) => `${field}: ${message}`).join(' ')
      }
    }
  } catch {
    // no JSON body — fall through
  }
  return response.statusText || `Request failed with status ${response.status}`
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

// Mirrors backend/config/pagination.py: StandardPagination.page_size. Used only
// for the "X-Y of N" display math in Pager — the server enforces the real limit.
export const STANDARD_PAGE_SIZE = 25

/** One page of a DRF-paginated list response (config.pagination.StandardPagination). */
export interface Page<T> {
  results: T[]
  count: number
  hasNext: boolean
  hasPrevious: boolean
}

interface PageApiShape<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

/** Like apiGet, but for an endpoint paginated by StandardPagination. `path`
 * should already carry a `page` (and any filter) query param — this only
 * normalizes the envelope, it does not build the query string itself, since
 * each caller's filters differ. */
export async function apiGetPage<T>(path: string): Promise<Page<T>> {
  const raw = await request<PageApiShape<T>>(path)
  return { results: raw.results, count: raw.count, hasNext: raw.next !== null, hasPrevious: raw.previous !== null }
}

/** Fetches every page of a paginated endpoint and flattens it into one array.
 *
 * For the handful of callers of a paginated endpoint whose data is small and
 * bounded by nature (a customer's own bookings, a guide's own schedule) — not
 * for admin-scale browsing, which should use apiGetPage directly with a real
 * pager instead of loading everything into memory. `params` is mutated (page
 * and page_size are set/overwritten on it).
 */
export async function apiGetAllPages<T>(path: string, params: URLSearchParams): Promise<T[]> {
  const pageSize = 100
  params.set('page_size', String(pageSize))
  const all: T[] = []
  let page = 1
  for (;;) {
    params.set('page', String(page))
    const result = await apiGetPage<T>(`${path}?${params.toString()}`)
    all.push(...result.results)
    if (!result.hasNext) return all
    page += 1
  }
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

export function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: 'POST', body: formData }, {}, UPLOAD_TIMEOUT_MS)
}
