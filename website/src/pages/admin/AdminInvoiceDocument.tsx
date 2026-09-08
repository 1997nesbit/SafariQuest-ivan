import { Link, useParams } from 'react-router-dom'
import { DownloadSimple, EnvelopeSimple, Mountains, CalendarBlank, UsersThree, ArrowLeft } from '@phosphor-icons/react'
import { adminInvoices } from '../../data/adminInvoices'

export function AdminInvoiceDocument() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const invoice = adminInvoices.find((inv) => inv.id === invoiceId)

  if (!invoice) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">Invoice not found.</p>
        <Link to="/admin/invoices" className="text-savanna-green font-label-md">
          Back to Invoices
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 max-w-[210mm] mx-auto">
        <Link to="/admin/invoices" className="flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green text-sm transition-colors">
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-[40px] flex items-center gap-2 border border-sand-stone px-4 rounded-lg font-label-md text-sm hover:bg-surface-container-low transition-colors"
          >
            <DownloadSimple size={16} />
            PDF
          </button>
          <button
            type="button"
            className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-4 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity"
          >
            <EnvelopeSimple size={16} />
            Email Invoice
          </button>
        </div>
      </div>

      {/* A4-style printable document */}
      <main className="max-w-[210mm] mx-auto bg-surface-container-lowest shadow-md border border-sand-stone/50 rounded-xl p-8 md:p-12 flex flex-col">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12 border-b border-sand-stone pb-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Mountains size={28} weight="fill" className="text-savanna-green" />
              <span className="font-headline-md text-[20px] text-savanna-green font-bold">Pande Wilderness Safari</span>
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant flex flex-col gap-1">
              <p>123 Savannah Way, Arusha, Tanzania</p>
              <p>+255 123 456 789</p>
              <p>billing@pandewildernesssafari.com</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="font-headline-lg text-[28px] text-savanna-green uppercase tracking-wider mb-2">Invoice</h1>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-label-md text-sm">
              <span className="text-on-surface-variant">Invoice Number:</span>
              <span className="text-on-surface font-bold text-right">{invoice.id}</span>
              <span className="text-on-surface-variant">Issue Date:</span>
              <span className="text-on-surface text-right">{invoice.issuedDate}</span>
              <span className="text-on-surface-variant">Due Date:</span>
              <span className="text-terracotta font-bold text-right">{invoice.dueDate}</span>
            </div>
          </div>
        </header>

        {/* Bill To & Trip Reference */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2 border-b border-sand-stone pb-1 inline-block">
              Bill To
            </h2>
            <p className="font-headline-md text-[18px] text-on-surface mt-2">{invoice.customerName}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Booking Ref: {invoice.bookingId}</p>
          </div>
          <div className="bg-surface-container-low p-5 rounded-lg border border-sand-stone">
            <h2 className="font-label-sm text-label-sm text-savanna-green uppercase tracking-wider mb-2 flex items-center gap-2">
              <CalendarBlank size={16} />
              Trip Reference
            </h2>
            <p className="font-body-lg text-[16px] font-bold text-on-surface mb-2">{invoice.packageTitle}</p>
            <p className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <UsersThree size={14} /> Booking {invoice.bookingId}
            </p>
          </div>
        </section>

        {/* Line items */}
        <section className="mb-10 flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-savanna-green bg-surface-container-low">
                <th className="py-3 px-4 font-label-md text-sm text-on-surface uppercase">Description</th>
                <th className="py-3 px-4 font-label-md text-sm text-on-surface uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.label} className="border-b border-sand-stone">
                  <td className="py-4 px-4 text-on-surface text-sm font-medium">{li.label}</td>
                  <td className="py-4 px-4 text-right text-on-surface text-sm font-bold">${li.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Payment schedule & total */}
        <section className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
          <div className="w-full sm:w-1/2 bg-surface-container-low rounded-lg p-5 border-l-4 border-golden-sun">
            <h3 className="font-label-md text-sm text-on-surface uppercase mb-3 flex items-center gap-2">
              <CalendarBlank size={16} className="text-golden-sun" />
              Payment Schedule
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-sand-stone">
                <span className="text-on-surface-variant">30% Deposit (Due {invoice.dueDate})</span>
                <span className="font-bold text-on-surface">${Math.round(invoice.amount * 0.3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Remaining Balance (Before departure)</span>
                <span className="font-bold text-on-surface">${Math.round(invoice.amount * 0.7).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <div className="flex justify-between items-center px-4 py-3 bg-savanna-green/10 text-savanna-green rounded-lg border border-savanna-green/30 shadow-sm">
              <span className="font-label-md text-sm uppercase tracking-wide">Total Due</span>
              <span className="font-headline-md text-[20px] font-bold">${invoice.amount.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto pt-8 border-t border-sand-stone text-center">
          <h4 className="font-label-md text-label-md text-savanna-green uppercase mb-2">Payment Instructions &amp; Terms</h4>
          <p className="font-label-sm text-label-sm text-on-surface-variant max-w-2xl mx-auto mb-4">
            Please make bank transfers to: Pande Wilderness Safari Ltd, Account: 00123456789, Bank: Serengeti International, Swift: SRGTTZ. All
            payments must be made in USD. Cancellations within 60 days of travel may incur fees.
          </p>
          <p className="font-body-md text-sm text-on-surface italic font-medium">
            Thank you for choosing Pande Wilderness Safari — safe travels!
          </p>
        </footer>
      </main>
    </div>
  )
}
