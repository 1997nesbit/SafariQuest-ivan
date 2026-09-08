import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FunnelSimple, MapPin, ArrowSquareOut, Lock, Quotes, Clock, CheckCircle, UserFocus, CalendarBlank } from '@phosphor-icons/react'
import { adminComplaints, type ComplaintStatus } from '../../data/adminComplaints'

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  Open: 'bg-error-container text-error',
  'In Progress': 'bg-golden-sun/20 text-secondary',
  Resolved: 'bg-savanna-green/15 text-savanna-green',
}

const ROW_BORDER: Record<ComplaintStatus, string> = {
  Open: 'border-l-terracotta',
  'In Progress': 'border-l-golden-sun',
  Resolved: 'border-l-transparent',
}

export function AdminComplaints() {
  const [complaints, setComplaints] = useState(adminComplaints)
  const [selectedId, setSelectedId] = useState<string | null>(adminComplaints[0]?.id ?? null)
  const [noteDraft, setNoteDraft] = useState('')

  const selected = complaints.find((c) => c.id === selectedId) ?? complaints[0] ?? null

  function setStatus(id: string, status: ComplaintStatus) {
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  function addNote(id: string) {
    const text = noteDraft.trim()
    if (!text) return
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, notes: [...c.notes, { author: 'Admin (You)', date: new Date().toISOString().slice(0, 10), text }] }
          : c,
      ),
    )
    setNoteDraft('')
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-headline-lg text-[26px] text-on-surface mb-1">Complaints Inbox</h2>
          <p className="text-on-surface-variant text-sm">Manage and resolve active guest issues.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 border border-sand-stone bg-surface-container-lowest text-on-surface font-label-md text-sm rounded-lg hover:bg-surface-container-low transition-colors"
        >
          <FunnelSimple size={16} />
          Filter
        </button>
      </div>

      {/* Persistent master-detail split layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: complaints table (~65%) */}
        <div className="w-full lg:flex-1 lg:min-w-0 bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Client &amp; Trip</th>
                  <th className="px-5 py-3 font-medium">Milestone</th>
                  <th className="px-5 py-3 font-medium w-1/3">Excerpt</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-stone">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`hover:bg-surface-container-low transition-colors cursor-pointer border-l-4 ${ROW_BORDER[c.status]} ${
                      selected?.id === c.id ? 'bg-surface-container-low' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-label-md text-sm text-on-surface">{c.customerName}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">{c.tripTitle}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant text-xs">
                        <MapPin size={13} />
                        {c.milestone}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm truncate max-w-xs">{c.excerpt}</td>
                    <td className="px-5 py-4 text-on-surface-variant text-sm">{c.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase font-bold tracking-wider ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: persistent detail panel (~35%, fixed width, always visible) */}
        <aside className="w-full lg:w-[380px] lg:shrink-0 bg-surface-container-lowest rounded-xl shadow-sm border border-sand-stone/50 flex flex-col self-stretch">
          {selected ? (
            <>
              <div className="px-6 py-5 border-b border-sand-stone bg-surface-container-low/40 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${STATUS_STYLES[selected.status]}`}>
                    {selected.status}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{selected.id}</span>
                </div>
                <h3 className="font-headline-md text-[20px] text-on-surface">{selected.customerName}</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                  <CalendarBlank size={14} /> {selected.date}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-surface-container-low rounded-lg p-4 border border-sand-stone">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Trip</p>
                      <p className="font-label-md text-sm text-on-surface">{selected.tripTitle}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Milestone</p>
                      <p className="font-label-md text-sm text-on-surface flex items-center gap-1.5">
                        <MapPin size={14} className="text-on-surface-variant" /> {selected.milestone}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-label-md text-sm text-on-surface mb-2 font-semibold">Guest Message</h4>
                  <div className="relative bg-surface p-4 rounded-lg border border-sand-stone/50 font-body-md text-sm text-on-surface/90 italic">
                    <Quotes size={28} className="absolute top-2 left-2 text-surface-dim opacity-50 -z-0" weight="fill" />
                    <span className="relative z-10">&ldquo;{selected.fullMessage}&rdquo;</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-label-md text-sm text-on-surface mb-2 font-semibold flex justify-between items-center">
                    Internal Notes
                    <Lock size={16} className="text-on-surface-variant" />
                  </h4>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add operational notes, vendor communication updates..."
                    className="w-full bg-surface border border-sand-stone rounded-lg p-3 text-sm text-on-surface focus:border-savanna-green focus:ring-1 focus:ring-savanna-green transition-colors resize-none min-h-[90px] placeholder:text-on-surface-variant/60"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => addNote(selected.id)}
                      className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded hover:bg-surface-container transition-colors"
                    >
                      Add Note
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 pl-3 border-l-2 border-sand-stone">
                    {selected.notes.map((n, i) => (
                      <div key={i} className="relative pl-4">
                        <div className="absolute w-2 h-2 rounded-full bg-savanna-green -left-[5px] top-1.5 border-2 border-surface-container-lowest" />
                        <p className="font-label-sm text-[11px] text-on-surface-variant mb-0.5">
                          {n.author} &bull; {n.date}
                        </p>
                        <p className="text-sm text-on-surface">{n.text}</p>
                      </div>
                    ))}
                    {selected.notes.length === 0 && <p className="text-on-surface-variant text-sm">No notes yet.</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-sand-stone bg-surface-container-low/40 grid grid-cols-2 gap-3 shrink-0">
                <Link
                  to={`/admin/clients/${selected.customerId}`}
                  className="col-span-2 flex items-center justify-center gap-2 w-full bg-surface-container-lowest border border-terracotta text-terracotta font-label-md text-sm py-2.5 rounded-lg hover:bg-terracotta/5 transition-colors"
                >
                  <UserFocus size={16} />
                  View Client 360
                  <ArrowSquareOut size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => setStatus(selected.id, 'In Progress')}
                  className="flex items-center justify-center gap-2 bg-surface-container text-on-surface font-label-md text-sm py-2.5 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Clock size={16} />
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(selected.id, 'Resolved')}
                  className="flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  <CheckCircle size={16} />
                  Resolve
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10 text-on-surface-variant text-sm">No complaints to show.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
