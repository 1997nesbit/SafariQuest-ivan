import { useState } from 'react'
import { CheckCircle, Clock, PaperPlaneRight, Wallet, Warning } from '@phosphor-icons/react'
import {
  getFinanceSummary,
  getInvoicesPage,
  sendInvoiceReminder,
  INVOICE_STATUS_LABELS,
  type FinanceSummary,
  type Invoice,
  type InvoiceStatus,
} from '../../api/invoices'
import { useFetch } from '../../lib/useFetch'
import { usePaginatedFetch } from '../../lib/usePaginatedFetch'
import { ApiError, STANDARD_PAGE_SIZE } from '../../lib/api'
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

export function AdminFinance() {
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all')
  const { data: summary, loading: summaryLoading, error: summaryError } = useFetch<FinanceSummary>(
    getFinanceSummary,
    [],
  )
  const {
    data: allInvoices,
    loading: invoicesLoading,
    error: invoicesError,
    page,
    count,
    hasNext,
    hasPrevious,
    nextPage,
    prevPage,
    refetch,
  } = usePaginatedFetch(
    (pageNum) => getInvoicesPage(filter === 'all' ? undefined : filter, pageNum),
    [filter],
  )
  const [reminding, setReminding] = useState<number | null>(null)
  const [reminderError, setReminderError] = useState<string | null>(null)
  const [reminderSentId, setReminderSentId] = useState<number | null>(null)

  async function handleRemind(invoice: Invoice) {
    setReminderError(null)
    setReminding(invoice.id)
    try {
      await sendInvoiceReminder(invoice.id)
      setReminderSentId(invoice.id)
      refetch()
    } catch (err) {
      setReminderError(err instanceof ApiError ? err.message : 'Failed to send reminder.')
    } finally {
      setReminding(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Finance</h2>
        <p className="text-on-surface-variant text-sm">Collections, outstanding balances, and payment status.</p>
      </div>

      {summaryLoading && <p className="text-on-surface-variant text-sm mb-6">Loading summary…</p>}
      {summaryError && <p className="text-error text-sm mb-6">{summaryError}</p>}

      {!summaryLoading && !summaryError && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-savanna-green/10 rounded-lg">
                <Wallet size={20} className="text-savanna-green" />
              </div>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Invoiced</p>
            <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(summary.totalInvoiced)}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-savanna-green/10 rounded-lg">
                <CheckCircle size={20} className="text-savanna-green" />
              </div>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Collected</p>
            <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(summary.totalCollected)}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-golden-sun/10 rounded-lg">
                <Clock size={20} className="text-golden-sun" />
              </div>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Outstanding</p>
            <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(summary.totalOutstanding)}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-error-container/50 rounded-lg">
                <Warning size={20} className="text-error" />
              </div>
              <span className="text-xs font-label-md text-on-surface-variant">{summary.overdueCount} invoices</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Overdue Amount</p>
            <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(summary.overdueAmount)}</p>
          </div>
        </div>
      )}

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

      {reminderError && <p className="text-error text-sm mb-4">{reminderError}</p>}

      {invoicesLoading && <p className="text-center text-on-surface-variant py-10">Loading…</p>}
      {invoicesError && <p className="text-center text-error py-10">{invoicesError}</p>}

      {!invoicesLoading && !invoicesError && allInvoices.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 p-12 flex flex-col items-center text-center">
          <p className="text-on-surface-variant text-sm">No invoices match this filter.</p>
        </div>
      )}

      {!invoicesLoading && !invoicesError && allInvoices.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {allInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-label-md text-sm text-on-surface">{invoice.customerName}</span>
                      <p className="text-xs text-on-surface-variant">{invoice.packageTitle}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface">{formatMoney(invoice.amount)}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{invoice.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${STATUS_STYLES[invoice.status]}`}>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {invoice.status === 'paid' ? (
                        <span className="text-xs text-on-surface-variant">—</span>
                      ) : (
                        <button
                          type="button"
                          disabled={reminding === invoice.id}
                          onClick={() => handleRemind(invoice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand-stone text-xs text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                        >
                          <PaperPlaneRight size={14} />
                          {reminding === invoice.id
                            ? 'Sending…'
                            : reminderSentId === invoice.id
                              ? 'Sent'
                              : 'Send Reminder'}
                        </button>
                      )}
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
