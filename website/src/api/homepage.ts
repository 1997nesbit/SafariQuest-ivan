import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

export const HOMEPAGE_LIMITS = { alt: 255, image: 500 } as const

/** Every fixed photo spot on the public site that isn't already backed by
 * another model. Mirrored in backend/homepage/models.py (HOMEPAGE_SLOTS). The
 * name is historical: the feature started on the homepage and now covers every
 * page's fixed photos. */
export const HOMEPAGE_SLOTS = [
  'hero_video',
  'hero_poster',
  'why_choose',
  'testimonial_sarah',
  'testimonial_markus',
  'about_hero',
  'about_story',
  'safaris_hero',
  'faqs_hero',
  'sign_in',
  'booking_confirmed_hero',
  'booking_confirmed_packing',
  'booking_confirmed_photography',
] as const
export type HomepageSlot = (typeof HOMEPAGE_SLOTS)[number]

export interface HomepageImage {
  id: number
  slot: HomepageSlot
  image: string
  alt: string
  updatedAt: string
}

interface HomepageImageApiShape {
  id: number
  slot: HomepageSlot
  image: string
  alt: string
  updated_at: string
}

/** Every saved spot, as a lookup by key. A spot nobody has replaced yet is
 * simply absent, and callers fall back to their built-in placeholder. */
export async function getHomepageImages(): Promise<Partial<Record<HomepageSlot, HomepageImage>>> {
  const raw = await apiGet<HomepageImageApiShape[]>('/api/homepage/images/')
  const bySlot: Partial<Record<HomepageSlot, HomepageImage>> = {}
  for (const r of raw) bySlot[r.slot] = fromApiShape<HomepageImageApiShape, HomepageImage>(r)
  return bySlot
}

/** Saves a spot's photo. The first save of a spot creates it on the server. */
export async function updateHomepageImage(slot: HomepageSlot, input: { image: string; alt: string }): Promise<HomepageImage> {
  const raw = await apiPatch<HomepageImageApiShape>(`/api/homepage/images/${slot}/`, toApiShape(input))
  return fromApiShape<HomepageImageApiShape, HomepageImage>(raw)
}

/** "Reset to original": removes the saved photo, so the site shows the spot's
 * built-in default again (for the homepage hero, the video). */
export async function resetHomepageImage(slot: HomepageSlot): Promise<void> {
  await apiDelete(`/api/homepage/images/${slot}/`)
}

export const PARTNER_HOTEL_LIMITS = { name: 150, location: 120, website: 500, image: 500 } as const

export interface PartnerHotel {
  id: number
  name: string
  location: string
  website: string
  image: string
  order: number
  isPublished: boolean
}

interface PartnerHotelApiShape {
  id: number
  name: string
  location: string
  website: string
  image: string
  order: number
  is_published: boolean
}

function mapPartnerHotel(raw: PartnerHotelApiShape): PartnerHotel {
  return fromApiShape<PartnerHotelApiShape, PartnerHotel>(raw)
}

/** Published hotels, in display order — what visitors see. Pass
 * `includeUnpublished` from the content manager to see hidden ones too; the
 * server ignores it for anyone who isn't an admin. */
export async function getPartnerHotels(options: { includeUnpublished?: boolean } = {}): Promise<PartnerHotel[]> {
  const raw = await apiGet<PartnerHotelApiShape[]>(
    `/api/homepage/partner-hotels/${options.includeUnpublished ? '?all=true' : ''}`,
  )
  return raw.map(mapPartnerHotel)
}

export async function getPartnerHotel(id: number | string): Promise<PartnerHotel> {
  return mapPartnerHotel(await apiGet<PartnerHotelApiShape>(`/api/homepage/partner-hotels/${id}/`))
}

export type PartnerHotelInput = Omit<PartnerHotel, 'id'>

type PartnerHotelWriteShape = Omit<PartnerHotelApiShape, 'id'>

function toPartnerHotelApiShape(input: PartnerHotelInput): PartnerHotelWriteShape {
  return toApiShape<PartnerHotelInput, PartnerHotelWriteShape>(input)
}

export async function createPartnerHotel(input: PartnerHotelInput): Promise<PartnerHotel> {
  return mapPartnerHotel(await apiPost<PartnerHotelApiShape>('/api/homepage/partner-hotels/', toPartnerHotelApiShape(input)))
}

export async function updatePartnerHotel(id: number, input: PartnerHotelInput): Promise<PartnerHotel> {
  return mapPartnerHotel(
    await apiPatch<PartnerHotelApiShape>(`/api/homepage/partner-hotels/${id}/`, toPartnerHotelApiShape(input)),
  )
}

export async function deletePartnerHotel(id: number): Promise<void> {
  await apiDelete(`/api/homepage/partner-hotels/${id}/`)
}
