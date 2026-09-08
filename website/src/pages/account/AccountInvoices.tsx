import { CreditCard, DownloadSimple } from '@phosphor-icons/react'
import { myTrips } from '../../data/myTrips'

const STATUS_STYLES: Record<'paid' | 'due', string> = {
  paid: 'bg-savanna-green/10 text-savanna-green',
  due: 'bg-golden-sun/15 text-secondary',
}

export function AccountInvoices() {
  const invoices = myTrips.map((trip, i) => ({
    id: `INV-${1000 + i}`,
    trip,
    status: trip.status === 'completed' ? ('paid' as const) : ('due' as const),
  }))

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          Invoices &amp; Payments
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Review deposit and balance invoices for each of your safaris.
        </p>
      </div>

      {invoices.length === 0 ? (
        <p className="text-on-surface-variant">No invoices yet.</p>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant overflow-hidden">
          <div className="divide-y divide-sand-stone">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-savanna-green shrink-0">
                  <CreditCard size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{invoice.trip.packageTitle}</p>
                  <p className="text-on-surface-variant text-sm">
                    {invoice.id} · {invoice.trip.dateRange}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm shrink-0 ${STATUS_STYLES[invoice.status]}`}>
                  {invoice.status === 'paid' ? 'Paid' : 'Balance Due'}
                </span>
                <button
                  type="button"
                  className="min-h-[44px] inline-flex items-center gap-2 border border-sand-stone text-on-surface px-4 rounded-lg font-label-md text-label-sm hover:bg-surface-container-low transition-colors shrink-0"
                >
                  <DownloadSimple size={16} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
