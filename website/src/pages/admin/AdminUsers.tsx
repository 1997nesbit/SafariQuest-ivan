import { useState, type FormEvent } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { getUsers, inviteUser, type AdminUserRecord, type InvitableRole, type StaffRole } from '../../api/users'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administrator',
  sales: 'Sales Agent',
  operations: 'Operations',
  guide: 'Guide',
}

const ROLE_BADGE: Record<StaffRole, string> = {
  admin: 'bg-terracotta/15 text-terracotta',
  sales: 'bg-golden-sun/15 text-secondary',
  operations: 'bg-savanna-green/15 text-savanna-green',
  guide: 'bg-deep-earth/15 text-deep-earth',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AdminUsers() {
  const { data: users, loading, error, refetch } = useFetch(getUsers, [])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('sales')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openCreate() {
    setName('')
    setEmail('')
    setRole('sales')
    setFormError(null)
    setCreating(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      await inviteUser({ name, email, role })
      setCreating(false)
      refetch()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to invite user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Users &amp; Roles</h2>
          <p className="text-on-surface-variant text-sm">Manage staff accounts.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={16} />
          Invite Staff
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
        {loading && <p className="p-10 text-center text-on-surface-variant text-sm">Loading users…</p>}
        {error && <p className="p-10 text-center text-error text-sm">{error}</p>}
        {!loading && !error && users && users.length === 0 && (
          <p className="p-10 text-center text-on-surface-variant text-sm">No staff accounts yet.</p>
        )}
        {!loading && !error && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {users.map((u: AdminUserRecord) => (
                  <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ROLE_BADGE[u.role]}`}>
                          {initials(u.name || u.email)}
                        </div>
                        <span className="font-label-md text-sm text-on-surface">{u.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex justify-end bg-deep-earth/30 backdrop-blur-sm" onClick={() => setCreating(false)}>
          <div className="w-full max-w-md h-full bg-surface-container-lowest shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-[18px] text-on-surface">Invite Staff</h3>
                <button type="button" onClick={() => setCreating(false)} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-on-surface-variant text-sm">Send an invite to a new Sales Agent, Operations, or Guide staff member.</p>
            </div>

            <form id="invite-user-form" className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="new-user-name" className="block font-label-md text-sm text-on-surface mb-1.5">Full Name</label>
                <input
                  id="new-user-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              <div>
                <label htmlFor="new-user-email" className="block font-label-md text-sm text-on-surface mb-1.5">Email Address</label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pandewildernesssafari.com"
                  className="w-full bg-surface border border-sand-stone rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-savanna-green focus:border-savanna-green transition-colors"
                />
              </div>
              <div>
                <p className="block font-label-md text-sm text-on-surface mb-2">Role</p>
                <div className="flex gap-2">
                  {(['sales', 'operations', 'guide'] as InvitableRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-lg text-xs font-label-md transition-colors ${
                        role === r ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p role="alert" className="text-error font-label-sm text-sm">{formError}</p>}
            </form>

            <div className="border-t border-sand-stone px-6 py-4 bg-surface-container-low/40 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg px-4 py-2 font-label-md text-sm text-on-surface-variant hover:bg-surface-container transition-colors border border-sand-stone">
                Cancel
              </button>
              <button type="submit" form="invite-user-form" disabled={submitting} className="rounded-lg bg-savanna-green px-6 py-2 font-label-md text-sm text-on-primary hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
                {submitting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
