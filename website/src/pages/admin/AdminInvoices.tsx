import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt } from '@phosphor-icons/react'
import { getInvoicesPage, INVOICE_STATUS_LABELS, type InvoiceStatus } from '../../api/invoices'
import { usePaginatedFetch } from '../../lib/usePaginatedFetch'
import { STANDARD_PAGE_SIZE } from '../../lib/api'
import { Pager } from '../../components/admin/Pager'
import { formatMoney } from '../../lib/money'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  unpaid: 'bg-surface-container text-on-surface-variant',
  deposit_paid: 'bg-golden-sun/20 text-secondary',
  paid: 'bg-savanna-green/15 text-savanna-green',
  overdue: 'bg-error-container text-error',
}

const FILTERS: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Deposit Paid', value: 'deposit_paid' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

export function AdminInvoices() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all')
  const { data: allInvoices, loading, error, page, count, hasNext, hasPrevious, nextPage, prevPage } =
    usePaginatedFetch(
      (pageNum) => getInvoicesPage(filter === 'all' ? undefined : filter, pageNum),
      [filter],
    )

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Invoice Management</h2>
        <p className="text-on-surface-variant text-sm">Every invoice issued across all bookings, by payment status.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-label-md transition-colors ${
              filter === f.value
                ? 'bg-savanna-green text-on-primary'
                : 'bg-surface-container-lowest border border-sand-stone text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && allInvoices.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <Receipt size={26} className="text-on-surface-variant" />
          </div>
          <h3 className="font-headline-md text-[18px] text-on-surface mb-2">No invoices found</h3>
          <p className="text-on-surface-variant text-sm max-w-md">
            {filter === 'all'
              ? 'Invoices are issued automatically when a quote is sent to a customer.'
              : 'No invoices currently match this filter.'}
          </p>
        </div>
      )}

      {!loading && !error && allInvoices.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Package</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {allInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/admin/invoices/${invoice.id}`)
                    }}
                    tabIndex={0}
                    role="link"
                    className="cursor-pointer hover:bg-surface-container-low transition-colors focus:outline-none focus:bg-surface-container-low"
                  >
                    <td className="px-5 py-4">
                      <span className="font-label-md text-sm text-on-surface">{invoice.customerName}</span>
                      <p className="text-xs text-on-surface-variant">{invoice.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.packageTitle}</td>
                    <td className="px-5 py-4 text-sm text-on-surface">{formatMoney(invoice.amount)}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.issuedDate}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${STATUS_STYLES[invoice.status]}`}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={page}
            count={count}
            pageSize={STANDARD_PAGE_SIZE}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onNext={nextPage}
            onPrevious={prevPage}
          />
        </div>
      )}
    </div>
  )
}
