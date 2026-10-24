import { apiGet, apiGetPage, apiPatch, apiPost, type Page } from '../lib/api'
import type { Currency } from '../lib/money'
import { mapQuoteLineItem, type QuoteLineItemApiShape } from './bookings'
import { fromApiShape } from '../lib/caseMap'

export type InvoiceStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'overdue'

// `overdue` is derived server-side from due_date (Invoice.effective_status) and
// is not assignable — InvoiceUpdateSerializer rejects it. Anything offering the
// user a status to pick must use this list, not the full InvoiceStatus union.
export const SETTABLE_INVOICE_STATUSES = ['unpaid', 'deposit_paid', 'paid'] as const

export type SettableInvoiceStatus = (typeof SETTABLE_INVOICE_STATUSES)[number]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  deposit_paid: 'Deposit Paid',
  paid: 'Paid',
  overdue: 'Overdue',
}

export interface Invoice {
  id: number
  bookingId: number
  customerName: string
  customerEmail: string
  packageTitle: string
  amount: number
  tripTotal: number | null
  remainingBalance: number | null
  /** Every amount on the invoice is in its booking's currency. */
  currency: Currency
  status: InvoiceStatus
  issuedDate: string
  dueDate: string
}

export interface InvoiceLineItem {
  label: string
  quantity: number
  unitPrice: number
  quotePrice: number
}

export interface InvoiceDetail extends Invoice {
  lineItems: InvoiceLineItem[]
  startDate: string
  endDate: string
  guests: number
}

/** One currency's finance totals. TZS and USD are totalled separately, never added. */
export interface CurrencyFinance {
  totalInvoiced: number
  totalCollected: number
  totalOutstanding: number
  overdueAmount: number
}

export interface FinanceSummary {
  byCurrency: Record<Currency, CurrencyFinance>
  overdueCount: number
}

export interface InvoiceApiShape {
  id: number
  booking_id: number
  customer_name: string
  customer_email: string
  package_title: string
  amount: number
  trip_total: number | null
  remaining_balance: number | null
  currency: Currency
  status: InvoiceStatus
  issued_date: string
  due_date: string
}

// The same 4-field shape as a booking's quote line items (a snapshot of one,
// on an Invoice instead) — was hand-mapped a second time here.
interface InvoiceDetailApiShape extends InvoiceApiShape {
  line_items: QuoteLineItemApiShape[]
  start_date: string
  end_date: string
  guests: number
}

interface CurrencyFinanceApiShape {
  total_invoiced: number
  total_collected: number
  total_outstanding: number
  overdue_amount: number
}

interface FinanceSummaryApiShape {
  by_currency: Record<Currency, CurrencyFinanceApiShape>
  overdue_count: number
}

export function mapInvoice(raw: InvoiceApiShape): Invoice {
  return fromApiShape<InvoiceApiShape, Invoice>(raw)
}

function mapInvoiceDetail(raw: InvoiceDetailApiShape): InvoiceDetail {
  return {
    ...mapInvoice(raw),
    lineItems: raw.line_items.map(mapQuoteLineItem),
    startDate: raw.start_date,
    endDate: raw.end_date,
    guests: raw.guests,
  }
}

function mapFinanceSummary(raw: FinanceSummaryApiShape): FinanceSummary {
  const mapTotals = (t: CurrencyFinanceApiShape) => fromApiShape<CurrencyFinanceApiShape, CurrencyFinance>(t)
  return {
    byCurrency: { TZS: mapTotals(raw.by_currency.TZS), USD: mapTotals(raw.by_currency.USD) },
    overdueCount: raw.overdue_count,
  }
}

/** One page of invoices, optionally filtered by status. Both admin consumers
 * (Finance, Invoices) render a full filterable table with no bound on how
 * many invoices exist, so this is paginated rather than "load everything". */
export async function getInvoicesPage(status: InvoiceStatus | undefined, page: number): Promise<Page<Invoice>> {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  const raw = await apiGetPage<InvoiceApiShape>(`/api/invoices/?${params.toString()}`)
  return { ...raw, results: raw.results.map(mapInvoice) }
}

/** The signed-in tourist's own payment history — a small, bounded set (one person's own
 * invoices), so unlike getInvoicesPage this isn't paginated. */
export async function getMyInvoices(): Promise<Invoice[]> {
  const raw = await apiGet<InvoiceApiShape[]>('/api/invoices/mine/')
  return raw.map(mapInvoice)
}

export async function getInvoice(id: number): Promise<InvoiceDetail> {
  const raw = await apiGet<InvoiceDetailApiShape>(`/api/invoices/${id}/`)
  return mapInvoiceDetail(raw)
}

export async function updateInvoiceStatus(id: number, status: SettableInvoiceStatus): Promise<InvoiceDetail> {
  const raw = await apiPatch<InvoiceDetailApiShape>(`/api/invoices/${id}/`, { status })
  return mapInvoiceDetail(raw)
}

export async function sendInvoiceReminder(id: number): Promise<Invoice> {
  const raw = await apiPost<InvoiceApiShape>(`/api/invoices/${id}/remind/`)
  return mapInvoice(raw)
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const raw = await apiGet<FinanceSummaryApiShape>('/api/finance/summary/')
  return mapFinanceSummary(raw)
}
