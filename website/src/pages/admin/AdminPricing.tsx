import { useState, type FormEvent } from 'react'
import { CalendarBlank, Coins, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react'
import { createSeason, deleteSeason, getSeasons, updateSeason, type Season, type SeasonInput } from '../../api/pricing'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const EMPTY_FORM: SeasonInput = { name: '', startDate: '', endDate: '', multiplier: 1 }

export function AdminPricing() {
  const { data: seasons, loading, error, refetch } = useFetch(getSeasons, [])
  const [editing, setEditing] = useState<Season | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<SeasonInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setCreating(true)
    setEditing(null)
  }

  function openEdit(season: Season) {
    setForm({ name: season.name, startDate: season.startDate, endDate: season.endDate, multiplier: season.multiplier })
    setFormError(null)
    setEditing(season)
    setCreating(false)
  }

  function closeDrawer() {
    setCreating(false)
    setEditing(null)
  }

  async function handleDelete(season: Season) {
    if (!window.confirm(`Delete "${season.name}"?`)) return
    try {
      await deleteSeason(season.id)
      refetch()
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed to delete season.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (editing) {
        await updateSeason(editing.id, form)
      } else {
        await createSeason(form)
      }
      closeDrawer()
      refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save season.')
    } finally {
      setSubmitting(false)
    }
  }

  const drawerOpen = creating || editing !== null

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-md text-[26px] text-on-surface mb-1">Pricing Engine</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl">
            Manage seasonal price multipliers applied across the safari catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-2.5 px-6 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shrink-0 shadow-sm"
        >
          <Plus size={18} />
          Add Season
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        {loading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading seasons…</p>}
        {error && <p className="p-10 text-center text-error text-sm">{error}</p>}
        {!loading && !error && seasons && seasons.length === 0 && (
          <p className="p-10 text-center text-on-surface-variant text-sm">No seasons configured yet.</p>
        )}
        {!loading && !error && seasons && seasons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Season</th>
                  <th className="px-5 py-3 font-medium">Date Range</th>
                  <th className="px-5 py-3 font-medium">Multiplier</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {seasons.map((season) => (
                  <tr key={season.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Coins size={18} className="text-savanna-green" />
                        <span className="font-label-md text-sm text-on-surface">{season.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarBlank size={16} />
                        {season.startDate} — {season.endDate}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{season.multiplier}x</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openEdit(season)} className="p-1.5 text-outline hover:text-savanna-green rounded transition-colors">
                          <PencilSimple size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(season)} className="p-1.5 text-outline hover:text-error rounded transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={closeDrawer}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0 flex items-center justify-between">
              <h3 className="font-headline-md text-[18px] text-on-surface">{editing ? 'Edit Season' : 'Add Season'}</h3>
              <button type="button" onClick={closeDrawer} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors">
                <X size={20} />
              </button>
            </div>
            <form id="season-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="season-name" className="block font-label-md text-sm text-on-surface mb-1.5">Name</label>
                <input
                  id="season-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="season-start" className="block font-label-md text-sm text-on-surface mb-1.5">Start Date</label>
                  <input
                    id="season-start"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
                <div>
                  <label htmlFor="season-end" className="block font-label-md text-sm text-on-surface mb-1.5">End Date</label>
                  <input
                    id="season-end"
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-surface border border-sand-stone rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="season-multiplier" className="block font-label-md text-sm text-on-surface mb-1.5">Multiplier</label>
                <input
                  id="season-multiplier"
                  type="number"
                  step={0.05}
                  min={0}
                  required
                  value={form.multiplier}
                  onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))}
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              {formError && <p role="alert" className="text-error font-label-sm text-sm">{formError}</p>}
            </form>
            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeDrawer} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="season-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Saving…' : 'Save Season'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
