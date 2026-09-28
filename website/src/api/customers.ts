import { apiGet, apiGetAllPages } from '../lib/api'
import { fromApiShape } from '../lib/caseMap'
import { mapBooking, type Booking, type BookingApiShape } from './bookings'
import { mapInvoice, type Invoice, type InvoiceApiShape } from './invoices'

export interface Customer {
  id: number
  name: string
  email: string
  joinedDate: string
  /** Has the referral agent profile switched on (may or may not also travel). */
  isReferralAgent: boolean
  tripCount: number
  totalSpend: number
  bookingIds: number[]
}

export interface CustomerDetail extends Customer {
  bookings: Booking[]
  invoices: Invoice[]
}

interface CustomerApiShape {
  id: number
  name: string
  email: string
  date_joined: string
  is_referral_agent: boolean
  trip_count: number
  total_spend: number
  booking_ids: number[]
}

interface CustomerDetailApiShape extends CustomerApiShape {
  bookings: BookingApiShape[]
  invoices: InvoiceApiShape[]
}

function mapCustomer(raw: CustomerApiShape): Customer {
  // date_joined -> joinedDate is a word-order rename, not a case conversion
  // (the auto-converted form would be dateJoined), so it needs an override —
  // and date_joined has to be dropped or that auto form would also appear.
  return fromApiShape<CustomerApiShape, Customer>(raw, { joinedDate: (r) => r.date_joined }, ['date_joined'])
}

// mapBooking (imported above) used to be copy-pasted here verbatim, along
// with its own copy of BookingApiShape — a customer's booking history is the
// exact same shape as the admin pipeline's, just reached from a different
// endpoint.

/** All customers. /api/customers/ is paginated server-side, but the one
 * consumer (AdminCustomers) computes summary stats (new/repeat rate, total
 * revenue) and does client-side search across the whole customer base — both
 * would silently go wrong against just one page, so pages are fetched and
 * flattened here rather than switching that page to a real pager. Same
 * tradeoff as getBookings: each request is still bounded server-side, even
 * though the eventual total fetched is unchanged. */
export async function getCustomers(): Promise<Customer[]> {
  const raw = await apiGetAllPages<CustomerApiShape>('/api/customers/', new URLSearchParams())
  return raw.map(mapCustomer)
}

export async function getCustomer(id: number | string): Promise<CustomerDetail> {
  const raw = await apiGet<CustomerDetailApiShape>(`/api/customers/${id}/`)
  return {
    ...mapCustomer(raw),
    bookings: raw.bookings.map(mapBooking),
    invoices: raw.invoices.map(mapInvoice),
  }
}
