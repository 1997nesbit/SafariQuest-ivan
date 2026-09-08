import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CalendarBlank, NotePencil, ShieldCheck, PencilSimple, PaperPlaneRight } from '@phosphor-icons/react'
import { getDestinations } from '../../api/destinations'
import { getSafaris } from '../../api/safaris'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'

export function PlanReview() {
  const { plan } = useTripPlan()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const { data: destinations } = useFetch(getDestinations, [])
  const { data: safaris } = useFetch(getSafaris, [])

  const selectedDestinations = (destinations ?? []).filter((d) => plan.destinationIds.includes(d.id))
  const selectedExperiences = (safaris ?? [])
    .filter((s) => plan.experienceIds.includes(s.id))
    .map((s) => ({ id: s.id, title: s.title }))
  const travelers = plan.adults + plan.children

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/inquiry-received', { state: { name } })
  }

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          Review your journey
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Take a moment to check your safari details before submitting your inquiry. Our curators will use this to
          craft your perfect itinerary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
            <h3 className="font-headline-md text-[20px] text-on-surface mb-5 flex items-center gap-3">
              <MapPin size={22} className="text-savanna-green" />
              Destinations &amp; Experiences
            </h3>
            <div className="space-y-4 mb-6">
              {selectedDestinations.map((d) => (
                <div key={d.id} className="flex gap-4 items-center pb-4 border-b border-sand-stone last:border-0 last:pb-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                    <img src={d.images[0]} alt={d.imageAlt} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface text-[16px] mb-1">{d.name}</p>
                    <p className="text-on-surface-variant text-sm">{d.highlight}</p>
                  </div>
                </div>
              ))}
            </div>
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">
              Selected Experiences
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedExperiences.map((e) => (
                <span key={e.id} className="bg-surface-container text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full">
                  {e.title}
                </span>
              ))}
              {selectedExperiences.length === 0 && (
                <p className="text-on-surface-variant text-sm">No experiences selected.</p>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
            <h3 className="font-headline-md text-[20px] text-on-surface mb-5 flex items-center gap-3">
              <CalendarBlank size={22} className="text-savanna-green" />
              Trip Logistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Days</p>
                <p className="font-label-md text-on-surface">{plan.days}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Travel Dates
                </p>
                <p className="font-label-md text-on-surface">{plan.travelDates || 'Flexible'}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Travelers
                </p>
                <p className="font-label-md text-on-surface">
                  {travelers} ({plan.adults} adult{plan.adults !== 1 ? 's' : ''}
                  {plan.children > 0 ? `, ${plan.children} child${plan.children !== 1 ? 'ren' : ''}` : ''})
                </p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Style</p>
                <p className="font-label-md text-on-surface">{plan.accommodationTier}</p>
              </div>
            </div>
          </section>

          {plan.notes && (
            <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
              <h3 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-3">
                <NotePencil size={22} className="text-savanna-green" />
                Your Notes
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant italic border-l-2 border-savanna-green pl-4">
                &ldquo;{plan.notes}&rdquo;
              </p>
            </section>
          )}

          <button
            type="button"
            onClick={() => navigate('/plan/details')}
            className="self-start inline-flex items-center gap-2 text-terracotta font-label-md text-label-md hover:opacity-80 transition-opacity"
          >
            <PencilSimple size={18} />
            Edit Selections
          </button>
        </div>

        <aside className="lg:col-span-2 lg:sticky lg:top-8">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-5"
          >
            <div>
              <h3 className="font-headline-md text-[20px] text-on-surface mb-1">Your Details</h3>
              <p className="font-body-md text-sm text-on-surface-variant">Where should we send your personalized quote?</p>
            </div>
            <div>
              <label htmlFor="review-name" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Full Name
              </label>
              <input
                id="review-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="review-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Email
              </label>
              <input
                id="review-email"
                type="email"
                required
                placeholder="jane@example.com"
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="review-phone" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Phone / WhatsApp
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country code"
                  defaultValue="+255"
                  className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-3 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                >
                  <option>+255</option>
                  <option>+1</option>
                  <option>+44</option>
                </select>
                <input
                  id="review-phone"
                  type="tel"
                  required
                  placeholder="(000) 000-0000"
                  className="flex-1 min-w-0 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-lg">
              <ShieldCheck size={20} className="text-golden-sun shrink-0 mt-0.5" />
              <p className="font-body-md text-[13px] text-on-surface-variant">
                <strong className="text-on-surface">No payment required now.</strong> We&apos;ll send you a detailed,
                no-obligation quote within 24 hours.
              </p>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-4 rounded-lg font-label-md text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md"
            >
              Submit Inquiry
              <PaperPlaneRight size={18} weight="bold" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
