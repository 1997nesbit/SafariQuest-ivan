import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { NavigateOptions, To } from 'react-router-dom'
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from './locales'
import { localize, localizeHome } from './localize'

// Locale branches are static path segments (`path="fr"`, not `path=":lang"`), so there's
// no route param to read via useParams() — the active locale is the URL's first segment.
export function useCurrentLocale(): Locale {
  const { pathname } = useLocation()
  const first = pathname.split('/')[1]
  return isSupportedLocale(first) ? first : DEFAULT_LOCALE
}

interface LocalizedNavigateFunction {
  (to: To, options?: NavigateOptions): void | Promise<void>
  (delta: number): void | Promise<void>
}

export function useLocalizedNavigate(): LocalizedNavigateFunction {
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') return navigate(to)
      return navigate(localize(locale, to), options)
    },
    [navigate, locale],
  )
}

/** Navigates to a user's landing page (AuthResult.home), prefixing the locale only
 * where the route tree expects one — see localizeHome. */
export function useHomeNavigate() {
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  return useCallback((home: string) => navigate(localizeHome(locale, home)), [navigate, locale])
}
