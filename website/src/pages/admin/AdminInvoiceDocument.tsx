import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CalendarBlank, DownloadSimple, Mountains, Printer, Users } from '@phosphor-icons/react'
import {
  getInvoice,
  updateInvoiceStatus,
  INVOICE_STATUS_LABELS,
  SETTABLE_INVOICE_STATUSES,
  type InvoiceDetail,
  type SettableInvoiceStatus,
} from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { contact } from '../../config/contact'

// Same 30% figure Checkout.tsx quotes a tourist at booking time. Only used as
// a *fallback* estimate for invoices issued the older way (2.2 send_quote),
// which never captured a real trip_total/remaining_balance — invoices issued
// from the mock checkout deposit (1.3) carry the real split instead, see
// paymentSchedule() below.
const DEPOSIT_FRACTION = 0.3

function formatInvoiceNumber(invoice: InvoiceDetail) {
  const year = invoice.issuedDate.slice(0, 4)
  return `INV-${year}-${String(invoice.id).padStart(4, '0')}`
}

/** The invoice total and its deposit/balance split. Real figures
 * (`tripTotal`/`remainingBalance`) exist only for invoices issued from the
 * mock checkout deposit (1.3); a quote-sent invoice (2.2) never captured a
 * trip_total, so it falls back to the same derived 30/70 estimate this page
 * always showed. */
function paymentSchedule(invoice: InvoiceDetail) {
  if (invoice.tripTotal !== null) {
    const remaining = invoice.remainingBalance ?? 0
    return {
      total: invoice.tripTotal,
      depositLabel: remaining > 0 ? 'Deposit Paid' : 'Deposit',
      depositAmount: invoice.amount,
      balanceLabel: remaining > 0 ? `Balance Due (${invoice.dueDate})` : 'Balance Paid',
      balanceAmount: remaining > 0 ? remaining : invoice.tripTotal - invoice.amount,
    }
  }
  return {
    total: invoice.amount,
    depositLabel: `Deposit (${Math.round(DEPOSIT_FRACTION * 100)}%, due ${invoice.dueDate})`,
    depositAmount: Math.round(invoice.amount * DEPOSIT_FRACTION),
    balanceLabel: 'Balance (due before departure)',
    balanceAmount: Math.round(invoice.amount * (1 - DEPOSIT_FRACTION)),
  }
}

export function AdminInvoiceDocument() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const { data: invoice, loading, error, refetch } = useFetch<InvoiceDetail>(
    () => getInvoice(Number(invoiceId)),
    [invoiceId],
  )
  const [savingStatus, setSavingStatus] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  async function handleDownloadPdf() {
    if (!documentRef.current || !invoice) return
    setDownloading(true)
    try {
      // Dynamically imported — this admin-only action is the only place either
      // library is used, so the ~600KB they add shouldn't load for every
      // visitor of the public site. html2canvas-pro, not plain html2canvas:
      // the latter's CSS color parser doesn't understand oklab/oklch, which
      // Tailwind v4 generates for every opacity-modified color class (e.g.
      // `text-on-surface-variant/80`) used throughout this page.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])
      const canvas = await html2canvas(documentRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imageData = canvas.toDataURL('image/png')
      // A4 in mm, matching this document's own max-w-[210mm] print sizing.
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imageHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, imageHeight)
      pdf.save(`${formatInvoiceNumber(invoice)}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  // Payment status is set by hand — there is no gateway. The endpoint and the
  // API client for this both already existed; nothing in the UI ever called
  // them, so every invoice stayed "unpaid" forever and the Finance summary
  // reported £0 collected no matter what had actually been paid.
  async function handleStatusChange(status: SettableInvoiceStatus) {
    if (!invoice) return
    setActionError(null)
    setSavingStatus(true)
    try {
      await updateInvoiceStatus(invoice.id, status)
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update the invoice status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const schedule = invoice ? paymentSchedule(invoice) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6 max-w-[210mm] mx-auto print:hidden">
        <Link
          to="/admin/invoices"
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>
        {invoice && (
          <div className="flex items-center gap-3">
            <label htmlFor="invoice-status" className="text-sm text-on-surface-variant">
              Payment status
            </label>
            <select
              id="invoice-status"
              value={invoice.status === 'overdue' ? 'unpaid' : invoice.status}
              disabled={savingStatus}
              onChange={(e) => handleStatusChange(e.target.value as SettableInvoiceStatus)}
              className="min-h-[44px] px-3 py-2 bg-surface-container-lowest border border-sand-stone rounded-lg text-sm text-on-surface focus:outline-none focus:border-savanna-green focus:ring-1 focus:ring-savanna-green disabled:opacity-60"
            >
              {SETTABLE_INVOICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {INVOICE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-sand-stone text-on-surface-variant rounded-lg font-label-md text-sm hover:border-savanna-green hover:text-savanna-green transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-savanna-green text-on-primary rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <DownloadSimple size={16} />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <p className="text-center text-error mb-4 max-w-[210mm] mx-auto print:hidden">{actionError}</p>
      )}

      {loading && <p className="text-center text-on-surface-variant py-10">Loading…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && invoice && (
        <div
          ref={documentRef}
          className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-12 max-w-[210mm] mx-auto print:shadow-none print:border-none"
        >
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-sand-stone">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mountains size={26} weight="fill" className="text-savanna-green" />
                <h1 className="font-headline-md text-[20px] text-on-surface">Pande Wilderness Safari</h1>
              </div>
              <div className="text-on-surface-variant text-xs space-y-0.5">
                {contact.address && <p>{contact.address}</p>}
                {contact.phone && <p>{contact.phone}</p>}
                {contact.email && <p>{contact.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="font-headline-lg text-[26px] text-savanna-green mb-2">INVOICE</h2>
              <div className="text-xs space-y-1">
                <p className="text-on-surface-variant">
                  Invoice Number: <span className="text-on-surface font-label-md">{formatInvoiceNumber(invoice)}</span>
                </p>
                <p className="text-on-surface-variant">
                  Issue Date: <span className="text-on-surface font-label-md">{invoice.issuedDate}</span>
                </p>
                <p className="text-on-surface-variant">
                  Due Date: <span className="text-terracotta font-label-md">{invoice.dueDate}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Bill To</p>
              <p className="font-label-md text-sm text-on-surface font-bold">{invoice.customerName}</p>
              <p className="text-sm text-on-surface-variant">{invoice.customerEmail}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">
                Trip Reference
              </p>
              <p className="font-label-md text-sm text-on-surface mb-1.5">{invoice.packageTitle}</p>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <CalendarBlank size={13} /> {invoice.startDate} – {invoice.endDate}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} /> {invoice.guests} Pax
                </span>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b border-sand-stone text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 font-medium">Description</th>
                <th className="py-3 font-medium text-right">Qty</th>
                <th className="py-3 font-medium text-right">Unit Price</th>
                <th className="py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {invoice.lineItems.map((li, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-on-surface">{li.label}</td>
                  <td className="py-3 text-sm text-on-surface-variant text-right">{li.quantity}</td>
                  <td className="py-3 text-sm text-on-surface-variant text-right">${li.unitPrice.toLocaleString()}</td>
                  <td className="py-3 text-sm text-on-surface text-right">${li.quotePrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-container-low rounded-lg p-4 border-l-4 border-golden-sun h-fit">
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                Payment Schedule
              </p>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-on-surface-variant">{schedule!.depositLabel}</span>
                <span className="text-on-surface font-label-md">${schedule!.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{schedule!.balanceLabel}</span>
                <span className="text-on-surface font-label-md">${schedule!.balanceAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface">${schedule!.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-sand-stone bg-savanna-green text-on-primary rounded-lg px-4 py-3">
                <span className="font-label-md text-sm">TOTAL</span>
                <span className="font-headline-md text-[22px]">${schedule!.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-sand-stone text-center">
            <p className="text-on-surface-variant text-xs mb-1">
              Bank transfer details will be shared directly by your safari consultant. All payments are quoted in USD.
            </p>
            <p className="text-on-surface-variant text-xs italic">
              Thank you for choosing Pande Wilderness Safari. We look forward to hosting your adventure.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
