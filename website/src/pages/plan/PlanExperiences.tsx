import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Clock, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { getDestinations } from '../../api/destinations'
import { getParks } from '../../api/parks'
import { getSafaris } from '../../api/safaris'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'

export function PlanExperiences() {
  const { plan, toggleExperience } = useTripPlan()
  const navigate = useNavigate()
  const { data: destinations, loading: destinationsLoading, error: destinationsError } = useFetch(getDestinations, [])
  const { data: parks, loading: parksLoading, error: parksError } = useFetch(getParks, [])
  const { data: safaris, loading: safarisLoading, error: safarisError } = useFetch(getSafaris, [])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const loading = destinationsLoading || parksLoading || safarisLoading
  const error = destinationsError || parksError || safarisError
  const selectedDestinations = (destinations ?? []).filter((d) => plan.destinationIds.includes(d.id))

  useEffect(() => {
    if (plan.destinationIds.length === 0 && !loading) {
      navigate('/plan')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.destinationIds.length, loading])

  const activeDestination = selectedDestinations.find((d) => d.id === activeTab) ?? selectedDestinations[0]
  const parksForActive = (parks ?? []).filter((p) => p.region === activeDestination?.id)
  const safarisForActive = (safaris ?? []).filter((s) =>
    parksForActive.some((p) => s.parks.includes(p.id)),
  )
  const selectedCountForActive = safarisForActive.filter((s) => plan.experienceIds.includes(s.id)).length

  return (
    <div>
      <div className="mb-10 max-w-2xl mx-auto text-center">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          What do you want to experience?
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          See the parks and wonders available in each region, and select the safaris that take you where you want
          to go.
        </p>
      </div>

      {loading && <p className="text-center text-on-surface-variant py-16">Loading experiences…</p>}
      {error && <p className="text-center text-error py-16">{error}</p>}

      {!loading && !error && selectedDestinations.length > 0 && (
        <>
          <div className="flex items-center justify-center gap-2 mb-8 border-b border-sand-stone overflow-x-auto">
            {selectedDestinations.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => setActiveTab(dest.id)}
                className={`shrink-0 px-4 py-3 font-label-md text-label-sm border-b-2 transition-colors ${
                  activeTab === dest.id
                    ? 'text-savanna-green border-savanna-green font-bold'
                    : 'text-on-surface-variant border-transparent hover:text-savanna-green'
                }`}
              >
                {dest.name}
              </button>
            ))}
          </div>

          {activeDestination && (
            <div className="flex flex-col gap-12 mb-10">
              {parksForActive.map((park) => {
                const parkSafaris = (safaris ?? []).filter((s) => s.parks.includes(park.id))
                return (
                  <div key={park.id}>
                    <div className="flex items-center gap-3 mb-4">
                      {park.images[0] && (
                        <img src={park.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <h3 className="font-headline-md text-[20px] text-on-surface">{park.name}</h3>
                        {park.highlight && <p className="text-on-surface-variant text-sm">{park.highlight}</p>}
                      </div>
                    </div>
                    {parkSafaris.length === 0 ? (
                      <p className="text-on-surface-variant text-sm">No safari packages visit this park yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parkSafaris.map((safari) => {
                          const selected = plan.experienceIds.includes(safari.id)
                          return (
                            <div
                              key={safari.id}
                              className={`relative rounded-xl overflow-hidden bg-surface-container-lowest transition-all duration-300 ${
                                selected ? 'ring-2 ring-savanna-green shadow-lg' : 'ring-1 ring-sand-stone hover:shadow-lg'
                              }`}
                            >
                              <div
                                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                                  selected ? 'bg-savanna-green' : 'bg-surface/90 border border-outline-variant'
                                }`}
                              >
                                {selected && <Check size={16} weight="bold" className="text-on-primary" />}
                              </div>
                              <div className="h-40 relative">
                                <img
                                  src={safari.image}
                                  alt={safari.imageAlt}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/50 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-label-sm font-label-sm text-on-surface">
                                    <Clock size={13} />
                                    {safari.days} Day{safari.days !== 1 ? 's' : ''}
                                  </span>
                                  <span className="bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-label-sm font-label-sm text-on-surface">
                                    ${safari.price.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h4 className="font-headline-md text-[20px] text-on-surface mb-2">{safari.title}</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-2">
                                  {safari.overview}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleExperience(safari.id)}
                                  className={`w-full text-center py-3 rounded-lg font-label-md text-label-md transition-colors ${
                                    selected
                                      ? 'bg-surface-container text-on-surface-variant'
                                      : 'border border-outline-variant text-on-surface hover:border-savanna-green hover:text-savanna-green'
                                  }`}
                                >
                                  {selected ? 'Selected' : 'Select Experience'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {parksForActive.length === 0 && (
                <p className="text-on-surface-variant text-center py-8">
                  No parks are set up for {activeDestination.name} yet.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex justify-between items-center pt-8 border-t border-sand-stone">
        <button
          type="button"
          onClick={() => navigate('/plan')}
          className="min-h-[44px] inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {activeDestination && (
          <span className="text-on-surface-variant text-sm hidden sm:block">
            {selectedCountForActive} experience{selectedCountForActive !== 1 ? 's' : ''} selected for{' '}
            {activeDestination.name}
          </span>
        )}
        <button
          type="button"
          disabled={plan.experienceIds.length === 0}
          onClick={() => navigate('/plan/details')}
          className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(30,142,62,0.2)]"
        >
          Next: Add Trip Details
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}
