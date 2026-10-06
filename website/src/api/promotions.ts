import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { fromApiShape, toApiShape } from '../lib/caseMap'

/** Sponsored events on the homepage. Field limits mirror the backend
 * (promotions.models / the serializer) so the form stops typing at the same
 * point the server would reject. */
export const PROMOTION_LIMITS = { title: 120, description: 500, imageUrl: 500, phone: 30 } as const

export interface Promotion {
  id: number
  title: string
  image: string
  description: string
  phone: string
  order: number
  isPublished: boolean
}

interface PromotionApiShape {
  id: number
  title: string
  image: string
  description: string
  phone: string
  order: number
  is_published: boolean
}

export type PromotionInput = Omit<Promotion, 'id'>

function mapPromotion(raw: PromotionApiShape): Promotion {
  return fromApiShape<PromotionApiShape, Promotion>(raw)
}

export async function getPromotions(options: { includeUnpublished?: boolean } = {}): Promise<Promotion[]> {
  const path = options.includeUnpublished ? '/api/promotions/?all=true' : '/api/promotions/'
  const raw = await apiGet<PromotionApiShape[]>(path)
  return raw.map(mapPromotion)
}

export async function getPromotion(id: number | string): Promise<Promotion> {
  return mapPromotion(await apiGet<PromotionApiShape>(`/api/promotions/${id}/`))
}

export async function createPromotion(input: PromotionInput): Promise<Promotion> {
  return mapPromotion(await apiPost<PromotionApiShape>('/api/promotions/', toApiShape<PromotionInput, PromotionApiShape>(input)))
}

export async function updatePromotion(id: number, input: PromotionInput): Promise<Promotion> {
  return mapPromotion(
    await apiPatch<PromotionApiShape>(`/api/promotions/${id}/`, toApiShape<PromotionInput, PromotionApiShape>(input)),
  )
}

export function deletePromotion(id: number): Promise<void> {
  return apiDelete(`/api/promotions/${id}/`)
}

/** Turns a phone number into a WhatsApp link. wa.me takes digits only, so the
 * spaces, dashes and brackets people type are stripped. */
export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`
}
