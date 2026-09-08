import { Link, useParams } from 'react-router-dom'
import { WhatsappLogo, PencilSimple, EnvelopeSimple, Phone, MapPin, Star, CalendarCheck, Receipt } from '@phosphor-icons/react'
import { adminCustomers } from '../../data/adminCustomers'
import { adminInvoices, type InvoiceStatus } from '../../data/adminInvoices'

const INVOICE_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-savanna-green/15 text-savanna-green',
  'Deposit Paid': 'bg-primary-fixed-dim/20 text-on-primary-fixed-variant',
  Unpaid: 'bg-surface-container text-on-surface-variant',
  Overdue: 'bg-error/10 text-error',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const customer = adminCustomers.find((c) => c.id === id)

  if (!customer) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">Customer not found.</p>
        <Link to="/admin/clients" className="text-savanna-green font-label-md">
          Back to Customer Directory
        </Link>
      </div>
    )
  }

  const invoices = adminInvoices.filter((inv) => customer.bookingIds.includes(inv.bookingId))

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
        <Link to="/admin/clients" className="hover:text-savanna-green transition-colors">
          Customer Directory
        </Link>
        <span>/</span>
        <span className="text-on-surface font-label-md">{customer.name}</span>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-sand-stone shadow-sm p-6 md:p-8 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center font-headline-md text-[28px] text-on-surface-variant border-2 border-surface shrink-0">
            {initials(customer.name)}
          </div>
          <div>
            <h2 className="font-headline-lg text-[24px] text-on-surface mb-1.5">{customer.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-on-surface-variant text-sm mb-3">
              <span className="flex items-center gap-1.5">
                <EnvelopeSimple size={16} /> {customer.email}
              </span>
              <span className="hidden sm:inline text-sand-stone">•</span>
              <span className="flex items-center gap-1.5">
                <Phone size={16} /> {customer.phone}
              </span>
              <span className="hidden sm:inline text-sand-stone">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} /> {customer.origin}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-golden-sun/15 text-secondary px-3 py-1 rounded-full text-xs font-label-sm flex items-center gap-1">
                {customer.status === 'VIP' && <Star size={13} />}
                {customer.status}
              </span>
              <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-label-sm flex items-center gap-1">
                <CalendarCheck size={13} /> Since {customer.joinedDate}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full lg:w-auto">
          <div className="flex flex-col bg-surface p-4 rounded-lg border border-sand-stone min-w-[180px]">
            <span className="font-label-sm text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Lifetime Spend</span>
            <span className="font-headline-md text-[22px] text-savanna-green font-bold">${customer.totalSpend.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-sm px-4 py-2.5 rounded-lg border border-sand-stone transition-colors"
            >
              <PencilSimple size={16} />
              Edit
            </button>
            <a
              href={`https://wa.me/${customer.phone.replace(/[^\d]/g, '')}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <WhatsappLogo size={18} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-4">Bookings</h3>
          <div className="space-y-3">
            <p className="text-on-surface-variant text-sm">No bookings yet.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-4">Invoices</h3>
          <div className="space-y-3">
            {invoices.length === 0 && <p className="text-on-surface-variant text-sm">No invoices yet.</p>}
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                to={`/admin/invoices/${inv.id}`}
                className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3 hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                  <Receipt size={16} className="text-on-surface-variant" />
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-sm text-on-surface">{inv.id}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-label-sm ${INVOICE_STYLES[inv.status]}`}>
                    {inv.status}
                  </span>
                </div>
                <span className="font-label-md text-sm text-on-surface">${inv.amount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
