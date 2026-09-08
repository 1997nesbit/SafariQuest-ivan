import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  Eye,
  Compass,
  Car,
  ForkKnife,
  UsersThree,
  UserPlus,
  DotsThreeVertical,
  Trophy,
  Funnel,
  SquaresFour,
  Rows,
  SealCheck,
} from '@phosphor-icons/react'
import { createGuide, getGuides, type GuideRole, type GuideStatus } from '../../api/guides'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const ROLES: (GuideRole | 'All')[] = ['All', 'Senior Guide', 'Expert Guide', 'Driver-Guide', 'Camp Chef', 'Tour Helper']
const STATUSES: (GuideStatus | 'All')[] = ['All', 'Available', 'On Trip', 'Off-Duty']

const ROLE_ICON: Record<GuideRole, typeof Eye> = {
  'Senior Guide': Eye,
  'Expert Guide': Compass,
  'Driver-Guide': Car,
  'Camp Chef': ForkKnife,
  'Tour Helper': UsersThree,
}

const STATUS_BADGE: Record<GuideStatus, string> = {
  Available: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
  'On Trip': 'bg-secondary-container/20 text-secondary border border-secondary-container/40',
  'Off-Duty': 'bg-surface-dim text-on-surface-variant border border-outline-variant',
}

export function AdminStaffGuides() {
  const [role, setRole] = useState<GuideRole | 'All'>('All')
  const [status, setStatus] = useState<GuideStatus | 'All'>('All')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<GuideRole>('Senior Guide')
  const [addError, setAddError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: guides, loading, error, refetch } = useFetch(getGuides, [])
  const allGuides = guides ?? []
  const filtered = allGuides.filter((s) => (role === 'All' || s.role === role) && (status === 'All' || s.status === status))
  const topRated = [...allGuides].sort((a, b) => b.rating - a.rating).slice(0, 3)

  async function handleAddStaff(event: FormEvent) {
    event.preventDefault()
    setAddError(null)
    setSubmitting(true)
    try {
      await createGuide({ name: addName, role: addRole, status: 'Available' })
      setAddOpen(false)
      setAddName('')
      refetch()
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to add staff member.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Staff &amp; Guide Management</h2>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Manage your team of wilderness experts. Oversee schedules, track performance ratings, and update field assignments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-savanna-green text-on-primary py-3 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap shrink-0"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
      </div>

      <div className="bg-surface-container-lowest/90 backdrop-blur-md border border-sand-stone/50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <span className="font-label-md text-sm text-on-surface-variant mr-1 flex items-center gap-2">
            <Funnel size={16} />
            Filter by:
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as GuideRole | 'All')}
            className="bg-surface border border-sand-stone rounded-lg px-4 py-2 font-label-md text-sm text-on-surface focus:outline-none focus:border-savanna-green"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Roles' : r}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as GuideStatus | 'All')}
            className="bg-surface border border-sand-stone rounded-lg px-4 py-2 font-label-md text-sm text-on-surface focus:outline-none focus:border-savanna-green"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'Status: Any' : s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'text-savanna-green bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <SquaresFour size={20} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'text-savanna-green bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}
          >
            <Rows size={20} />
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-10">Loading staff…</p>}
      {error && <p className="text-center text-error py-10">{error}</p>}

      {!loading && !error && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 xl:col-span-9">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((s) => {
                const RoleIcon = ROLE_ICON[s.role]
                return (
                  <div
                    key={s.id}
                    className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/30 hover:border-savanna-green/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center font-headline-md text-xl text-on-surface-variant shadow-sm">
                          {s.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-surface-container-lowest rounded-full p-0.5">
                          <SealCheck size={16} weight="fill" className="text-savanna-green" />
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-label-sm text-xs ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                    </div>
                    <h3 className="font-headline-md text-[20px] text-on-surface mb-1">{s.name}</h3>
                    <p className="font-label-md text-sm text-on-surface-variant mb-4 flex items-center gap-2">
                      <RoleIcon size={16} />
                      {s.role}
                    </p>
                    <div className="flex items-center gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={18} weight="fill" className={i < Math.round(s.rating) ? 'text-golden-sun' : 'text-outline-variant'} />
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-sand-stone/50">
                      <span className="flex-1 py-2 text-center text-on-surface-variant font-label-md text-sm rounded-lg">Schedule</span>
                      <Link
                        to={`/admin/guides/${s.id}`}
                        className="flex-1 py-2 text-center text-savanna-green font-label-md text-sm hover:bg-surface-container rounded-lg transition-colors"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-on-surface-variant text-sm py-10">No staff match these filters.</p>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 font-medium">Staff Member</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Rating</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-stone">
                    {filtered.map((s) => {
                      const RoleIcon = ROLE_ICON[s.role]
                      return (
                        <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <Link to={`/admin/guides/${s.id}`} className="font-label-md text-sm text-on-surface hover:text-savanna-green">
                                {s.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs bg-surface-container text-on-surface">
                              <RoleIcon size={14} />
                              {s.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center py-1 px-2.5 rounded-md text-xs ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1 text-golden-sun text-sm">
                              <Star size={14} weight="fill" />
                              <span className="text-on-surface font-label-md">{s.rating}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={`/admin/guides/${s.id}`}
                              className="inline-flex text-on-surface-variant hover:text-savanna-green p-1.5 rounded-full hover:bg-surface-container transition-colors"
                            >
                              <DotsThreeVertical size={18} weight="bold" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                          No staff match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/30 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-golden-sun/10 flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-golden-sun" />
              </div>
              <h3 className="font-headline-md text-[22px] text-on-surface leading-tight">Top Guides</h3>
            </div>
            <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider mb-6">This Month&apos;s Highest Rated</p>
            <div className="flex flex-col gap-6">
              {topRated.map((s, i) => (
                <Link key={s.id} to={`/admin/guides/${s.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-label-md text-sm text-on-surface-variant">
                      {s.name.charAt(0)}
                    </div>
                    <div
                      className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-surface-container-lowest ${
                        i === 0 ? 'bg-golden-sun text-white' : 'bg-surface-dim text-on-surface'
                      }`}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-label-md text-sm text-on-surface truncate">{s.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={14} weight="fill" className="text-golden-sun" />
                      <span className="font-label-sm text-xs text-on-surface-variant">{s.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to="/admin/analytics"
              className="block w-full mt-8 py-3 text-center border border-terracotta text-terracotta rounded-lg font-label-md text-sm hover:bg-terracotta/5 transition-colors"
            >
              View Full Report
            </Link>
          </div>
        </div>
      </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
              <h3 className="font-headline-md text-[18px] text-on-surface">Add New Staff</h3>
            </div>
            <form id="add-staff-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleAddStaff}>
              <div>
                <label htmlFor="staff-name" className="block font-label-md text-sm text-on-surface mb-1.5">Full Name</label>
                <input
                  id="staff-name"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="staff-role" className="block font-label-md text-sm text-on-surface mb-1.5">Role</label>
                <select
                  id="staff-role"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as GuideRole)}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                >
                  {(['Senior Guide', 'Expert Guide', 'Driver-Guide', 'Camp Chef', 'Tour Helper'] as GuideRole[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {addError && <p role="alert" className="text-error font-label-sm text-sm">{addError}</p>}
            </form>
            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="add-staff-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
