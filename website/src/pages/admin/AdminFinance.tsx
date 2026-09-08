import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DownloadSimple, Plus, Wallet, Coins, Clock, Warning, TrendUp, CheckCircle, Eye, PaperPlaneTilt } from '@phosphor-icons/react'
import { adminInvoices, type InvoiceStatus } from '../../data/adminInvoices'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-savanna-green/15 text-savanna-green border border-savanna-green/20',
  'Deposit Paid': 'bg-golden-sun/15 text-secondary border border-golden-sun/30',
  Unpaid: 'bg-surface-container text-on-surface-variant border border-sand-stone',
  Overdue: 'bg-error-container text-error border border-error/20',
}

const MONTHS = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminFinance() {
  const [status, setStatus] = useState<InvoiceStatus | 'All Statuses'>('All Statuses')
  const [month, setMonth] = useState('All Months')

  const filtered = adminInvoices.filter((inv) => {
    if (status !== 'All Statuses' && inv.status !== status) return false
    if (month !== 'All Months' && !inv.issuedDate.includes(month.slice(0, 3))) return false
    return true
  })

  const totalInvoiced = adminInvoices.reduce((s, i) => s + i.amount, 0)
  const totalCollected = adminInvoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = adminInvoices
    .filter((i) => i.status === 'Deposit Paid' || i.status === 'Unpaid')
    .reduce((s, i) => s + i.amount, 0)
  const overdueInvoices = adminInvoices.filter((i) => i.status === 'Overdue')
  const overdueAmount = overdueInvoices.reduce((s, i) => s + i.amount, 0)
  const collectionRate = totalInvoiced ? Math.round((totalCollected / totalInvoiced) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Finance Overview</h2>
          <p className="text-on-surface-variant text-sm">Track revenue, manage invoices, and monitor outstanding balances.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            className="flex-1 md:flex-none min-h-[40px] flex items-center justify-center gap-2 border border-savanna-green text-savanna-green px-4 rounded-lg font-label-md text-sm hover:bg-savanna-green/5 transition-colors"
          >
            <DownloadSimple size={16} />
            Export Report
          </button>
          <button
            type="button"
            className="flex-1 md:flex-none min-h-[40px] flex items-center justify-center gap-2 bg-savanna-green text-on-primary px-4 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50 h-32 flex flex-col justify-between">
          <Wallet size={90} className="absolute -right-3 -top-3 text-surface-container" />
          <div className="relative">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Invoiced</p>
            <p className="font-headline-md text-[26px] text-on-surface">${totalInvoiced.toLocaleString()}</p>
          </div>
          <p className="relative flex items-center gap-1 text-savanna-green text-xs font-label-md">
            <TrendUp size={14} /> {adminInvoices.length} invoices total
          </p>
        </div>
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50 h-32 flex flex-col justify-between">
          <Coins size={90} className="absolute -right-3 -top-3 text-surface-container" />
          <div className="relative">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Collected</p>
            <p className="font-headline-md text-[26px] text-savanna-green">${totalCollected.toLocaleString()}</p>
          </div>
          <p className="relative flex items-center gap-1 text-savanna-green text-xs font-label-md">
            <CheckCircle size={14} /> {collectionRate}% collection rate
          </p>
        </div>
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50 h-32 flex flex-col justify-between">
          <Clock size={90} className="absolute -right-3 -top-3 text-surface-container" />
          <div className="relative">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Outstanding</p>
            <p className="font-headline-md text-[26px] text-on-surface">${totalOutstanding.toLocaleString()}</p>
          </div>
          <p className="relative flex items-center gap-1 text-terracotta text-xs font-label-md">
            <Clock size={14} /> Mostly upcoming trips
          </p>
        </div>
        <div className="relative overflow-hidden bg-error-container/25 rounded-xl p-5 shadow-sm border border-error/20 h-32 flex flex-col justify-between">
          <Warning size={90} className="absolute -right-3 -top-3 text-error/10" />
          <div className="relative">
            <p className="font-label-sm text-label-sm text-error mb-1 uppercase tracking-wider font-bold">Overdue</p>
            <p className="font-headline-md text-[26px] text-error">${overdueAmount.toLocaleString()}</p>
          </div>
          <p className="relative flex items-center gap-1 text-error text-xs font-label-md">
            <Warning size={14} /> Requires action
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        <div className="p-4 border-b border-sand-stone flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus | 'All Statuses')}
              className="bg-surface border border-sand-stone rounded-lg px-3 py-2 text-sm"
            >
              <option>All Statuses</option>
              <option>Paid</option>
              <option>Deposit Paid</option>
              <option>Unpaid</option>
              <option>Overdue</option>
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-surface border border-sand-stone rounded-lg px-3 py-2 text-sm">
              {MONTHS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <span className="text-on-surface-variant text-xs">
            Showing 1-{filtered.length} of {adminInvoices.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Client Name</th>
                <th className="px-5 py-3 font-medium">Trip Reference</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {filtered.map((inv) => (
                <tr key={inv.id} className={`hover:bg-surface-container-low transition-colors group ${inv.status === 'Overdue' ? 'bg-error-container/10' : ''}`}>
                  <td className="px-5 py-4">
                    <Link to={`/admin/invoices/${inv.id}`} className="font-label-md text-sm text-savanna-green hover:underline">
                      {inv.id}
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
                  <td className="px-5 py-4 text-right font-label-md text-sm text-on-surface">${inv.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/admin/invoices/${inv.id}`}
                        className="p-1.5 text-on-surface-variant hover:text-savanna-green hover:bg-surface-container rounded transition-colors"
                        title="View PDF"
                      >
                        <Eye size={18} />
                      </Link>
                      <button type="button" className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors" title="Download Receipt">
                        <DownloadSimple size={18} />
                      </button>
                      {inv.status !== 'Paid' && (
                        <button type="button" className="p-1.5 text-on-surface-variant hover:text-savanna-green hover:bg-surface-container rounded transition-colors" title="Send Reminder">
                          <PaperPlaneTilt size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-on-surface-variant text-sm">
                    No invoices match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
