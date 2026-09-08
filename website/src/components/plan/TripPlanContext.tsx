import { useState, type ReactNode } from 'react'
import { TripPlanContext, defaultTripPlan, type TripPlanState, type TripPlanContextValue } from './tripPlanStore'

export function TripPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<TripPlanState>(defaultTripPlan)

  function toggleDestination(id: string) {
    setPlan((p) => ({
      ...p,
      destinationIds: p.destinationIds.includes(id)
        ? p.destinationIds.filter((d) => d !== id)
        : [...p.destinationIds, id],
    }))
  }

  function toggleExperience(id: string) {
    setPlan((p) => ({
      ...p,
      experienceIds: p.experienceIds.includes(id)
        ? p.experienceIds.filter((e) => e !== id)
        : [...p.experienceIds, id],
    }))
  }

  const value: TripPlanContextValue = {
    plan,
    toggleDestination,
    toggleExperience,
    setDays: (days) => setPlan((p) => ({ ...p, days })),
    setTravelDates: (travelDates) => setPlan((p) => ({ ...p, travelDates })),
    setAdults: (adults) => setPlan((p) => ({ ...p, adults })),
    setChildren: (children) => setPlan((p) => ({ ...p, children })),
    setAccommodationTier: (accommodationTier) => setPlan((p) => ({ ...p, accommodationTier })),
    setNotes: (notes) => setPlan((p) => ({ ...p, notes })),
  }

  return <TripPlanContext.Provider value={value}>{children}</TripPlanContext.Provider>
}
