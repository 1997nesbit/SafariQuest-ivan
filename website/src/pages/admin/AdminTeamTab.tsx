import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import { deleteTeamMember, getTeam } from '../../api/team'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { initials } from '../../lib/initials'

/** The Team tab of the Content Manager: who appears under "Meet the Experts" on the About page. */
export function AdminTeamTab() {
  // includeUnpublished: drafts are listed here so they can be edited and published;
  // the public About page asks without it and never sees them.
  const { data: team, loading, error, refetch } = useFetch(() => getTeam({ includeUnpublished: true }), [])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Remove ${name} from the team? This cannot be undone.`)) return
    setDeleteError(null)
    setDeletingId(id)
    try {
      await deleteTeamMember(id)
      refetch()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete team member.')
    } finally {
      setDeletingId(null)
    }
  }

  const members = team ?? []

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
      {deleteError && (
        <div className="mx-4 mt-4 bg-error-container text-error rounded-lg px-4 py-3 text-sm">{deleteError}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Team Member</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-stone">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                  Loading team…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-error text-sm">
                  {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              members.map((m) => (
                <tr key={m.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        <img src={m.photo} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-sm font-label-md text-on-surface-variant shrink-0">
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-label-md text-sm text-on-surface">{m.name}</p>
                        <p className="text-on-surface-variant text-xs">{m.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                        m.isPublished ? 'bg-savanna-green/15 text-savanna-green' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${m.isPublished ? 'bg-savanna-green' : 'bg-outline'}`} />
                      {m.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant text-sm">{m.order}</td>
                  <td className="px-5 py-4 text-right">
                    {/* Always visible on touch screens, where there is no hover to reveal them. */}
                    <div className="inline-flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <Link
                        to={`/admin/content/team/${m.id}/edit`}
                        aria-label={`Edit ${m.name}`}
                        className="inline-flex text-on-surface-variant hover:text-savanna-green p-1.5 rounded-full hover:bg-surface-container transition-colors"
                      >
                        <PencilSimple size={18} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${m.name}`}
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id, m.name)}
                        className="inline-flex text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && !error && members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-on-surface-variant text-sm">
                  No team members yet — add the people you want under &ldquo;Meet the Experts&rdquo; on the About page.
                  Until you do, that section stays hidden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
