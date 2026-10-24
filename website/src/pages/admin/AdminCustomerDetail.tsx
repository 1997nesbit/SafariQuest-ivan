import { Link, useParams } from 'react-router-dom'
import { EnvelopeSimple, CalendarCheck, MapPin, Receipt } from '@phosphor-icons/react'
import { getCustomer } from '../../api/customers'
import { STAGE_LABELS } from '../../api/bookings'
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { formatMoney, formatTotals } from '../../lib/money'

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-surface-container text-on-surface-variant',
  deposit_paid: 'bg-golden-sun/20 text-secondary',
  paid: 'bg-savanna-green/15 text-savanna-green',
  overdue: 'bg-error-container text-error',
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
  const { data: customer, loading, error } = useFetch(() => getCustomer(id!), [id])

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !customer) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">Customer not found.</p>
        <Link to="/admin/clients" className="text-savanna-green font-label-md">
          Back to Customer Directory
        </Link>
      </div>
    )
  }

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
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-label-sm flex items-center gap-1">
                <CalendarCheck size={13} /> Since {new Date(customer.joinedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col bg-surface p-4 rounded-lg border border-sand-stone min-w-[180px]">
          <span className="font-label-sm text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Lifetime Spend</span>
          <span className="font-headline-md text-[22px] text-savanna-green font-bold">{formatTotals(customer.totalSpend)}</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
        <h3 className="font-headline-md text-[18px] text-on-surface mb-4">Bookings</h3>
        <div className="space-y-3">
          {customer.bookings.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No bookings yet.</p>
          ) : (
            customer.bookings.map((b) => (
              <Link
                key={b.id}
                to={`/admin/inquiries/${b.id}`}
                className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3 hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-on-surface-variant" />
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-sm text-on-surface">{b.packageTitle}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-label-sm bg-surface-container text-on-surface-variant">
                    {STAGE_LABELS[b.stage]}
                  </span>
                </div>
                <span className="font-label-md text-sm text-on-surface">{formatMoney(b.subtotal, undefined, b.currency)}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mt-6">
        <h3 className="font-headline-md text-[18px] text-on-surface mb-4">Invoice History</h3>
        {customer.invoices.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No invoices yet — issued once a quote is sent.</p>
        ) : (
          <div className="space-y-3">
            {customer.invoices.map((inv) => (
              <Link
                key={inv.id}
                to={`/admin/invoices/${inv.id}`}
                className="flex items-center gap-3 bg-surface-container-low rounded-lg p-3 hover:bg-surface-container transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                  <Receipt size={16} className="text-on-surface-variant" />
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-sm text-on-surface">{inv.packageTitle}</p>
                  <p className="text-xs text-on-surface-variant">Due {inv.dueDate}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${INVOICE_STATUS_STYLES[inv.status]}`}>
                  {INVOICE_STATUS_LABELS[inv.status]}
                </span>
                <span className="font-label-md text-sm text-on-surface">{formatMoney(inv.amount, undefined, inv.currency)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
