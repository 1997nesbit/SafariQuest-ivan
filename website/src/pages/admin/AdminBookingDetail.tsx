import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Check,
  EnvelopeSimple,
  Receipt,
  PencilSimple,
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
  type BookingStage,
  type QuoteLineItemInput,
} from '../../api/bookings'
import { getGuides } from '../../api/guides'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { formatMoney } from '../../lib/money'

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
  return item.quantity * item.unitPrice
}

function tripDurationDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
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

  // lineItems is an editable draft of booking.lineItems that has to resync
  // whenever a *new* booking arrives — the initial load, and again after
  // every save-triggered refetch() (line ~119/132), since the server's saved
  // state is the source of truth once a save lands. A one-time lazy
  // initializer only handles the first case; this compares against the
  // previous value in state and resets during render on every subsequent
  // change too — React's own recommended pattern, and an effect here was
  // flagged by this repo's stricter react-hooks/set-state-in-effect rule.
  const [prevBooking, setPrevBooking] = useState(booking)
  if (booking !== prevBooking) {
    setPrevBooking(booking)
    if (booking) {
      setLineItems(
        booking.lineItems.map(({ label, quantity, unitPrice }) => ({ label, quantity, unitPrice })),
      )
    }
  }

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

  const subtotal = lineItems.reduce((sum, li) => sum + quotePrice(li), 0)
  const quoteSent = booking.stage !== 'new_inquiry'
  // The API refuses quote edits once a deposit is paid (the invoice and the payment are
  // against the current figure), so the builder goes read-only from then on.
  const quoteLocked = booking.stage !== 'new_inquiry' && booking.stage !== 'quoted'
  const nextStageAction = NEXT_STAGE_ACTION[booking.stage]
  const availableGuides = (guides ?? []).filter(
    (g) => g.status === 'Available' || g.id === booking.assignedGuideId,
  )

  function updateLineItem(index: number, patch: Partial<QuoteLineItemInput>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { label: '', quantity: 1, unitPrice: 0 }])
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
        <div>
          <h2 className="font-headline-lg text-[28px] text-on-surface mb-1">Inquiry #INQ-{booking.id}</h2>
          <p className="text-on-surface-variant text-sm">Client: {booking.customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-3 shrink-0">
          {!quoteSent ? (
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={sendingQuote || lineItems.length === 0}
              title={lineItems.length === 0 ? 'Add at least one line item first' : undefined}
              className="min-h-[44px] flex items-center gap-2 bg-savanna-green text-on-primary px-5 rounded-lg font-label-md text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
            >
              <PaperPlaneTilt size={16} />
              {sendingQuote ? 'Sending…' : 'Generate & Send Invoice'}
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-4 w-full h-0.5 bg-surface-container" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-savanna-green transition-all"
            style={{ width: quoteSent ? '100%' : '0%' }}
          />
          {[
            { label: 'Inquiry Received', icon: EnvelopeSimple, done: true, caption: booking.createdAt },
            {
              label: 'Quote Drafting',
              icon: quoteSent ? Check : PencilSimple,
              done: quoteSent,
              caption: quoteSent ? 'Done' : 'In Progress',
            },
            {
              label: 'Invoiced',
              icon: Receipt,
              done: quoteSent,
              caption: quoteSent ? 'Done' : 'Pending',
            },
          ].map((step) => (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${
                  step.done ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <step.icon size={15} />
              </div>
              <span className="font-label-sm text-xs text-center text-on-surface">{step.label}</span>
              <span className="text-on-surface-variant text-[11px]">{step.caption}</span>
            </div>
          ))}
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
              <div>
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1.5">Package</span>
                <p className="text-sm text-on-surface">{booking.packageTitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <CalendarCheck size={13} /> Duration
                  </span>
                  <p className="text-sm text-on-surface">{tripDurationDays(booking.startDate, booking.endDate)} Days</p>
                </div>
                <div>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Users size={13} /> Group Size
                  </span>
                  <p className="text-sm text-on-surface">{booking.guests}</p>
                </div>
              </div>
              <div>
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <CalendarCheck size={13} /> Estimated Dates
                </span>
                <p className="text-sm text-on-surface">
                  {booking.startDate} – {booking.endDate}
                </p>
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
                <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-2">Special Requests</span>
                <p className="text-sm text-on-surface italic">
                  {booking.message ? `“${booking.message}”` : 'None noted.'}
                </p>
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
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Unit Price</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-stone">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-2">
                        <input
                          value={li.label}
                          disabled={quoteLocked}
                          onChange={(e) => updateLineItem(i, { label: e.target.value })}
                          className="w-full bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          value={li.quantity}
                          disabled={quoteLocked}
                          onChange={(e) => updateLineItem(i, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-14 bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          disabled={quoteLocked}
                          onChange={(e) => updateLineItem(i, { unitPrice: Number(e.target.value) })}
                          className="w-24 bg-surface border border-sand-stone rounded-md px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="py-3 text-right font-label-md text-sm text-on-surface">{formatMoney(quotePrice(li), undefined, booking.currency)}</td>
                      <td className="py-2 text-right">
                        {!quoteLocked && (
                          <button type="button" onClick={() => removeLineItem(i)} className="text-on-surface-variant hover:text-terracotta">
                            <Trash size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {quoteLocked ? (
                <p className="text-on-surface-variant text-sm mb-4">The quote is locked once a deposit has been paid.</p>
              ) : (
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1.5 text-savanna-green font-label-md text-sm mb-4"
                >
                  <Plus size={16} /> Add Line Item
                </button>
              )}
            </div>
            <div className="flex justify-end border-t-2 border-sand-stone pt-4">
              <div className="w-56 flex justify-between items-center">
                <span className="font-headline-md text-[18px] text-on-surface">Total</span>
                <span className="font-headline-md text-[18px] text-savanna-green">{formatMoney(Math.round(subtotal), undefined, booking.currency)}</span>
              </div>
            </div>
            {!quoteLocked && (
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  type="button"
                  onClick={() => void handleSaveDraft()}
                  disabled={savingQuote}
                  className="min-h-[40px] border border-sand-stone px-5 rounded-lg font-label-md text-sm hover:bg-surface-container-low transition-colors disabled:opacity-60"
                >
                  {savingQuote ? 'Saving…' : 'Save Draft'}
                </button>
              </div>
            )}
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
