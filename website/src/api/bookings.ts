import { apiGet, apiPatch, apiPost } from '../lib/api'

export type BookingStage = 'new_inquiry' | 'quoted' | 'deposit_paid' | 'confirmed' | 'completed'

export const STAGE_LABELS: Record<BookingStage, string> = {
  new_inquiry: 'New Inquiry',
  quoted: 'Quoted',
  deposit_paid: 'Deposit Paid',
  confirmed: 'Confirmed',
  completed: 'Completed',
}

export const STAGE_ORDER: BookingStage[] = ['new_inquiry', 'quoted', 'deposit_paid', 'confirmed', 'completed']

export interface QuoteLineItem {
  label: string
  cost: number
  markupPercent: number
  quotePrice: number
}

export interface QuoteLineItemInput {
  label: string
  cost: number
  markupPercent: number
}

export interface BookingNote {
  id: number
  author: string
  text: string
  createdAt: string
}

export interface Booking {
  id: number
  customerName: string
  customerEmail: string
  packageTitle: string
  region: string
  startDate: string
  endDate: string
  guests: number
  stage: BookingStage
  assignedGuideId: number | null
  assignedGuideName: string | null
  subtotal: number
}

export interface BookingDetail extends Booking {
  message: string
  createdAt: string
  lineItems: QuoteLineItem[]
  notes: BookingNote[]
}

export interface BookingFilters {
  stage?: BookingStage
  region?: string
  guide?: number | 'unassigned'
}

interface BookingApiShape {
  id: number
  customer_name: string
  customer_email: string
  package_title: string
  region: string
  start_date: string
  end_date: string
  guests: number
  stage: BookingStage
  assigned_guide: number | null
  assigned_guide_name: string | null
  subtotal: number
}

interface BookingDetailApiShape extends BookingApiShape {
  message: string
  created_at: string
  line_items: { label: string; cost: number; markup_percent: number; quote_price: number }[]
  notes: { id: number; author_name: string; text: string; created_at: string }[]
}

function mapBooking(raw: BookingApiShape): Booking {
  return {
    id: raw.id,
    customerName: raw.customer_name,
    customerEmail: raw.customer_email,
    packageTitle: raw.package_title,
    region: raw.region,
    startDate: raw.start_date,
    endDate: raw.end_date,
    guests: raw.guests,
    stage: raw.stage,
    assignedGuideId: raw.assigned_guide,
    assignedGuideName: raw.assigned_guide_name,
    subtotal: raw.subtotal,
  }
}

function mapBookingDetail(raw: BookingDetailApiShape): BookingDetail {
  return {
    ...mapBooking(raw),
    message: raw.message,
    createdAt: raw.created_at,
    lineItems: raw.line_items.map((li) => ({
      label: li.label,
      cost: li.cost,
      markupPercent: li.markup_percent,
      quotePrice: li.quote_price,
    })),
    notes: raw.notes.map((n) => ({ id: n.id, author: n.author_name, text: n.text, createdAt: n.created_at })),
  }
}

export async function getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  const params = new URLSearchParams()
  if (filters.stage) params.set('stage', filters.stage)
  if (filters.region) params.set('region', filters.region)
  if (filters.guide !== undefined) params.set('guide', String(filters.guide))
  const query = params.toString()
  const raw = await apiGet<BookingApiShape[]>(`/api/bookings/${query ? `?${query}` : ''}`)
  return raw.map(mapBooking)
}

export async function getBooking(id: number): Promise<BookingDetail> {
  const raw = await apiGet<BookingDetailApiShape>(`/api/bookings/${id}/`)
  return mapBookingDetail(raw)
}

export async function updateBooking(
  id: number,
  input: { assignedGuide?: number; stage?: BookingStage },
): Promise<BookingDetail> {
  const payload: Record<string, unknown> = {}
  if (input.assignedGuide !== undefined) payload.assigned_guide = input.assignedGuide
  if (input.stage !== undefined) payload.stage = input.stage
  const raw = await apiPatch<BookingDetailApiShape>(`/api/bookings/${id}/`, payload)
  return mapBookingDetail(raw)
}

export async function updateQuote(id: number, lineItems: QuoteLineItemInput[]): Promise<BookingDetail> {
  const payload = {
    line_items: lineItems.map((li) => ({ label: li.label, cost: li.cost, markup_percent: li.markupPercent })),
  }
  const raw = await apiPatch<BookingDetailApiShape>(`/api/bookings/${id}/quote/`, payload)
  return mapBookingDetail(raw)
}

export async function sendQuote(id: number): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(`/api/bookings/${id}/quote/send/`)
  return mapBookingDetail(raw)
}

export async function addNote(id: number, text: string): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(`/api/bookings/${id}/notes/`, { text })
  return mapBookingDetail(raw)
}
