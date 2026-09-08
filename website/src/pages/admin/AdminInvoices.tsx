import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, DotsThreeVertical } from '@phosphor-icons/react'
import { adminInvoices, type InvoiceStatus } from '../../data/adminInvoices'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-savanna-green/15 text-savanna-green border border-savanna-green/20',
  'Deposit Paid': 'bg-golden-sun/15 text-secondary border border-golden-sun/30',
  Unpaid: 'bg-surface-container text-on-surface-variant border border-sand-stone',
  Overdue: 'bg-error-container text-error border border-error/20',
}

const STAT_CARDS: { key: InvoiceStatus | 'All'; label: string; border: string; text: string }[] = [
  { key: 'All', label: 'All Invoices', border: 'border-l-outline-variant', text: 'text-on-surface' },
  { key: 'Paid', label: 'Paid in Full', border: 'border-l-savanna-green', text: 'text-savanna-green' },
  { key: 'Deposit Paid', label: 'Deposit Paid', border: 'border-l-golden-sun', text: 'text-secondary' },
  { key: 'Unpaid', label: 'Unpaid', border: 'border-l-outline', text: 'text-on-surface-variant' },
  { key: 'Overdue', label: 'Overdue', border: 'border-l-error', text: 'text-error' },
]

const TABS: (InvoiceStatus | 'All')[] = ['All', 'Paid', 'Deposit Paid', 'Unpaid', 'Overdue']

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminInvoices() {
  const [tab, setTab] = useState<InvoiceStatus | 'All'>('All')
  const filtered = tab === 'All' ? adminInvoices : adminInvoices.filter((inv) => inv.status === tab)

  const totalAmount = filtered.reduce((s, i) => s + i.amount, 0)
  const totalPaid = filtered.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalBalance = totalAmount - totalPaid

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Invoice Management</h2>
        <p className="text-on-surface-variant text-sm">Every invoice issued across all bookings, by payment status.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {STAT_CARDS.map((card) => {
          const cardInvoices = card.key === 'All' ? adminInvoices : adminInvoices.filter((i) => i.status === card.key)
          const cardTotal = cardInvoices.reduce((s, i) => s + i.amount, 0)
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setTab(card.key)}
              className={`text-left bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50 border-l-4 ${card.border} ${
                tab === card.key ? 'ring-2 ring-savanna-green/40' : ''
              }`}
            >
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">{card.label}</p>
              <p className={`font-headline-md text-[24px] ${card.text}`}>${(cardTotal / 1000).toFixed(cardTotal >= 1000 ? 1 : 0)}{cardTotal >= 1000 ? 'k' : ''}</p>
              <p className="text-on-surface-variant text-xs mt-1">{cardInvoices.length} Invoices</p>
            </button>
          )
        })}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        <div className="border-b border-sand-stone px-5 pt-2 flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 pt-2 px-1 border-b-2 whitespace-nowrap font-label-md text-sm transition-colors ${
                tab === t ? 'border-savanna-green text-savanna-green' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-5 py-3 text-on-surface-variant text-xs">
          Showing {filtered.length} of {adminInvoices.length} entries
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Trip Name</th>
                <th className="px-5 py-3 font-medium">Issue Date</th>
                <th className="px-5 py-3 font-medium text-right">Total Amount</th>
                <th className="px-5 py-3 font-medium text-right">Paid</th>
                <th className="px-5 py-3 font-medium text-right">Balance</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {filtered.map((inv) => {
                const paid = inv.status === 'Paid' ? inv.amount : inv.status === 'Deposit Paid' ? Math.round(inv.amount * 0.3) : 0
                const balance = inv.amount - paid
                return (
                  <tr key={inv.id} className={`hover:bg-surface-container-low transition-colors group ${inv.status === 'Overdue' ? 'bg-error-container/10' : ''}`}>
                    <td className="px-5 py-4">
                      <Link to={`/admin/invoices/${inv.id}`} className="font-label-md text-sm text-savanna-green hover:underline">
                        #{inv.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-label-md text-on-surface-variant shrink-0">
                          {initials(inv.customerName)}
                        </div>
                        <span className="text-sm text-on-surface">{inv.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{inv.packageTitle}</td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{inv.issuedDate}</td>
                    <td className="px-5 py-4 text-right font-label-md text-sm text-on-surface">${inv.amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-sm text-savanna-green">${paid.toLocaleString()}</td>
                    <td className={`px-5 py-4 text-right text-sm ${balance > 0 ? 'text-terracotta' : 'text-on-surface-variant'}`}>${balance.toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/admin/invoices/${inv.id}`}
                          className="p-1.5 text-on-surface-variant hover:text-savanna-green hover:bg-surface-container rounded transition-colors"
                          title="View invoice"
                        >
                          <Eye size={18} />
                        </Link>
                        <button type="button" className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors" title="More actions">
                          <DotsThreeVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-on-surface-variant text-sm">
                    No invoices in this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-sand-stone bg-surface-container-low flex flex-col sm:flex-row justify-between gap-2 text-sm">
          <span className="font-label-md text-on-surface">Page Subtotals (Visible rows)</span>
          <div className="flex gap-6 text-on-surface-variant">
            <span>Total Amount: <span className="font-label-md text-on-surface">${totalAmount.toLocaleString()}</span></span>
            <span>Total Paid: <span className="font-label-md text-savanna-green">${totalPaid.toLocaleString()}</span></span>
            <span>Total Balance: <span className="font-label-md text-terracotta">${totalBalance.toLocaleString()}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
