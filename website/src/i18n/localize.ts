import type { To } from 'react-router-dom'
import type { Locale } from './locales'

export function localize(locale: Locale, to: To): To {
  if (typeof to !== 'string') return to
  if (!to.startsWith('/') || to.startsWith('//')) return to
  return `/${locale}${to}`
}

/** /guide, /agent and /admin are deliberately unprefixed portals outside the
 * locale route tree (see App.tsx); everything else lives under /:locale. */
const PORTAL_PATH = /^\/(guide|agent|admin)(\/|$|\?)/

/** Prefixes the locale onto a site path unless it belongs to an unprefixed portal.
 * For paths that may point either way: a user's landing page (AuthResult.home) or a
 * sign-in ?next= target. */
export function localizeHome(locale: Locale, path: string): string {
  return PORTAL_PATH.test(path) ? path : `/${locale}${path}`
}
