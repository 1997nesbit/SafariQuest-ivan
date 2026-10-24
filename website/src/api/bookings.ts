import { apiGet, apiGetAllPages, apiGetPage, apiPatch, apiPost, type Page } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'
import type { Currency } from '../lib/money'

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
  quantity: number
  unitPrice: number
  quotePrice: number
}

export interface QuoteLineItemInput {
  label: string
  quantity: number
  unitPrice: number
}

export interface BookingNote {
  id: number
  author: string
  text: string
  createdAt: string
}

export type MilestoneStatus = 'upcoming' | 'current' | 'completed'

export interface TripMilestone {
  id: number
  day: number
  title: string
  description: string
  status: MilestoneStatus
  note: string
  photo: string
  completedAt: string | null
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
  /** What the booking is priced, invoiced and paid in. */
  currency: Currency
}

export interface Review {
  guideRating: number
  tripRating: number
  testimonial: string
  createdAt: string
}

export interface BookingDetail extends Booking {
  message: string
  createdAt: string
  lineItems: QuoteLineItem[]
  notes: BookingNote[]
  milestones: TripMilestone[]
  review: Review | null
}

export interface BookingFilters {
  stage?: BookingStage
  region?: string
  guide?: number | 'unassigned'
}

// Exported: the identical shape and mapper used to appear a second time in
// customers.ts (a customer's booking history), copy-pasted verbatim. Both
// call sites go through this one now.
export interface BookingApiShape {
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
  currency: Currency
}

interface TripMilestoneApiShape {
  id: number
  day: number
  title: string
  description: string
  status: MilestoneStatus
  note: string
  photo: string
  completed_at: string | null
}

interface ReviewApiShape {
  guide_rating: number
  trip_rating: number
  testimonial: string
  created_at: string
}

// Exported: invoices.ts's line items are the identical shape (a snapshot of
// the same QuoteLineItem, on an Invoice instead of a Booking) and previously
// hand-wrote the same 4-field mapper a second time.
export interface QuoteLineItemApiShape {
  label: string
  quantity: number
  unit_price: number
  quote_price: number
}

export function mapQuoteLineItem(raw: QuoteLineItemApiShape): QuoteLineItem {
  return fromApiShape<QuoteLineItemApiShape, QuoteLineItem>(raw)
}

interface BookingDetailApiShape extends BookingApiShape {
  message: string
  created_at: string
  line_items: QuoteLineItemApiShape[]
  // Admin responses only — the internal notes thread isn't sent to the booking's
  // tourist or guide (bookings.serializers.AdminBookingDetailSerializer).
  notes?: { id: number; author_name: string; text: string; created_at: string }[]
  milestones: TripMilestoneApiShape[]
  review: ReviewApiShape | null
}

function mapMilestone(raw: TripMilestoneApiShape): TripMilestone {
  return fromApiShape<TripMilestoneApiShape, TripMilestone>(raw)
}

// Exported for customers.ts, which shows a customer's own booking history —
// the identical shape and transform, previously duplicated there verbatim.
export function mapBooking(raw: BookingApiShape): Booking {
  // assigned_guide -> assignedGuideId isn't a case conversion, it's a rename
  // for clarity (this is an id, name-only fields elsewhere in this shape
  // aren't suffixed that way) — so it needs an explicit override rather than
  // the default auto-camelCase, and assigned_guide has to be dropped or its
  // auto-converted form (assignedGuide) would also appear, duplicating the
  // same value under a second, unused name.
  return fromApiShape<BookingApiShape, Booking>(raw, { assignedGuideId: (r) => r.assigned_guide }, ['assigned_guide'])
}

function mapBookingDetail(raw: BookingDetailApiShape): BookingDetail {
  return {
    ...mapBooking(raw),
    message: raw.message,
    createdAt: raw.created_at,
    lineItems: raw.line_items.map(mapQuoteLineItem),
    notes: (raw.notes ?? []).map((n) => ({ id: n.id, author: n.author_name, text: n.text, createdAt: n.created_at })),
    milestones: raw.milestones.map(mapMilestone),
    review: raw.review
      ? {
          guideRating: raw.review.guide_rating,
          tripRating: raw.review.trip_rating,
          testimonial: raw.review.testimonial,
          createdAt: raw.review.created_at,
        }
      : null,
  }
}

function bookingFilterParams(filters: BookingFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.stage) params.set('stage', filters.stage)
  if (filters.region) params.set('region', filters.region)
  if (filters.guide !== undefined) params.set('guide', String(filters.guide))
  return params
}

/** All bookings matching `filters`. /api/bookings/ is paginated server-side,
 * but every caller of this function wants a small, inherently bounded list —
 * a customer's own trips, a guide's own schedule — so pages are fetched and
 * flattened here rather than pushing pagination out to 7 different call
 * sites that have no use for it. The one caller that genuinely needs to
 * browse an unbounded list (the admin inquiries pipeline) uses
 * getBookingsPage below instead, with a real pager. */
export async function getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  const raw = await apiGetAllPages<BookingApiShape>('/api/bookings/', bookingFilterParams(filters))
  return raw.map(mapBooking)
}

/** One page of bookings matching `filters`, for the admin inquiries pipeline
 * — the one view where the underlying list is genuinely unbounded (every
 * inquiry ever made) and a real pager is worth the UI. */
export async function getBookingsPage(filters: BookingFilters, page: number): Promise<Page<Booking>> {
  const params = bookingFilterParams(filters)
  params.set('page', String(page))
  const raw = await apiGetPage<BookingApiShape>(`/api/bookings/?${params.toString()}`)
  return { ...raw, results: raw.results.map(mapBooking) }
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
    line_items: lineItems.map((li) => ({
      label: li.label,
      quantity: li.quantity,
      unit_price: li.unitPrice,
    })),
  }
  const raw = await apiPatch<BookingDetailApiShape>(`/api/bookings/${id}/quote/`, payload)
  return mapBookingDetail(raw)
}

export async function sendQuote(id: number): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(`/api/bookings/${id}/quote/send/`)
  return mapBookingDetail(raw)
}

/** How Snippe takes the money (backend SNIPPE_CHECKOUT_MODE). "direct": a prompt is sent
 * to the tourist's phone and they approve it without leaving the site. "hosted": the
 * browser goes to Snippe's checkout page and comes back with `?booking=&payment=`. */
export type PaymentMode = 'direct' | 'hosted'

/** A payment just started for a deposit or balance. Direct: show "approve the prompt on
 * `phoneMasked`" and poll. Hosted: send the browser to `checkoutUrl`. */
export interface PaymentCheckout {
  paymentId: number
  mode: PaymentMode
  checkoutUrl: string
  phoneMasked: string
  amount: number
  currency: Currency
}

interface PaymentCheckoutApiShape {
  payment_id: number
  mode: PaymentMode
  checkout_url: string
  phone_masked: string
  amount: number
  currency: Currency
}

function mapPaymentCheckout(raw: PaymentCheckoutApiShape): PaymentCheckout {
  return {
    paymentId: raw.payment_id,
    mode: raw.mode,
    checkoutUrl: raw.checkout_url,
    phoneMasked: raw.phone_masked,
    amount: raw.amount,
    currency: raw.currency,
  }
}

export interface PayOptions {
  referralCode?: string
  /** Direct mode only: the number the payment prompt goes to. */
  phoneNumber?: string
}

function payBody(locale: string, { referralCode, phoneNumber }: PayOptions) {
  return {
    locale,
    ...(referralCode ? { referral_code: referralCode } : {}),
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
  }
}

/** Starts the deposit payment (1.3). No amounts are sent: the server prices the trip and
 * the deposit itself (backend/bookings/pricing.py), with the same arithmetic the checkout
 * page uses to show them, so the figure on screen is the figure charged. Nothing about
 * the booking changes until Snippe confirms the payment. */
export async function payForBooking(id: number, locale: string, options: PayOptions = {}): Promise<PaymentCheckout> {
  const raw = await apiPost<PaymentCheckoutApiShape>(`/api/bookings/${id}/pay/`, payBody(locale, options))
  return mapPaymentCheckout(raw)
}

/** Starts a payment for whatever remains after the deposit; the amount is computed
 * server-side from the invoice's trip_total, not trusted from the client. */
export async function payRemainingBalance(
  id: number,
  locale: string,
  options: Pick<PayOptions, 'phoneNumber'> = {},
): Promise<PaymentCheckout> {
  const raw = await apiPost<PaymentCheckoutApiShape>(`/api/bookings/${id}/pay-balance/`, payBody(locale, options))
  return mapPaymentCheckout(raw)
}

/** Sends a pending direct payment's prompt to the phone again. */
export async function resendPaymentPrompt(bookingId: number, paymentId: number): Promise<void> {
  await apiPost(`/api/bookings/${bookingId}/payments/${paymentId}/resend/`)
}

export type PaymentStatusValue = 'pending' | 'completed' | 'failed' | 'expired'

export interface PaymentStatus {
  paymentId: number
  kind: 'deposit' | 'balance'
  mode: PaymentMode
  status: PaymentStatusValue
  amount: number
  currency: Currency
  phoneMasked: string
  customerEmail: string
  packageTitle: string
}

interface PaymentStatusApiShape {
  payment_id: number
  kind: 'deposit' | 'balance'
  mode: PaymentMode
  status: PaymentStatusValue
  amount: number
  currency: Currency
  phone_masked: string
  customer_email: string
  package_title: string
}

/** Where a payment stands. A pending one is checked against Snippe server-side, so this
 * settles even if Snippe's webhook hasn't arrived. */
export async function getPaymentStatus(bookingId: number, paymentId: number): Promise<PaymentStatus> {
  const raw = await apiGet<PaymentStatusApiShape>(`/api/bookings/${bookingId}/payments/${paymentId}/`)
  return {
    paymentId: raw.payment_id,
    kind: raw.kind,
    mode: raw.mode,
    status: raw.status,
    amount: raw.amount,
    currency: raw.currency,
    phoneMasked: raw.phone_masked,
    customerEmail: raw.customer_email,
    packageTitle: raw.package_title,
  }
}

export async function addNote(id: number, text: string): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(`/api/bookings/${id}/notes/`, { text })
  return mapBookingDetail(raw)
}

export async function completeMilestone(
  bookingId: number,
  milestoneId: number,
  input: { note?: string; photo?: string } = {},
): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(
    `/api/bookings/${bookingId}/milestones/${milestoneId}/complete/`,
    input,
  )
  return mapBookingDetail(raw)
}

export async function submitReview(
  bookingId: number,
  input: { guideRating: number; tripRating: number; testimonial?: string },
): Promise<BookingDetail> {
  const raw = await apiPost<BookingDetailApiShape>(`/api/bookings/${bookingId}/review/`, {
    guide_rating: input.guideRating,
    trip_rating: input.tripRating,
    testimonial: input.testimonial,
  })
  return mapBookingDetail(raw)
}

export interface BookingCreateInput {
  name?: string
  email?: string
  safari?: string
  regionSafari?: string
  startDate: string
  endDate: string
  guests: number
  /** How many of `guests` are children (half the adult rate); defaults to 0. */
  children?: number
  message?: string
  /** What the trip is priced and paid in; defaults to TZS. */
  currency?: Currency
}

export async function createBooking(input: BookingCreateInput): Promise<BookingDetail> {
  const payload: Record<string, unknown> = {
    start_date: input.startDate,
    end_date: input.endDate,
    guests: input.guests,
  }
  if (input.name) payload.name = input.name
  if (input.email) payload.email = input.email
  if (input.safari) payload.safari = input.safari
  if (input.regionSafari) payload.region_safari = input.regionSafari
  if (input.children) payload.children = input.children
  if (input.message) payload.message = input.message
  if (input.currency) payload.currency = input.currency
  const raw = await apiPost<BookingDetailApiShape>('/api/bookings/', payload)
  return mapBookingDetail(raw)
}

/** Whether online payment works right now (backend bookings.outages): `blocked` while
 * Snippe can't take payments at all, `warnings` for a single network being down. The
 * messages come from the server, which knows the outage window. */
export interface PaymentAvailability {
  blocked: boolean
  message: string | null
  warnings: string[]
  /** Whether pay buttons ask for a phone number here (direct) or go to Snippe (hosted). */
  mode: PaymentMode
  /** Which currencies can be paid online right now (USD needs Senjaropay). */
  currencies: Record<Currency, boolean>
}

export function getPaymentAvailability(): Promise<PaymentAvailability> {
  return apiGet<PaymentAvailability>('/api/payments/availability/')
}
