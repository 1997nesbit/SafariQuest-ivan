import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import { deletePromotion, getPromotions, type Promotion } from '../../api/promotions'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

/** The Sponsoring Events tab of the Content Manager: events shown in the homepage carousel. */
export function AdminPromotionsTab() {
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { data, loading, error, refetch } = useFetch(() => getPromotions({ includeUnpublished: true }), [])
  const events = data ?? []

  async function handleDelete(event: Promotion) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    setDeleteError(null)
    try {
      await deletePromotion(event.id)
      refetch()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete the event.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          to="/admin/content/promotions/new"
          className="min-h-[44px] inline-flex items-center px-5 bg-savanna-green text-on-primary rounded-lg font-label-md text-sm hover:opacity-90"
        >
          Add Sponsoring Event
        </Link>
      </div>

      {deleteError && <p role="alert" className="text-error text-sm">{deleteError}</p>}
      {loading && <p className="text-on-surface-variant">Loading events…</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="text-on-surface-variant">
          No sponsoring events yet. Add one to show it in the homepage carousel.
        </p>
      )}

      {!loading && events.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-stone">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-5 py-4 text-sm text-on-surface font-label-md">{event.title}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{event.phone}</td>
                  <td className="px-5 py-4 text-sm text-on-surface-variant">{event.order}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-label-sm ${
                        event.isPublished ? 'bg-savanna-green/15 text-savanna-green' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {event.isPublished ? 'Shown' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/admin/content/promotions/${event.id}/edit`}
                        aria-label={`Edit ${event.title}`}
                        className="text-on-surface-variant hover:text-savanna-green"
                      >
                        <PencilSimple size={18} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${event.title}`}
                        onClick={() => handleDelete(event)}
                        className="text-on-surface-variant hover:text-error"
                      >
                        <Trash size={18} />
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
  )
}
