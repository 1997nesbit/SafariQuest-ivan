import { useCallback } from 'react'
import { getHomepageImages, type HomepageSlot } from '../api/homepage'
import { SITE_IMAGE_DEFAULTS } from '../data/siteImageDefaults'
import { useFetch } from './useFetch'

export interface SiteImage {
  image: string
  alt: string
}

/**
 * Resolves the site's fixed photo spots: the admin's replacement if one has been
 * saved, otherwise the built-in placeholder from SITE_IMAGE_DEFAULTS. While the request is in
 * flight (or if it fails) the placeholder is used, so a page never renders a
 * broken image waiting on this.
 */
export function useSiteImages(): (slot: HomepageSlot, defaultAlt: string) => SiteImage {
  const { data } = useFetch(getHomepageImages, [])
  return useCallback(
    (slot, defaultAlt) => {
      const saved = data?.[slot]
      return { image: saved?.image || SITE_IMAGE_DEFAULTS[slot], alt: saved?.alt || defaultAlt }
    },
    [data],
  )
}
