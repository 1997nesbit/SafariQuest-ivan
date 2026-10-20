import { ChartLineUp, DownloadSimple, CalendarBlank, Wallet, Package, Receipt, FunnelSimple } from '@phosphor-icons/react'
import { getSafaris, type SafariPackage } from '../../api/safaris'
import { getBookings, type Booking } from '../../api/bookings'
import { getFunnelSummary, type FunnelSummary } from '../../api/analytics'
import { useFetch } from '../../lib/useFetch'
import { formatMoney } from '../../lib/money'

const REVENUE_STAGES: Booking['stage'][] = ['deposit_paid', 'confirmed', 'completed']

export function AdminAnalytics() {
  const { data: safaris, loading: safarisLoading, error: safarisError } = useFetch<SafariPackage[]>(getSafaris, [])
  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetch<Booking[]>(
    () => getBookings(),
    [],
  )
  const { data: funnel, loading: funnelLoading, error: funnelError } = useFetch<FunnelSummary>(
    getFunnelSummary,
    [],
  )

  const loading = safarisLoading || bookingsLoading
  const error = safarisError || bookingsError

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error) {
    return <div className="min-h-[40vh] flex items-center justify-center text-error">{error}</div>
  }

  const allBookings = bookings ?? []
  const allSafaris = safaris ?? []

  const revenueBookings = allBookings.filter((b) => REVENUE_STAGES.includes(b.stage))
  const totalRevenue = revenueBookings.reduce((s, b) => s + b.subtotal, 0)
  const outstandingBalance = allBookings
    .filter((b) => b.stage === 'new_inquiry' || b.stage === 'quoted')
    .reduce((s, b) => s + b.subtotal, 0)
  const avgTripValue = allSafaris.length
    ? Math.round(allSafaris.reduce((s, p) => s + p.price, 0) / allSafaris.length)
    : 0

  const revenueByPackage = Object.values(
    revenueBookings.reduce<Record<string, { title: string; amount: number; count: number }>>((acc, b) => {
      const entry = acc[b.packageTitle] ?? { title: b.packageTitle, amount: 0, count: 0 }
      entry.amount += b.subtotal
      entry.count += 1
      acc[b.packageTitle] = entry
      return acc
    }, {}),
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const stageCounts = allBookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.stage] = (acc[b.stage] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Analytics &amp; Revenue</h2>
          <p className="text-on-surface-variant text-sm">Real booking and revenue data from the pipeline.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-sand-stone rounded-lg font-label-md text-sm text-on-surface-variant/50 cursor-not-allowed"
            title="Date range filtering isn't available yet"
          >
            <CalendarBlank size={16} />
            All Time
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-sand-stone rounded-lg font-label-md text-sm text-on-surface-variant/50 cursor-not-allowed"
            title="Export isn't available yet"
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
            <span className="text-xs font-label-md text-on-surface-variant">{revenueBookings.length} bookings</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Revenue</p>
          <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-terracotta/10 rounded-lg">
              <Package size={20} className="text-terracotta" />
            </div>
            <span className="text-xs font-label-md text-on-surface-variant">{allSafaris.length} packages</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Avg Trip Value</p>
          <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(avgTripValue)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container/50 rounded-lg">
              <Receipt size={20} className="text-error" />
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Pending Quotes Value</p>
          <p className="font-headline-md text-[26px] text-on-surface">{formatMoney(outstandingBalance)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-sand-stone/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-golden-sun/10 rounded-lg">
              <ChartLineUp size={20} className="text-golden-sun" />
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Total Inquiries</p>
          <p className="font-headline-md text-[26px] text-on-surface">{allBookings.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top packages by revenue */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-5">Top Packages by Revenue</h3>
          {revenueByPackage.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-6 text-center">No revenue-generating bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {revenueByPackage.map((p) => (
                <div key={p.title} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-11 h-11 rounded-md bg-savanna-green/10 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-savanna-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-label-md text-sm text-on-surface truncate">{p.title}</h4>
                    <p className="text-xs text-on-surface-variant">
                      {p.count} booking{p.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="font-label-md text-sm text-on-surface shrink-0">{formatMoney(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking pipeline breakdown */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-5">Bookings by Stage</h3>
          {allBookings.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-6 text-center">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="font-label-md text-sm text-on-surface capitalize">{stage.replace('_', ' ')}</span>
                  <span className="text-sm text-on-surface-variant">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
        <h3 className="font-headline-md text-[18px] text-on-surface mb-1 flex items-center gap-2">
          <FunnelSimple size={18} className="text-savanna-green" />
          Trip Curator Funnel
        </h3>
        <p className="text-on-surface-variant text-xs mb-5">
          Unique visitor counts per step; Confirmed is a real booking count, not an event.
        </p>
        {funnelLoading && <p className="text-on-surface-variant text-sm py-6 text-center">Loading funnel…</p>}
        {funnelError && <p className="text-error text-sm py-6 text-center">{funnelError}</p>}
        {!funnelLoading && !funnelError && funnel && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                { label: 'Visited', value: funnel.visited },
                { label: 'Started', value: funnel.started },
                { label: 'Submitted', value: funnel.submitted },
                { label: 'Confirmed', value: funnel.confirmed },
              ] as const
            ).map((step, i, arr) => {
              const prev = i === 0 ? step.value : arr[i - 1].value
              const dropoffPct = prev > 0 ? Math.round(100 - (step.value / prev) * 100) : 0
              return (
                <div key={step.label} className="p-4 rounded-lg bg-surface-container-low">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                    {step.label}
                  </p>
                  <p className="font-headline-md text-[22px] text-on-surface">{step.value}</p>
                  {i > 0 && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      {dropoffPct > 0 ? `-${dropoffPct}% drop-off` : 'No drop-off'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
