import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle,
  Check,
  EnvelopeSimple,
  Receipt,
  Money,
  Star,
  PaperPlaneTilt,
  ChatCircle,
  CalendarCheck,
  Users,
  IdentificationBadge,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import {
  addNote,
  getBooking,
  sendQuote,
  updateBooking,
  updateQuote,
  STAGE_LABELS,
  STAGE_ORDER,
  type BookingStage,
  type QuoteLineItemInput,
} from '../../api/bookings'
import { getGuides } from '../../api/guides'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const STAGE_ICON: Record<BookingStage, typeof EnvelopeSimple> = {
  new_inquiry: EnvelopeSimple,
  quoted: Receipt,
  deposit_paid: Money,
  confirmed: CheckCircle,
  completed: Star,
}

const STAGE_DOT: Record<BookingStage, string> = {
  new_inquiry: 'bg-secondary-container',
  quoted: 'bg-golden-sun',
  deposit_paid: 'bg-primary-fixed-dim',
  confirmed: 'bg-savanna-green',
  completed: 'bg-terracotta',
}

const NEXT_STAGE_ACTION: Partial<Record<BookingStage, { label: string; next: BookingStage }>> = {
  quoted: { label: 'Mark Deposit Paid', next: 'deposit_paid' },
  deposit_paid: { label: 'Mark Confirmed', next: 'confirmed' },
  confirmed: { label: 'Mark Completed', next: 'completed' },
}

function quotePrice(item: QuoteLineItemInput) {
  return Math.round(item.cost * (1 + item.markupPercent / 100))
}

export function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const bookingId = Number(id)
  const { data: booking, loading, error, refetch } = useFetch(() => getBooking(bookingId), [bookingId])
  const { data: guides } = useFetch(getGuides, [])

  const [lineItems, setLineItems] = useState<QuoteLineItemInput[]>([])
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [savingQuote, setSavingQuote] = useState(false)
  const [sendingQuote, setSendingQuote] = useState(false)
  const [postingNote, setPostingNote] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)
  const [assigningGuide, setAssigningGuide] = useState(false)

  useEffect(() => {
    if (booking) {
      setLineItems(booking.lineItems.map(({ label, cost, markupPercent }) => ({ label, cost, markupPercent })))
    }
  }, [booking])

  if (loading) {
    return <p className="text-center text-on-surface-variant py-10">Loading booking…</p>
  }

  if (error || !booking) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">{error ?? 'Booking not found.'}</p>
        <Link to="/admin/inquiries" className="text-savanna-green font-label-md">
          Back to pipeline
        </Link>
      </div>
    )
  }

  const stageIndex = STAGE_ORDER.indexOf(booking.stage)
  const subtotal = lineItems.reduce((sum, li) => sum + quotePrice(li), 0)
  const nextStageAction = NEXT_STAGE_ACTION[booking.stage]
  const availableGuides = (guides ?? []).filter(
    (g) => g.status === 'Available' || g.id === booking.assignedGuideId,
  )

  function updateLineItem(index: number, patch: Partial<QuoteLineItemInput>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { label: '', cost: 0, markupPercent: 0 }])
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index))
  }

  async function handleSaveDraft() {
    setActionError(null)
    setSavingQuote(true)
    try {
      await updateQuote(bookingId, lineItems)
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to save the quote.')
    } finally {
      setSavingQuote(false)
    }
  }

  async function handleSendQuote() {
    setActionError(null)
    setSendingQuote(true)
    try {
      await updateQuote(bookingId, lineItems)
      await sendQuote(bookingId)
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to send the quote.')
    } finally {
      setSendingQuote(false)
    }
  }

  async function handlePostNote() {
    if (!note.trim()) return
    setActionError(null)
    setPostingNote(true)
    try {
      await addNote(bookingId, note.trim())
      setNote('')
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to post the note.')
    } finally {
      setPostingNote(false)
    }
  }

  async function handleAdvanceStage() {
    if (!nextStageAction) return
    setActionError(null)
    setUpdatingStage(true)
    try {
      await updateBooking(bookingId, { stage: nextStageAction.next })
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update the stage.')
    } finally {
      setUpdatingStage(false)
    }
  }

  async function handleAssignGuide(guideId: number) {
    setActionError(null)
    setAssigningGuide(true)
    try {
      await updateBooking(bookingId, { assignedGuide: guideId })
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to assign the guide.')
    } finally {
      setAssigningGuide(false)
    }
  }

  return (
    <div>
      <Link to="/admin/inquiries" className="text-on-surface-variant hover:text-savanna-green text-sm mb-4 inline-block">
        ← Back to Pipeline
      </Link>

      {actionError && <p className="text-error text-sm mb-4">{actionError}</p>}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant shrink-0 mt-1">
            {booking.customerName
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider mb-1">Booking #{booking.id}</p>
            <h2 className="font-headline-lg text-[24px] text-on-surface mb-1">{booking.customerName}</h2>
            <p className="text-on-surface-variant text-sm flex items-center gap-1.5">
              <EnvelopeSimple size={14} /> {booking.customerEmail}
            </p>
            <p className="text-on-surface-variant text-sm mt-0.5">
              {booking.packageTitle} · {booking.startDate} – {booking.endDate} · {booking.guests} guests
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-label-sm bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[booking.stage]}`} />
            {STAGE_LABELS[booking.stage]}
          </span>
          {nextStageAction && (
            <button
              type="button"
              onClick={handleAdvanceStage}
              disabled={updatingStage}
              className="min-h-[40px] flex items-center gap-2 bg-savanna-green text-on-primary px-4 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
            >
              <PaperPlaneTilt size={16} />
              {updatingStage ? 'Updating…' : nextStageAction.label}
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-4 w-full h-0.5 bg-surface-container" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-savanna-green transition-all"
            style={{ width: `${(stageIndex / (STAGE_ORDER.length - 1)) * 100}%` }}
          />
          {STAGE_ORDER.map((stage, i) => {
            const Icon = i < stageIndex ? Check : STAGE_ICON[stage]
            const done = i <= stageIndex
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${
                    done ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <Icon size={15} />
                </div>
                <span className={`font-label-sm text-xs text-center ${i === stageIndex ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  {i < stageIndex ? 'Done' : i === stageIndex ? 'In Progress' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 h-fit">
            <h3 className="font-headline-md text-[18px] text-on-surface mb-5 border-b border-sand-stone pb-4">Submission Details</h3>
            <div className="flex flex-col gap-4">
              <div>
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1.5">Region</span>
                <span className="bg-surface-container px-3 py-1 rounded-full font-label-md text-sm text-on-surface inline-block">
                  {booking.region}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <CalendarCheck size={13} /> Dates
                  </span>
                  <p className="text-sm text-on-surface">
                    {booking.startDate} – {booking.endDate}
                  </p>
                </div>
                <div>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Users size={13} /> Guests
                  </span>
                  <p className="text-sm text-on-surface">{booking.guests}</p>
                </div>
              </div>
              <div>
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <IdentificationBadge size={13} /> Assigned Guide
                </span>
                <select
                  value={booking.assignedGuideId ?? ''}
                  onChange={(e) => e.target.value && handleAssignGuide(Number(e.target.value))}
                  disabled={assigningGuide}
                  className="w-full mt-1 bg-surface border border-sand-stone rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green"
                >
                  <option value="" disabled>
                    Unassigned
                  </option>
                  {availableGuides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-1 text-sm border-t border-sand-stone pt-4">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email</span>
                  <span className="text-on-surface">{booking.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Created</span>
                  <span className="text-on-surface">{booking.createdAt}</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg border-l-4 border-terracotta">
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-2">Guest Message</span>
                <p className="text-sm text-on-surface italic">&ldquo;{booking.message}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <h3 className="font-headline-md text-[18px] text-on-surface mb-4 border-b border-sand-stone pb-4">Quote Builder</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left mb-4">
                <thead>
                  <tr className="border-b-2 border-sand-stone text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="pb-2 font-medium">Line Item</th>
                    <th className="pb-2 font-medium text-right">Cost (Net)</th>
                    <th className="pb-2 font-medium text-right">Markup %</th>
                    <th className="pb-2 font-medium text-right">Quote Price</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-stone">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-2">
                        <input
                          value={li.label}
                          onChange={(e) => updateLineItem(i, { label: e.target.value })}
                          className="w-full bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={li.cost}
                          onChange={(e) => updateLineItem(i, { cost: Number(e.target.value) })}
                          className="w-24 bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={li.markupPercent}
                          onChange={(e) => updateLineItem(i, { markupPercent: Number(e.target.value) })}
                          className="w-20 bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="py-3 text-right font-label-md text-sm text-on-surface">${quotePrice(li).toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => removeLineItem(i)} className="text-on-surface-variant hover:text-terracotta">
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-savanna-green font-label-md text-sm mb-4"
              >
                <Plus size={16} /> Add Line Item
              </button>
            </div>
            <div className="flex justify-end border-t-2 border-sand-stone pt-4">
              <div className="w-56 flex justify-between items-center">
                <span className="font-headline-md text-[18px] text-on-surface">Total</span>
                <span className="font-headline-md text-[18px] text-savanna-green">${Math.round(subtotal).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingQuote}
                className="min-h-[40px] border border-sand-stone px-5 rounded-lg font-label-md text-sm hover:bg-surface-container-low transition-colors disabled:opacity-60"
              >
                {savingQuote ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handleSendQuote}
                disabled={sendingQuote}
                className="min-h-[40px] bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
              >
                {sendingQuote ? 'Sending…' : 'Send Final Quote'}
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <h3 className="font-label-md text-xs text-on-surface uppercase tracking-wider mb-4 border-b border-sand-stone pb-3">
              Internal Notes &amp; Activity
            </h3>
            <div className="space-y-4 mb-4">
              {booking.notes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                    <ChatCircle size={16} className="text-on-primary-fixed-variant" />
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg flex-1">
                    <p className="font-label-sm text-xs text-on-surface-variant mb-1">
                      {n.author} · {n.createdAt}
                    </p>
                    <p className="text-on-surface text-sm">{n.text}</p>
                  </div>
                </div>
              ))}
              {booking.notes.length === 0 && <p className="text-on-surface-variant text-sm">No notes yet.</p>}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note..."
              className="w-full bg-surface border border-sand-stone rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-savanna-green resize-none h-20 mb-2"
            />
            <button
              type="button"
              onClick={handlePostNote}
              disabled={postingNote || !note.trim()}
              className="w-full py-2 rounded-lg bg-surface-container text-on-surface-variant text-sm font-label-md hover:bg-surface-container-high transition-colors disabled:opacity-60"
            >
              {postingNote ? 'Posting…' : 'Post Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
