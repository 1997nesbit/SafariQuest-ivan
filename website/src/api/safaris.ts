import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'

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
  return {
    id: raw.slug,
    title: raw.title,
    image: raw.image,
    imageAlt: raw.image_alt,
    galleryImages: raw.gallery_images,
    rating: Number(raw.rating),
    days: raw.days,
    accommodation: raw.accommodation,
    price: raw.price,
    badge: raw.badge || undefined,
    signature: raw.signature,
    destination: raw.destination,
    parks: raw.parks,
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

function toApiShape(input: SafariPackageInput): SafariApiShape {
  return {
    slug: input.slug,
    title: input.title,
    image: input.image,
    image_alt: input.imageAlt,
    gallery_images: input.galleryImages,
    rating: String(input.rating),
    days: input.days,
    accommodation: input.accommodation,
    price: input.price,
    badge: input.badge ?? '',
    signature: input.signature,
    destination: input.destination,
    parks: input.parks,
    overview: input.overview,
    highlights: input.highlights,
    included: input.included,
    excluded: input.excluded,
    itinerary: input.itinerary,
  }
}

export async function createSafari(input: SafariPackageInput): Promise<SafariPackage> {
  const raw = await apiPost<SafariApiShape>('/api/safaris/', toApiShape(input))
  return mapSafari(raw)
}

export async function updateSafari(slug: string, input: SafariPackageInput): Promise<SafariPackage> {
  const raw = await apiPatch<SafariApiShape>(`/api/safaris/${slug}/`, toApiShape(input))
  return mapSafari(raw)
}

export async function deleteSafari(slug: string): Promise<void> {
  await apiDelete(`/api/safaris/${slug}/`)
}
