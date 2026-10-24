import { useState, type FormEvent } from 'react'
import { BookOpen, Broadcast, FirstAidKit, ChatCircle, Phone } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { getBookings, type Booking } from '../../api/bookings'
import { createTicket } from '../../api/support'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'
import { contact } from '../../config/contact'

const CATEGORIES = ['Vehicle Issue', 'Guest Emergency', 'Guide Safety', 'Equipment', 'Other']

const HELP_LINKS = [
  { label: 'Guide Handbook', icon: BookOpen },
  { label: 'Radio Frequencies', icon: Broadcast },
  { label: 'Emergency Contacts', icon: FirstAidKit },
]

export function GuideSupport() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: bookings } = useFetch<Booking[]>(() => getBookings(), [])
  const trips = bookings ?? []

  const [tripId, setTripId] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createTicket({
        booking: tripId ? Number(tripId) : undefined,
        category,
        description,
        photo: photo || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="Support" showBack />

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-6">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-1">Need help right now?</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Reach Operations directly for anything urgent during a trip.
          </p>
          <div className="flex gap-3">
            {/* The company's own numbers (config/contact.ts), not a guide-specific line. */}
            <a
              href={contact.phoneHref}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container text-on-surface py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors"
            >
              <Phone size={20} />
              Call Ops
            </a>
            {contact.social.whatsapp && (
              <a
                href={contact.social.whatsapp}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-lg font-label-md text-label-md hover:bg-[#128C7E] transition-colors"
              >
                <ChatCircle size={20} weight="fill" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-6">
          <h3 className="font-headline-md text-[18px] text-on-surface mb-4">Report an Issue</h3>
          {submitted ? (
            <p className="font-body-md text-body-md text-savanna-green font-bold py-4 text-center">
              Report submitted — Operations has been notified.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="issue-trip" className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block">
                  Trip (optional)
                </label>
                <select
                  id="issue-trip"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="w-full bg-surface border border-surface-variant rounded-lg py-2.5 px-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.packageTitle} — {trip.startDate} – {trip.endDate}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="issue-category" className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block">
                  Category
                </label>
                <select
                  id="issue-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface border border-surface-variant rounded-lg py-2.5 px-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="issue-description" className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block">
                  Description
                </label>
                <textarea
                  id="issue-description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What happened?"
                  className="w-full bg-surface border border-surface-variant rounded-lg p-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="Photo URL (optional)"
                className="w-full bg-surface border border-surface-variant rounded-lg py-2.5 px-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {error && <p className="text-error text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-savanna-green text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {HELP_LINKS.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-surface-variant/50 opacity-60"
            >
              <span className="flex items-center gap-3 font-label-md text-on-surface">
                <Icon size={20} className="text-on-surface-variant" />
                {label}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Coming soon</span>
            </div>
          ))}
        </div>
      </main>

      <GuideBottomNav active="profile" />
    </div>
  )
}
