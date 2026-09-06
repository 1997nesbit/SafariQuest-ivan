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
