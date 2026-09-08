import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Funnel, CalendarCheck, Users, Kanban, Table } from '@phosphor-icons/react'
import { getBookings, STAGE_LABELS, STAGE_ORDER, type BookingStage } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'

const REGIONS = [
  'All',
  'Serengeti National Park',
  'Ngorongoro Conservation Area',
  'Tarangire & Manyara',
  'Zanzibar Extensions',
] as const

const STAGE_DOT: Record<BookingStage, string> = {
  new_inquiry: 'bg-secondary-container',
  quoted: 'bg-golden-sun',
  deposit_paid: 'bg-primary-fixed-dim',
  confirmed: 'bg-savanna-green',
  completed: 'bg-terracotta',
}

const REGION_TAG: Record<string, string> = {
  'Serengeti National Park': 'bg-primary-container/20 text-on-primary-fixed-variant',
  'Ngorongoro Conservation Area': 'bg-terracotta/15 text-terracotta',
  'Tarangire & Manyara': 'bg-golden-sun/15 text-secondary',
  'Zanzibar Extensions': 'bg-surface-variant text-on-surface-variant',
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

export function AdminBookingsPipeline() {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('All')
  const [guideFilter, setGuideFilter] = useState<'All' | 'Unassigned'>('All')

  const { data: bookings, loading, error } = useFetch(
    () =>
      getBookings({
        region: region === 'All' ? undefined : region,
        guide: guideFilter === 'Unassigned' ? 'unassigned' : undefined,
      }),
    [region, guideFilter],
  )
  const filtered = bookings ?? []

  const hasActiveFilters = region !== 'All' || guideFilter !== 'All'
  const clearFilters = () => {
    setRegion('All')
    setGuideFilter('All')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-1">Inquiries &amp; Bookings</h2>
          <p className="font-body-md text-sm text-on-surface-variant">
            Manage the safari pipeline from initial contact to completion. {filtered.length} booking
            {filtered.length === 1 ? '' : 's'} shown.
          </p>
        </div>
        <div className="flex bg-surface-container rounded-lg p-1 w-fit">
          <button type="button" className="px-4 py-2 rounded-md bg-surface-container-lowest shadow-sm text-on-surface font-label-md text-sm flex items-center gap-2">
            <Kanban size={18} /> Kanban
          </button>
          <button type="button" className="px-4 py-2 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-sm flex items-center gap-2">
            <Table size={18} /> Table
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-surface-container-low p-4 rounded-xl border border-sand-stone mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Funnel size={18} className="text-on-surface-variant" />
          <span className="font-label-md text-sm text-on-surface-variant mr-1">Filters:</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as (typeof REGIONS)[number])}
            className="bg-surface-container-lowest border border-sand-stone text-on-surface font-label-md text-sm rounded-full focus:ring-1 focus:ring-savanna-green focus:border-savanna-green py-1.5 pl-4 pr-8"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'Region: All' : r}
              </option>
            ))}
          </select>
          <select
            value={guideFilter}
            onChange={(e) => setGuideFilter(e.target.value as 'All' | 'Unassigned')}
            className="bg-surface-container-lowest border border-sand-stone text-on-surface font-label-md text-sm rounded-full focus:ring-1 focus:ring-savanna-green focus:border-savanna-green py-1.5 pl-4 pr-8"
          >
            <option value="All">Guide: All</option>
            <option value="Unassigned">Guide: Unassigned</option>
          </select>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="text-terracotta hover:bg-terracotta/10 disabled:opacity-40 disabled:hover:bg-transparent font-label-md text-sm px-3 py-1.5 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading bookings…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && (
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 items-start">
          {STAGE_ORDER.map((stage) => {
            const cards = filtered.filter((b) => b.stage === stage)
            return (
              <div key={stage} className="min-w-[300px] w-[300px] shrink-0 bg-surface-container-lowest rounded-xl border border-sand-stone flex flex-col max-h-full">
                <div className="p-4 border-b border-sand-stone flex justify-between items-center sticky top-0 bg-surface-container-lowest rounded-t-xl z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STAGE_DOT[stage]}`} />
                    <h3 className="font-label-md text-sm text-on-surface">{STAGE_LABELS[stage]}</h3>
                    <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 rounded-full">{cards.length}</span>
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-3 flex-1">
                  {cards.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 min-h-[140px] text-on-surface-variant text-xs text-center border-2 border-dashed border-sand-stone rounded-lg bg-surface-container-low/50 p-4">
                      No bookings in this stage
                    </div>
                  )}
                  {cards.map((b) => (
                    <Link
                      key={b.id}
                      to={`/admin/inquiries/${b.id}`}
                      className="block bg-surface border border-sand-stone p-4 rounded-lg shadow-[0_2px_8px_rgba(45,45,45,0.04)] hover:shadow-[0_4px_12px_rgba(45,45,45,0.08)] transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-label-sm px-2 py-1 rounded-md ${REGION_TAG[b.region] ?? 'bg-surface-variant text-on-surface-variant'}`}>
                          {b.region}
                        </span>
                        <span className="text-on-surface-variant text-xs font-label-sm">#{b.id}</span>
                      </div>
                      <h4 className="font-headline-md text-base text-on-surface mb-1">{b.customerName}</h4>
                      <p className="font-body-md text-sm text-on-surface-variant mb-3">{b.packageTitle}</p>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <CalendarCheck size={14} />
                          <span>
                            {b.startDate} – {b.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Users size={14} />
                          <span>{b.guests} guests</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-sand-stone pt-3">
                        <div className="font-label-md text-sm text-on-surface">${b.subtotal.toLocaleString()}</div>
                        {b.assignedGuideName ? (
                          <div
                            className="w-6 h-6 rounded-full bg-savanna-green/15 text-savanna-green flex items-center justify-center text-[10px] font-label-md border border-savanna-green/30"
                            title={b.assignedGuideName}
                          >
                            {initials(b.assignedGuideName)}
                          </div>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs text-on-surface-variant border border-sand-stone"
                            title="Unassigned"
                          >
                            ?
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
