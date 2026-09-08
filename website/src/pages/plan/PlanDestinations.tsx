import { useNavigate } from 'react-router-dom'
import { Check, MapPin, ArrowRight } from '@phosphor-icons/react'
import { getDestinations } from '../../api/destinations'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'

export function PlanDestinations() {
  const { plan, toggleDestination } = useTripPlan()
  const navigate = useNavigate()
  const { data: destinations, loading, error } = useFetch(getDestinations, [])

  return (
    <div>
      <div className="mb-10 max-w-2xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          Where do you want to go?
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Select one or more regions to begin crafting your perfect Tanzanian adventure. You can always refine this
          later.
        </p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-16">Loading destinations…</p>}
      {error && <p className="text-center text-error py-16">{error}</p>}
      {!loading && !error && destinations && destinations.length === 0 && (
        <p className="text-center text-on-surface-variant py-16">No destinations are available yet.</p>
      )}

      {!loading && !error && destinations && destinations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {destinations.map((dest) => {
            const selected = plan.destinationIds.includes(dest.id)
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => toggleDestination(dest.id)}
                aria-pressed={selected}
                className={`group relative text-left rounded-xl overflow-hidden h-64 transition-all duration-300 ${
                  selected ? 'ring-2 ring-savanna-green shadow-lg' : 'ring-1 ring-sand-stone hover:shadow-lg'
                }`}
              >
                <img
                  src={dest.images[0]}
                  alt={dest.imageAlt}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/80 via-deep-earth/10 to-transparent" />

                <div
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                    selected ? 'bg-savanna-green border-savanna-green' : 'bg-surface/90 border-outline-variant'
                  }`}
                >
                  {selected && <Check size={16} weight="bold" className="text-on-primary" />}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin size={14} weight="fill" className="text-golden-sun" />
                    <span className="font-label-sm text-label-sm text-ivory-base uppercase tracking-wider">{dest.badge}</span>
                  </div>
                  <h3 className="font-headline-md text-[22px] text-ivory-base mb-1">{dest.name}</h3>
                  <p className="font-body-md text-[14px] text-ivory-base/80 line-clamp-2">{dest.highlight}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={plan.destinationIds.length === 0}
          onClick={() => navigate('/plan/experiences')}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(30,142,62,0.2)]"
        >
          Next: Choose Experiences
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}
