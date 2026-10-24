import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

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
  galleryImages: string[]
  rating: number
  days: number
  accommodation: string
  price: number
  priceUsd: number | null
  badge?: string
  signature?: boolean
  destination: string
  parks: string[]
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
  gallery_images: string[]
  rating: string
  days: number
  accommodation: string
  price: number
  price_usd: number | null
  badge: string
  signature: boolean
  destination: string
  parks: string[]
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

function mapSafari(raw: SafariApiShape): SafariPackage {
  return fromApiShape<SafariApiShape, SafariPackage>(
    raw,
    {
      id: (r) => r.slug,
      rating: (r) => Number(r.rating),
      // '' from the API means "no badge" — kept as undefined rather than an
      // empty string so consumers can write `{safari.badge && <Badge/>}`.
      badge: (r) => r.badge || undefined,
    },
    ['slug'],
  )
}

export async function getSafaris(): Promise<SafariPackage[]> {
  const raw = await apiGet<SafariApiShape[]>('/api/safaris/')
  return raw.map(mapSafari)
}

export async function getSafari(id: string): Promise<SafariPackage> {
  const raw = await apiGet<SafariApiShape>(`/api/safaris/${id}/`)
  return mapSafari(raw)
}

export interface SafariPackageInput {
  slug: string
  title: string
  image: string
  imageAlt: string
  galleryImages: string[]
  rating: number
  days: number
  accommodation: string
  price: number
  priceUsd: number | null
  badge?: string
  signature: boolean
  destination: SafariPackage['destination']
  parks: string[]
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

function toSafariApiShape(input: SafariPackageInput): SafariApiShape {
  return toApiShape<SafariPackageInput, SafariApiShape>(input, {
    rating: (i) => String(i.rating),
    badge: (i) => i.badge ?? '',
  })
}

export async function createSafari(input: SafariPackageInput): Promise<SafariPackage> {
  const raw = await apiPost<SafariApiShape>('/api/safaris/', toSafariApiShape(input))
  return mapSafari(raw)
}

export async function updateSafari(slug: string, input: SafariPackageInput): Promise<SafariPackage> {
  const raw = await apiPatch<SafariApiShape>(`/api/safaris/${slug}/`, toSafariApiShape(input))
  return mapSafari(raw)
}

export async function deleteSafari(slug: string): Promise<void> {
  await apiDelete(`/api/safaris/${slug}/`)
}
