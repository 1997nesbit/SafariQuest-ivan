import { safariPackages } from '../../data/safaris'
import { adminInvoices } from '../../data/adminInvoices'
import { Warning, Question, DownloadSimple, CalendarBlank, Wallet, FunnelSimple, Package, Receipt } from '@phosphor-icons/react'

const FUNNEL = [
  { stage: 'Site Visits', value: 12400 },
  { stage: 'Trip Curator Started', value: 3100 },
  { stage: 'Inquiry Submitted', value: 890 },
  { stage: 'Quote Sent', value: 610 },
  { stage: 'Booking Confirmed', value: 245 },
]

const PACKAGE_PERFORMANCE = safariPackages.map((p, i) => ({
  title: p.title,
  views: 2400 - i * 280,
  inquiries: 180 - i * 22,
}))

// Illustrative drop-off through the real Trip Curator flow (Destinations -> Experiences -> Trip Details -> Review)
const CURATOR_DROPOFF = [
  { step: 'Destinations', pct: 8 },
  { step: 'Experiences', pct: 34 },
  { step: 'Trip Details', pct: 41 },
  { step: 'Review & Submit', pct: 17 },
]

// Illustrative seasonal booking outlook (no historical booking-date data to aggregate from yet)
const UPCOMING_VOLUME = [
  { month: 'Oct', value: 38 },
  { month: 'Nov', value: 62 },
  { month: 'Dec', value: 95 },
  { month: 'Jan', value: 71 },
  { month: 'Feb', value: 48 },
  { month: 'Mar', value: 30 },
]

export function AdminAnalytics() {
  const maxFunnel = FUNNEL[0].value
  const overallConversion = ((FUNNEL[FUNNEL.length - 1].value / FUNNEL[0].value) * 100).toFixed(1)
  const maxScale = Math.max(...PACKAGE_PERFORMANCE.flatMap((p) => [p.views, p.inquiries]))
  const maxVolume = Math.max(...UPCOMING_VOLUME.map((v) => v.value))

  const totalRevenue = adminInvoices.reduce((s, i) => s + i.amount, 0)
  const outstandingBalance = adminInvoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0)
  const overdueCount = adminInvoices.filter((i) => i.status === 'Overdue').length
  const avgTripValue = Math.round(safariPackages.reduce((s, p) => s + p.price, 0) / safariPackages.length)

  const revenueByPackage = Object.values(
    adminInvoices.reduce<Record<string, { title: string; amount: number; count: number }>>((acc, inv) => {
      const entry = acc[inv.packageTitle] ?? { title: inv.packageTitle, amount: 0, count: 0 }
      entry.amount += inv.amount
      entry.count += 1
      acc[inv.packageTitle] = entry
      return acc
    }, {}),
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Analytics &amp; Conversion</h2>
          <p className="text-on-surface-variant text-sm">Q3 performance and conversion metrics across the guest journey.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-sand-stone rounded-lg font-label-md text-sm text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors"
          >
            <CalendarBlank size={16} />
            Last 30 Days
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-sand-stone rounded-lg font-label-md text-sm text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors"
          >
            <DownloadSimple size={16} />
            Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-savanna-green/10 rounded-lg">
              <Wallet size={20} className="text-savanna-green" />
            </div>
            <span className="text-xs font-label-md text-on-surface-variant">{adminInvoices.length} invoices</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Revenue</p>
          <p className="font-headline-md text-[26px] text-on-surface">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-golden-sun/10 rounded-lg">
              <FunnelSimple size={20} className="text-golden-sun" />
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Conversion Rate</p>
          <p className="font-headline-md text-[26px] text-on-surface">{overallConversion}%</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-terracotta/10 rounded-lg">
              <Package size={20} className="text-terracotta" />
            </div>
            <span className="text-xs font-label-md text-on-surface-variant">{safariPackages.length} packages</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Avg Trip Value</p>
          <p className="font-headline-md text-[26px] text-on-surface">${avgTripValue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container/50 rounded-lg">
              <Receipt size={20} className="text-error" />
            </div>
            {overdueCount > 0 && <span className="text-xs font-label-md text-error font-bold">Action Req.</span>}
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Outstanding Balances</p>
          <p className="font-headline-md text-[26px] text-on-surface">${outstandingBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Views vs inquiries bar chart */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3 border-b border-sand-stone pb-4">
          <h3 className="font-headline-md text-[18px] text-on-surface">Views vs. Inquiries by Package</h3>
          <div className="flex gap-4">
            <span className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded-full bg-savanna-green" /> Page Views
            </span>
            <span className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded-full bg-terracotta" /> Inquiries
            </span>
          </div>
        </div>
        <div className="h-56 flex items-end justify-around gap-3 px-2 border-l border-b border-sand-stone pb-2">
          {PACKAGE_PERFORMANCE.slice(0, 4).map((p) => (
            <div key={p.title} className="flex flex-col items-center flex-1 h-full justify-end group">
              <div className="flex items-end gap-1 w-full justify-center h-full">
                <div
                  className="w-8 md:w-10 bg-savanna-green/90 rounded-t-sm group-hover:bg-savanna-green transition-colors"
                  style={{ height: `${(p.views / maxScale) * 100}%` }}
                  title={`${p.views.toLocaleString()} views`}
                />
                <div
                  className="w-8 md:w-10 bg-terracotta/90 rounded-t-sm group-hover:bg-terracotta transition-colors"
                  style={{ height: `${(p.inquiries / maxScale) * 100}%` }}
                  title={`${p.inquiries.toLocaleString()} inquiries`}
                />
              </div>
              <span className="text-[11px] text-on-surface-variant mt-2 text-center leading-tight">{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Conversion funnel */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-6">Conversion Funnel</h3>
          <div className="space-y-1">
            {FUNNEL.map((f, i) => {
              const pct = (f.value / maxFunnel) * 100
              const prev = i > 0 ? FUNNEL[i - 1].value : null
              const dropoff = prev ? Math.round(((prev - f.value) / prev) * 100) : null
              const isLast = i === FUNNEL.length - 1
              return (
                <div key={f.stage}>
                  <div className="flex justify-between mb-1.5">
                    <span className={`font-label-md text-sm ${isLast ? 'text-savanna-green font-bold' : 'text-on-surface'}`}>{f.stage}</span>
                    <span className={`text-sm ${isLast ? 'text-savanna-green font-bold' : 'text-on-surface-variant'}`}>
                      {pct.toFixed(0)}% ({f.value.toLocaleString()})
                    </span>
                  </div>
                  <div className="h-7 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLast ? 'bg-savanna-green' : 'bg-savanna-green/40'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {dropoff !== null && (
                    <div className="flex justify-center -my-1 relative z-10">
                      <span className="bg-surface-container-lowest text-terracotta text-[11px] px-2 py-0.5 rounded-full border border-sand-stone">
                        -{dropoff}% dropoff
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Curator abandonment */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-md text-[16px] text-on-surface leading-tight">Curator Abandonment</h3>
            <Question size={18} className="text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant mb-6">Where guests exit the Trip Curator without submitting.</p>
          <div className="flex-1 flex flex-col justify-end gap-4">
            {CURATOR_DROPOFF.map((d) => (
              <div key={d.step}>
                <div className="flex justify-between text-sm font-label-md mb-1">
                  <span className="text-on-surface">{d.step}</span>
                  <span className={d.pct >= 40 ? 'text-terracotta font-bold' : 'text-on-surface-variant'}>{d.pct}%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${d.pct >= 40 ? 'bg-terracotta' : 'bg-terracotta/40'}`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-sand-stone">
            <p className="text-xs text-on-surface-variant italic">
              <span className="font-bold text-terracotta">Insight:</span> Most guests abandon while entering trip logistics. Consider simplifying
              date and traveler-count inputs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top packages by revenue */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-5">Top Packages by Revenue</h3>
          <div className="space-y-2">
            {revenueByPackage.map((p) => (
              <div key={p.title} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="w-11 h-11 rounded-md bg-savanna-green/10 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-savanna-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-label-md text-sm text-on-surface truncate">{p.title}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {p.count} invoice{p.count === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="font-label-md text-sm text-on-surface shrink-0">${p.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming trip volume */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-5">Upcoming Trip Volume</h3>
          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {UPCOMING_VOLUME.map((v) => {
              const isPeak = v.value === maxVolume
              return (
                <div key={v.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center" style={{ height: '100%' }}>
                    <div
                      className={`w-full rounded-t-md transition-colors self-end relative ${
                        isPeak ? 'bg-savanna-green' : 'bg-savanna-green/30 group-hover:bg-savanna-green/50'
                      }`}
                      style={{ height: `${(v.value / maxVolume) * 100}%` }}
                    >
                      {isPeak && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-deep-earth text-ivory-base px-2 py-1 rounded text-[11px] whitespace-nowrap">
                          Peak: {v.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs ${isPeak ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{v.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Package performance table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        <div className="p-5 border-b border-sand-stone">
          <h3 className="font-headline-md text-[18px] text-on-surface">Detailed Package Performance</h3>
          <p className="text-on-surface-variant text-sm mt-1">Reviewing granular conversion metrics across active itineraries.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Package</th>
                <th className="px-5 py-3 font-medium text-right">Views</th>
                <th className="px-5 py-3 font-medium text-right">Inquiries</th>
                <th className="px-5 py-3 font-medium text-right">Conv. Rate</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {PACKAGE_PERFORMANCE.map((p) => {
                const rate = (p.inquiries / p.views) * 100
                const isGap = rate < 5
                return (
                  <tr key={p.title} className={`hover:bg-surface-container-low transition-colors ${isGap ? 'bg-golden-sun/5' : ''}`}>
                    <td className="px-5 py-4 font-label-md text-sm text-on-surface">{p.title}</td>
                    <td className="px-5 py-4 text-right text-on-surface-variant text-sm">{p.views.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-on-surface-variant text-sm">{p.inquiries}</td>
                    <td className={`px-5 py-4 text-right font-label-md text-sm ${isGap ? 'text-terracotta' : 'text-savanna-green'}`}>
                      {rate.toFixed(1)}%
                    </td>
                    <td className="px-5 py-4">
                      {isGap ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-golden-sun/15 text-terracotta text-xs">
                          <Warning size={13} /> Conversion Gap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-savanna-green/15 text-savanna-green text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-savanna-green" /> Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
