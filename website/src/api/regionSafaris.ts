import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'
import type { ItineraryDay } from './safaris'

export interface RegionSafari {
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
  region: string
  parks: string[]
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

interface RegionSafariApiShape {
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
  region: string
  parks: string[]
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

function mapRegionSafari(raw: RegionSafariApiShape): RegionSafari {
  return fromApiShape<RegionSafariApiShape, RegionSafari>(
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

export async function getRegionSafaris(): Promise<RegionSafari[]> {
  const raw = await apiGet<RegionSafariApiShape[]>('/api/region-safaris/')
  return raw.map(mapRegionSafari)
}

export async function getRegionSafari(id: string): Promise<RegionSafari> {
  const raw = await apiGet<RegionSafariApiShape>(`/api/region-safaris/${id}/`)
  return mapRegionSafari(raw)
}

export interface RegionSafariInput {
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
  region: string
  parks: string[]
  overview: string
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryDay[]
}

function toRegionSafariApiShape(input: RegionSafariInput): RegionSafariApiShape {
  return toApiShape<RegionSafariInput, RegionSafariApiShape>(input, {
    rating: (i) => String(i.rating),
    badge: (i) => i.badge ?? '',
  })
}

export async function createRegionSafari(input: RegionSafariInput): Promise<RegionSafari> {
  const raw = await apiPost<RegionSafariApiShape>('/api/region-safaris/', toRegionSafariApiShape(input))
  return mapRegionSafari(raw)
}

export async function updateRegionSafari(slug: string, input: RegionSafariInput): Promise<RegionSafari> {
  const raw = await apiPatch<RegionSafariApiShape>(`/api/region-safaris/${slug}/`, toRegionSafariApiShape(input))
  return mapRegionSafari(raw)
}

export async function deleteRegionSafari(slug: string): Promise<void> {
  await apiDelete(`/api/region-safaris/${slug}/`)
}
