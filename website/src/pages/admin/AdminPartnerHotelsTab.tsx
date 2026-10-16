import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowSquareOut, Buildings, PencilSimple, Trash } from '@phosphor-icons/react'
import { deletePartnerHotel, getPartnerHotels, type PartnerHotel } from '../../api/homepage'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

/** The Partner Hotels tab of the Content Manager: the hotels listed on the homepage. */
export function AdminPartnerHotelsTab() {
  // includeUnpublished: hidden hotels are listed here so they can be edited and shown
  // again; the homepage asks without it and never sees them.
  const { data, loading, error, refetch } = useFetch(() => getPartnerHotels({ includeUnpublished: true }), [])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const hotels = data ?? []

  async function handleDelete(hotel: PartnerHotel) {
    if (!window.confirm(`Remove ${hotel.name} from the partner hotels? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingId(hotel.id)
    try {
      await deletePartnerHotel(hotel.id)
      refetch()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete the hotel.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
      {deleteError && (
        <div className="mx-4 mt-4 bg-error-container text-error rounded-lg px-4 py-3 text-sm">{deleteError}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Hotel</th>
              <th className="px-5 py-3 font-medium">Website</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-stone">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                  Loading hotels…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-error text-sm">
                  {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              hotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {hotel.image ? (
                        <img src={hotel.image} alt="" className="w-16 h-12 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-12 rounded bg-surface-container flex items-center justify-center shrink-0">
                          <Buildings size={20} className="text-outline" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-label-md text-sm text-on-surface">{hotel.name}</p>
                        {hotel.location && <p className="text-on-surface-variant text-xs">{hotel.location}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <a
                      href={hotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-savanna-green hover:underline max-w-[16rem] truncate"
                    >
                      {hotel.website.replace(/^https?:\/\//, '')}
                      <ArrowSquareOut size={12} className="shrink-0" />
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                        hotel.isPublished ? 'bg-savanna-green/15 text-savanna-green' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${hotel.isPublished ? 'bg-savanna-green' : 'bg-outline'}`} />
                      {hotel.isPublished ? 'Shown' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant text-sm">{hotel.order}</td>
                  <td className="px-5 py-4 text-right">
                    {/* Always visible on touch screens, where there is no hover to reveal them. */}
                    <div className="inline-flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <Link
                        to={`/admin/content/partner-hotels/${hotel.id}/edit`}
                        aria-label={`Edit ${hotel.name}`}
                        className="inline-flex text-on-surface-variant hover:text-savanna-green p-1.5 rounded-full hover:bg-surface-container transition-colors"
                      >
                        <PencilSimple size={18} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${hotel.name}`}
                        disabled={deletingId === hotel.id}
                        onClick={() => handleDelete(hotel)}
                        className="inline-flex text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && !error && hotels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                  No partner hotels yet. Add the hotels and lodges you work with. Until you do, that homepage section
                  stays hidden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
