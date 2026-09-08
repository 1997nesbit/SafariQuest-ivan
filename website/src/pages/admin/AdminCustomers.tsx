import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlass,
  UserPlus,
  ChartLineUp,
  Money,
  Funnel,
  DownloadSimple,
  FilePdf,
  Globe,
  DotsThreeVertical,
  ArrowRight,
  Star,
} from '@phosphor-icons/react'
import { adminCustomers } from '../../data/adminCustomers'

const STATUS_STYLES: Record<string, string> = {
  Lead: 'bg-surface-container text-on-surface-variant',
  Active: 'bg-primary-fixed-dim/20 text-on-primary-fixed-variant',
  VIP: 'bg-golden-sun/20 text-secondary',
}

const ORIGIN_DOT = ['bg-savanna-green', 'bg-terracotta', 'bg-golden-sun', 'bg-primary-fixed-dim', 'bg-secondary-container', 'bg-outline']

const COUNTRY_COORDS: Record<string, { top: number; left: number }> = {
  'United States': { top: 38, left: 20 },
  'United Kingdom': { top: 26, left: 47 },
  Germany: { top: 25, left: 53 },
  Sweden: { top: 15, left: 54 },
  Singapore: { top: 58, left: 78 },
  Nigeria: { top: 58, left: 50 },
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

function WorldMapDecor({ markers }: { markers: { label: string; top: number; left: number; color: string }[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="#becaba" opacity="0.55">
          <path d="M60,110 Q140,70 225,105 Q265,150 235,215 Q195,265 130,245 Q65,210 60,150 Z" />
          <path d="M175,260 Q225,248 245,300 Q235,385 195,425 Q160,385 158,320 Z" />
          <path d="M478,85 Q545,65 575,108 Q562,150 518,152 Q478,132 478,85 Z" />
          <path d="M468,160 Q562,150 585,262 Q562,362 498,382 Q448,320 458,230 Z" />
          <path d="M598,78 Q755,55 825,140 Q805,222 700,232 Q605,190 598,78 Z" />
          <path d="M758,340 Q832,328 852,370 Q820,402 768,390 Z" />
        </g>
      </svg>
      {markers.map((m) => (
        <span
          key={m.label}
          className={`absolute w-2.5 h-2.5 rounded-full ${m.color} ring-4 ring-white/50 shadow-sm`}
          style={{ top: `${m.top}%`, left: `${m.left}%`, transform: 'translate(-50%, -50%)' }}
          title={m.label}
        />
      ))}
    </div>
  )
}

export function AdminCustomers() {
  const [search, setSearch] = useState('')

  const filtered = adminCustomers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()),
  )

  const newCustomers = adminCustomers.filter((c) => c.status === 'Lead').length
  const repeatRate = Math.round((adminCustomers.filter((c) => c.bookingIds.length > 1).length / adminCustomers.length) * 100)
  const totalRevenue = adminCustomers.reduce((sum, c) => sum + c.totalSpend, 0)

  const originCounts = Array.from(
    adminCustomers.reduce((map, c) => {
      map.set(c.origin, (map.get(c.origin) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])

  const statusCounts = {
    Lead: adminCustomers.filter((c) => c.status === 'Lead').length,
    Active: adminCustomers.filter((c) => c.status === 'Active').length,
    VIP: adminCustomers.filter((c) => c.status === 'VIP').length,
  }

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
              <p className="text-xs text-on-surface-variant/70">Leads in the pipeline</p>
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 border border-sand-stone rounded-lg font-label-md text-sm hover:bg-surface-container transition-colors text-on-surface-variant"
            >
              <Funnel size={18} />
              Filter
            </button>
            <div className="flex items-center bg-surface-container rounded-lg p-1">
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-md text-sm hover:bg-surface-container-lowest transition-all text-on-surface-variant">
                <DownloadSimple size={16} />
                CSV
              </button>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-label-md text-sm hover:bg-surface-container-lowest transition-all text-on-surface-variant">
                <FilePdf size={16} />
                PDF
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Contact Info</th>
                <th className="px-6 py-3 font-medium">Origin</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Total Spend</th>
                <th className="px-6 py-3" />
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
                        <p className="font-label-md text-sm text-on-surface group-hover:text-savanna-green">{c.name}</p>
                        <p className="text-xs text-on-surface-variant/70">ID: {c.id}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-on-surface text-sm">{c.email}</p>
                    <p className="text-xs text-on-surface-variant/70">{c.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <Globe size={16} />
                      <span>{c.origin}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-label-sm ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-label-md text-on-surface">${c.totalSpend.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" className="text-on-surface-variant hover:text-savanna-green transition-colors">
                      <DotsThreeVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low/50 border-t border-sand-stone flex items-center justify-between">
          <p className="text-on-surface-variant text-sm">
            Showing {filtered.length} of {adminCustomers.length} customers
          </p>
          <button type="button" className="w-8 h-8 rounded-lg bg-savanna-green text-on-primary text-xs font-bold">
            1
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 overflow-hidden relative min-h-[340px]">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-1">Global Reach</h3>
          <p className="text-on-surface-variant text-sm mb-6">Top customer origins in the directory</p>
          <div className="absolute inset-x-0 bottom-0 top-24 opacity-70">
            <WorldMapDecor
              markers={originCounts
                .filter(([origin]) => COUNTRY_COORDS[origin])
                .map(([origin], i) => ({ label: origin, ...COUNTRY_COORDS[origin], color: ORIGIN_DOT[i % ORIGIN_DOT.length] }))}
            />
          </div>
          <div className="relative z-10 space-y-3 max-w-[220px]">
            {originCounts.slice(0, 3).map(([origin, count]) => (
              <div key={origin} className="flex justify-between items-center bg-surface-container-lowest/90 backdrop-blur p-3 rounded-lg border border-sand-stone/50 shadow-sm">
                <span className="font-label-md text-sm text-on-surface">{origin}</span>
                <span className="text-savanna-green font-bold text-sm">{Math.round((count / adminCustomers.length) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-deep-earth text-ivory-base rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-[18px] mb-2 text-primary-fixed">Grow the Book of Business</h3>
            <p className="opacity-80 text-sm mb-6">
              {statusCounts.VIP} VIP {statusCounts.VIP === 1 ? 'client' : 'clients'} and {statusCounts.Lead} open{' '}
              {statusCounts.Lead === 1 ? 'lead' : 'leads'} are currently tracked in the directory.
            </p>
            <div className="flex flex-col gap-3">
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
          <div className="mt-8 flex items-center gap-6 border-t border-ivory-base/10 pt-6">
            <div>
              <p className="text-xs opacity-50 uppercase tracking-widest">Leads</p>
              <p className="text-xl font-bold">{statusCounts.Lead}</p>
            </div>
            <div className="w-px h-8 bg-ivory-base/10" />
            <div>
              <p className="text-xs opacity-50 uppercase tracking-widest">Active</p>
              <p className="text-xl font-bold">{statusCounts.Active}</p>
            </div>
            <div className="w-px h-8 bg-ivory-base/10" />
            <div>
              <p className="text-xs opacity-50 uppercase tracking-widest flex items-center gap-1">
                <Star size={12} /> VIP
              </p>
              <p className="text-xl font-bold text-golden-sun">{statusCounts.VIP}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
