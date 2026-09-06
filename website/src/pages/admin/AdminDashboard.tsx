import { Link } from 'react-router-dom'
import { Ticket, Money, Compass, Lightning, DownloadSimple, ArrowRight, CalendarBlank } from '@phosphor-icons/react'
import { adminBookings, type BookingStage } from '../../data/adminBookings'
import { adminCustomers } from '../../data/adminCustomers'
import { useAuth } from '../../auth/AuthContext'

const STAGE_DOT: Record<BookingStage, string> = {
  'New Inquiry': 'bg-secondary-container',
  Quoted: 'bg-golden-sun',
  'Deposit Paid': 'bg-primary-fixed-dim',
  Confirmed: 'bg-savanna-green',
  Completed: 'bg-terracotta',
}

const STAGE_TEXT: Record<BookingStage, string> = {
  'New Inquiry': 'text-on-surface-variant',
  Quoted: 'text-golden-sun',
  'Deposit Paid': 'text-on-primary-fixed-variant',
  Confirmed: 'text-savanna-green',
  Completed: 'text-terracotta',
}

const REGION_PILL: Record<string, string> = {
  Serengeti: 'bg-savanna-green/5 text-savanna-green border-savanna-green/20',
  Ngorongoro: 'bg-terracotta/5 text-terracotta border-terracotta/20',
  Tarangire: 'bg-golden-sun/5 text-secondary border-golden-sun/20',
  Zanzibar: 'bg-primary-container/5 text-on-primary-fixed-variant border-primary-container/20',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SEASONS = [
  { key: 'Peak (Jul-Oct)', months: [6, 7, 8, 9], color: 'bg-savanna-green' },
  { key: 'Green (Nov-Dec)', months: [10, 11], color: 'bg-golden-sun' },
  { key: 'Dry (Jan-Feb)', months: [0, 1], color: 'bg-terracotta' },
  { key: 'Rainy (Mar-May)', months: [2, 3, 4], color: 'bg-outline' },
] as const

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
        <rect width="1000" height="500" fill="transparent" />
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

export function AdminDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || user?.email || 'there'
  const totalRevenue = adminBookings.reduce((sum, b) => sum + b.quoteAmount, 0)
  const activeBookings = adminBookings.filter((b) => b.stage !== 'Completed').length
  const activeGuests = adminBookings.filter((b) => b.stage !== 'Completed').reduce((sum, b) => sum + b.guests, 0)
  const confirmedOrCompleted = adminBookings.filter((b) => b.stage === 'Confirmed' || b.stage === 'Completed').length
  const conversionRate = Math.round((confirmedOrCompleted / adminBookings.length) * 100)
  const avgDealSize = Math.round(totalRevenue / adminBookings.length)
  const recent = [...adminBookings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)

  const stats = [
    {
      label: 'Total Bookings',
      value: adminBookings.length,
      icon: Ticket,
      tint: 'text-savanna-green bg-savanna-green/10',
      note: `${activeBookings} active in pipeline`,
    },
    {
      label: 'Revenue (USD)',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: Money,
      tint: 'text-terracotta bg-terracotta/10',
      note: `$${avgDealSize.toLocaleString()} avg per booking`,
    },
    {
      label: 'Active Travelers',
      value: activeGuests,
      icon: Compass,
      tint: 'text-golden-sun bg-golden-sun/10',
      note: 'Currently in the pipeline',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: Lightning,
      tint: 'text-primary-container bg-primary-container/10',
      note: `${confirmedOrCompleted} of ${adminBookings.length} confirmed+`,
    },
  ]

  // Revenue Growth: real revenue bucketed by the month each booking's quote was created.
  const createdDates = adminBookings.map((b) => new Date(`${b.createdAt}T00:00:00`))
  const today = new Date()
  const currentMonthIndex = today.getMonth()
  const monthlyRevenue = MONTHS.map((label, i) => ({
    label,
    total: adminBookings
      .filter((_, idx) => createdDates[idx].getMonth() === i && createdDates[idx].getFullYear() === today.getFullYear())
      .reduce((sum, b) => sum + b.quoteAmount, 0),
    isCurrent: i === currentMonthIndex,
  })).slice(0, currentMonthIndex + 1)
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.total), 1)

  const earliest = createdDates.reduce((a, b) => (b < a ? b : a))
  const latest = createdDates.reduce((a, b) => (b > a ? b : a))
  const dateRangeLabel = `${earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${latest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`

  // Bookings by Season: real bucketing of each booking's trip month (parsed from dateRange) into climatic zones.
  const bookingsBySeason = SEASONS.map((season) => {
    const count = adminBookings.filter((b) => {
      const match = /^([A-Za-z]{3})/.exec(b.dateRange)
      const monthIndex = match ? MONTHS.indexOf(match[1]) : -1
      return (season.months as readonly number[]).includes(monthIndex)
    }).length
    return { ...season, count }
  })
  const maxSeasonCount = Math.max(...bookingsBySeason.map((s) => s.count), 1)

  const originCounts = Array.from(
    adminCustomers.reduce((map, c) => {
      map.set(c.origin, (map.get(c.origin) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1])
  const topOrigins = originCounts.slice(0, 3)
  const [topOriginName, topOriginCount] = originCounts[0]
  const topOriginPct = Math.round((topOriginCount / adminCustomers.length) * 100)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="font-label-md text-xs text-terracotta uppercase tracking-widest">Live Overview</span>
          <h2 className="font-headline-md text-[24px] text-on-surface mt-1">Karibu, {firstName}</h2>
          <p className="text-on-surface-variant text-sm mt-1">Here's what's happening across Safari Ops today.</p>
        </div>
        <div className="flex gap-2 w-fit">
          <div className="bg-surface-container-high px-4 py-2 rounded-lg font-label-md text-sm flex items-center gap-2 text-on-surface-variant">
            <CalendarBlank size={18} />
            {dateRangeLabel}
          </div>
          <button
            type="button"
            className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-4 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity"
          >
            <DownloadSimple size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${s.tint}`}>
              <s.icon size={20} />
            </div>
            <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-headline-md text-[26px] text-on-surface">{s.value}</p>
            <p className="text-on-surface-variant text-xs mt-2 italic">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-1">Revenue Growth</h3>
          <p className="text-on-surface-variant text-sm mb-6">Monthly revenue performance for {today.getFullYear()}</p>
          <div className="h-56 w-full flex items-end justify-between gap-2 px-1">
            {monthlyRevenue.map((m) => (
              <div key={m.label} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                {m.total > 0 && (
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-deep-earth text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                    ${m.total.toLocaleString()}
                  </div>
                )}
                <div
                  className={`w-full rounded-t-lg transition-all ${m.isCurrent ? 'bg-savanna-green' : 'bg-surface-container-low group-hover:bg-savanna-green/20'}`}
                  style={{ height: `${Math.max((m.total / maxMonthlyRevenue) * 100, 3)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-on-surface-variant text-xs">
            {monthlyRevenue.map((m) => (
              <span key={m.label} className={m.isCurrent ? 'font-bold text-on-surface' : ''}>
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-low rounded-xl p-6 border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-1">Bookings by Season</h3>
          <p className="text-on-surface-variant text-sm mb-6">Lead volumes per climatic zone</p>
          <div className="space-y-5">
            {bookingsBySeason.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-label-md text-on-surface">{s.key}</span>
                  <span className="font-bold text-on-surface">{s.count}</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.count / maxSeasonCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-5">
          <div>
            <h3 className="font-headline-md text-[18px] text-on-surface">Global Customer Origin</h3>
            <p className="text-on-surface-variant text-sm mt-0.5">Primary source markets for incoming safaris</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {topOrigins.map(([origin, count], i) => (
              <div key={origin} className="flex items-center gap-2 border border-sand-stone rounded-full px-3 py-1">
                <span className={`w-2 h-2 rounded-full ${ORIGIN_DOT[i % ORIGIN_DOT.length]}`} />
                <span className="text-xs font-label-md text-on-surface-variant">
                  {origin} ({Math.round((count / adminCustomers.length) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative w-full h-[320px] rounded-xl overflow-hidden bg-surface-container-low">
          <WorldMapDecor
            markers={originCounts
              .filter(([origin]) => COUNTRY_COORDS[origin])
              .map(([origin], i) => ({ label: origin, ...COUNTRY_COORDS[origin], color: ORIGIN_DOT[i % ORIGIN_DOT.length] }))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-5 right-5 max-w-xs bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-xl border border-sand-stone p-4">
            <h5 className="font-label-md text-sm text-on-surface mb-1.5">Market Insights</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {topOriginName} is currently the top source market, representing {topOriginPct}% of tracked customers across{' '}
              {originCounts.length} countries.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        <div className="p-6 border-b border-sand-stone flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-[18px] text-on-surface">Recent Bookings</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">Live feed of the latest inquiries and confirmations</p>
          </div>
          <Link to="/admin/inquiries" className="text-savanna-green font-label-md text-sm flex items-center gap-1 hover:underline">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Guest</th>
                <th className="px-6 py-3 font-medium">Package</th>
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {recent.map((b) => (
                <tr key={b.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/inquiries/${b.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-label-md text-on-surface-variant shrink-0">
                        {initials(b.customerName)}
                      </div>
                      <div>
                        <p className="font-label-md text-sm text-on-surface group-hover:text-savanna-green">{b.customerName}</p>
                        <p className="text-on-surface-variant text-xs">{b.region}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 border text-xs inline-block rounded-full ${REGION_PILL[b.region] ?? 'bg-surface-variant text-on-surface-variant border-sand-stone'}`}>
                      {b.packageTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{b.dateRange}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-label-sm ${STAGE_TEXT[b.stage]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[b.stage]}`} />
                      {b.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-label-md text-on-surface">${b.quoteAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
