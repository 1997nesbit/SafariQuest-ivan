import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, PencilSimple, CaretDown, MapPin, Trash } from '@phosphor-icons/react'
import { deleteSafari, getSafaris } from '../../api/safaris'
import { deleteDestination, getDestinations } from '../../api/destinations'
import { deletePark, getParks } from '../../api/parks'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const TABS = ['Safaris', 'Regions', 'Parks'] as const
type Tab = (typeof TABS)[number]

const STATUS_FILTERS = ['All Packages', 'Published', 'Drafts'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export function AdminContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialTabParam = searchParams.get('tab')
  const initialTab: Tab = TABS.includes(initialTabParam as Tab) ? (initialTabParam as Tab) : 'Safaris'
  const [tab, setTabState] = useState<Tab>(initialTab)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All Packages')
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: destinations, loading: destinationsLoading, error: destinationsError, refetch: refetchDestinations } =
    useFetch(getDestinations, [])
  const { data: safariPackages, loading: safarisLoading, error: safarisError, refetch: refetchSafaris } =
    useFetch(getSafaris, [])

  const { data: parks, loading: parksLoading, error: parksError, refetch: refetchParks } = useFetch(getParks, [])

  function setTab(next: Tab) {
    setTabState(next)
    setSearchParams(next === 'Safaris' ? {} : { tab: next }, { replace: true })
  }

  async function handleDeleteDestination(slug: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingSlug(slug)
    try {
      await deleteDestination(slug)
      refetchDestinations()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete destination.')
    } finally {
      setDeletingSlug(null)
    }
  }

  async function handleDeletePark(slug: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingSlug(slug)
    try {
      await deletePark(slug)
      refetchParks()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete park.')
    } finally {
      setDeletingSlug(null)
    }
  }

  async function handleDeleteSafari(slug: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingSlug(slug)
    try {
      await deleteSafari(slug)
      refetchSafaris()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete safari package.')
    } finally {
      setDeletingSlug(null)
    }
  }

  // All real safari packages are live/published — there is no draft flag in the data model yet.
  const visiblePackages = statusFilter === 'Drafts' ? [] : safariPackages ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-md text-[26px] text-on-surface mb-1">Manage Destinations &amp; Packages</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Organize the regions we operate in and curate the safari packages offered to clients.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate(
              tab === 'Regions'
                ? '/admin/content/destinations/new'
                : tab === 'Parks'
                  ? '/admin/content/parks/new'
                  : '/admin/content/safaris/new',
            )
          }
          className="flex items-center gap-2 bg-savanna-green text-on-primary py-2.5 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity w-fit shrink-0 shadow-sm"
        >
          <Plus size={18} />
          {tab === 'Regions' ? 'Add New Destination' : tab === 'Parks' ? 'Add New Park' : 'Add New Safari Package'}
        </button>
      </div>

      <div className="border-b border-sand-stone mb-8 flex gap-8">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`font-label-md text-sm py-4 border-b-2 transition-all ${
              tab === t ? 'text-savanna-green font-bold border-savanna-green' : 'border-transparent text-on-surface-variant hover:text-savanna-green'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Safaris' ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          <div className="p-4 border-b border-sand-stone bg-surface/50 flex items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-full font-label-sm text-xs transition-colors ${
                  statusFilter === f ? 'bg-savanna-green/10 text-savanna-green font-semibold' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f}
                {f === 'All Packages' ? ` (${(safariPackages ?? []).length})` : ''}
              </button>
            ))}
          </div>
          {deleteError && (
            <div className="mx-4 mt-4 bg-error-container text-error rounded-lg px-4 py-3 text-sm">{deleteError}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Package</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {safarisLoading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Loading safari packages…
                    </td>
                  </tr>
                )}
                {safarisError && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-error text-sm">
                      {safarisError}
                    </td>
                  </tr>
                )}
                {!safarisLoading &&
                  !safarisError &&
                  visiblePackages.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.imageAlt} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          <div>
                            <p className="font-label-md text-sm text-on-surface">{p.title}</p>
                            <p className="text-on-surface-variant text-xs">{p.destination}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">{p.destination}</td>
                      <td className="px-5 py-4 text-on-surface-variant text-sm">{p.days} days</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-savanna-green/15 text-savanna-green">
                          <span className="w-1.5 h-1.5 rounded-full bg-savanna-green" />
                          {p.signature ? 'Featured' : 'Published'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Link
                            to={`/admin/content/safaris/${p.id}/edit`}
                            className="inline-flex text-on-surface-variant hover:text-savanna-green p-1.5 rounded-full hover:bg-surface-container transition-colors"
                          >
                            <PencilSimple size={18} />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingSlug === p.id}
                            onClick={() => handleDeleteSafari(p.id, p.title)}
                            className="inline-flex text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!safarisLoading && !safarisError && visiblePackages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      {statusFilter === 'Drafts'
                        ? 'No draft packages — every safari package is currently published.'
                        : 'No safari packages yet — add your first package to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'Parks' ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          {deleteError && (
            <div className="mx-4 mt-4 bg-error-container text-error rounded-lg px-4 py-3 text-sm">{deleteError}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Park</th>
                  <th className="px-5 py-3 font-medium">Region</th>
                  <th className="px-5 py-3 font-medium">Badge</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {parksLoading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      Loading parks…
                    </td>
                  </tr>
                )}
                {parksError && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-error text-sm">
                      {parksError}
                    </td>
                  </tr>
                )}
                {!parksLoading &&
                  !parksError &&
                  (parks ?? []).map((p) => {
                    const regionName = (destinations ?? []).find((d) => d.id === p.region)?.name ?? p.region
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center text-outline">
                              {p.images[0] ? (
                                <img src={p.images[0]} alt={p.imageAlt} className="w-full h-full object-cover" />
                              ) : (
                                <MapPin size={18} />
                              )}
                            </div>
                            <p className="font-label-md text-sm text-on-surface">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant text-sm">{regionName}</td>
                        <td className="px-5 py-4 text-on-surface-variant text-sm">{p.badge || '—'}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <Link
                              to={`/admin/content/parks/${p.id}/edit`}
                              className="inline-flex text-on-surface-variant hover:text-savanna-green p-1.5 rounded-full hover:bg-surface-container transition-colors"
                            >
                              <PencilSimple size={18} />
                            </Link>
                            <button
                              type="button"
                              disabled={deletingSlug === p.id}
                              onClick={() => handleDeletePark(p.id, p.name)}
                              className="inline-flex text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                {!parksLoading && !parksError && (parks ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                      No parks yet — add your first park to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deleteError && (
            <div className="bg-error-container text-error rounded-lg px-4 py-3 text-sm">{deleteError}</div>
          )}
          {destinationsLoading && (
            <p className="text-center text-on-surface-variant py-12">Loading destinations…</p>
          )}
          {destinationsError && <p className="text-center text-error py-12">{destinationsError}</p>}
          {!destinationsLoading && !destinationsError && destinations && destinations.length === 0 && (
            <p className="text-center text-on-surface-variant py-12">
              No destinations yet — add your first region to get started.
            </p>
          )}
          {(destinations ?? []).map((d) => {
            const isOpen = expanded === d.id
            return (
              <div key={d.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpanded(isOpen ? null : d.id)
                    }
                  }}
                  className="w-full p-5 flex items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center text-outline">
                      {d.images[0] ? (
                        <img src={d.images[0]} alt={d.imageAlt} className="w-full h-full object-cover" />
                      ) : (
                        <MapPin size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-headline-md text-lg text-on-surface mb-0.5 truncate">{d.name}</h3>
                      <p className="text-on-surface-variant text-xs">Best time to visit: {d.bestTimeToVisit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="bg-surface-container px-3 py-1 rounded-full font-label-sm text-xs text-on-surface-variant">
                      {d.experiences.length} Experiences
                    </span>
                    <Link
                      to={`/admin/content/destinations/${d.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-on-surface-variant hover:text-savanna-green p-1"
                    >
                      <PencilSimple size={16} />
                    </Link>
                    <button
                      type="button"
                      disabled={deletingSlug === d.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDestination(d.id, d.name)
                      }}
                      className="text-on-surface-variant hover:text-error p-1 disabled:opacity-50"
                    >
                      <Trash size={16} />
                    </button>
                    <CaretDown size={18} className={`text-outline transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-sand-stone bg-surface-container-low p-5">
                    <p className="font-label-md text-sm text-on-surface mb-3">Associated Experiences</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {d.experiences.map((exp) => (
                        <div key={exp.name} className="bg-surface-container-lowest p-3 rounded-lg border border-sand-stone flex items-start gap-3">
                          <div className="w-9 h-9 rounded bg-surface-variant shrink-0" />
                          <div className="min-w-0">
                            <p className="font-label-md text-sm text-on-surface truncate">{exp.name}</p>
                            <p className="text-on-surface-variant text-xs line-clamp-1">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                      {d.experiences.length === 0 && (
                        <p className="text-on-surface-variant text-sm col-span-full">No experiences added yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
