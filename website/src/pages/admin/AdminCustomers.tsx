import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlass, UserPlus, ChartLineUp, Money, ArrowRight } from '@phosphor-icons/react'
import { getCustomers } from '../../api/customers'
import { useFetch } from '../../lib/useFetch'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const FILTERS = ['All', 'Travellers', 'Agents'] as const
type Filter = (typeof FILTERS)[number]

export function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const { data: customers, loading, error } = useFetch(getCustomers, [])

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error) {
    return <div className="min-h-[40vh] flex items-center justify-center text-error">{error}</div>
  }

  const allCustomers = customers ?? []
  // Agents who have never booked (hotels, travel agents) joined to refer, not to travel.
  // Counting them as "new customers with no bookings" would fill the outreach list and
  // drag down the repeat rate with people who were never prospects.
  const isAgentOnly = (c: (typeof allCustomers)[number]) => c.isReferralAgent && c.tripCount === 0
  const travellers = allCustomers.filter((c) => !isAgentOnly(c))
  const query = search.toLowerCase()
  const filtered = allCustomers.filter(
    (c) =>
      (filter === 'All' || (filter === 'Agents' ? c.isReferralAgent : !isAgentOnly(c))) &&
      (c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)),
  )

  const newCustomers = travellers.filter((c) => c.tripCount === 0).length
  const repeatCustomers = travellers.filter((c) => c.tripCount > 1).length
  const repeatRate = travellers.length ? Math.round((repeatCustomers / travellers.length) * 100) : 0
  const totalRevenue = allCustomers.reduce((sum, c) => sum + c.totalSpend, 0)

  return (
    <div>
      <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-6">Customer Directory</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-savanna-green/10 flex items-center justify-center text-savanna-green">
              <UserPlus size={20} />
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">New Customers</p>
              <p className="text-xs text-on-surface-variant/70">No bookings yet</p>
            </div>
          </div>
          <p className="font-headline-md text-[26px] text-on-surface">{newCustomers}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
              <ChartLineUp size={20} />
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Repeat Rate</p>
              <p className="text-xs text-on-surface-variant/70">Customer loyalty</p>
            </div>
          </div>
          <p className="font-headline-md text-[26px] text-on-surface">{repeatRate}%</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-golden-sun/10 flex items-center justify-center text-golden-sun">
              <Money size={20} />
            </div>
            <div>
              <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Revenue</p>
              <p className="text-xs text-on-surface-variant/70">Across all customers</p>
            </div>
          </div>
          <p className="font-headline-md text-[26px] text-on-surface">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden mb-8">
        <div className="p-5 border-b border-sand-stone flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name or email..."
              className="w-full bg-surface border border-sand-stone rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`px-3 py-1.5 rounded-full font-label-sm text-xs transition-colors ${
                  filter === f
                    ? 'bg-savanna-green/10 text-savanna-green font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Trips</th>
                <th className="px-6 py-3 font-medium text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/clients/${c.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-xs font-label-md text-on-surface-variant shrink-0">
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="font-label-md text-sm text-on-surface group-hover:text-savanna-green flex items-center gap-2">
                          {c.name}
                          {c.isReferralAgent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-[10px] font-semibold uppercase tracking-wider">
                              Agent
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant/70">{c.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">
                    {new Date(c.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-on-surface-variant text-sm">{c.tripCount}</td>
                  <td className="px-6 py-4 text-right font-label-md text-on-surface">${c.totalSpend.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                    {allCustomers.length === 0 ? 'No customers yet.' : 'No customers match your search or filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low/50 border-t border-sand-stone flex items-center justify-between">
          <p className="text-on-surface-variant text-sm">
            Showing {filtered.length} of {allCustomers.length} customers
          </p>
        </div>
      </div>

      <div className="bg-deep-earth text-ivory-base rounded-xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-headline-md text-[18px] mb-2 text-primary-fixed">Grow the Book of Business</h3>
          <p className="opacity-80 text-sm mb-6">
            {newCustomers} new {newCustomers === 1 ? 'customer' : 'customers'} with no bookings yet — a good place
            to start outreach.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/analytics"
              className="bg-savanna-green text-ivory-base px-5 py-3 rounded-lg font-label-md text-sm flex items-center justify-between group transition-all"
            >
              <span>View Performance Reports</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/admin/inquiries"
              className="border border-ivory-base/30 text-ivory-base px-5 py-3 rounded-lg font-label-md text-sm hover:bg-ivory-base/10 transition-colors text-center"
            >
              View Bookings Pipeline
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
