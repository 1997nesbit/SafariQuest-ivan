import { createContext, useContext } from 'react'

export type AccommodationTier = 'Budget' | 'Mid-range' | 'Luxury'

export interface TripPlanState {
  destinationIds: string[]
  experienceIds: string[]
  days: number
  travelDates: string
  adults: number
  children: number
  accommodationTier: AccommodationTier
  notes: string
}

export interface TripPlanContextValue {
  plan: TripPlanState
  toggleDestination: (id: string) => void
  toggleExperience: (id: string) => void
  setDays: (days: number) => void
  setTravelDates: (travelDates: string) => void
  setAdults: (adults: number) => void
  setChildren: (children: number) => void
  setAccommodationTier: (tier: AccommodationTier) => void
  setNotes: (notes: string) => void
}

export const defaultTripPlan: TripPlanState = {
  destinationIds: [],
  experienceIds: [],
  days: 7,
  travelDates: '',
  adults: 2,
  children: 0,
  accommodationTier: 'Mid-range',
  notes: '',
}

export const TripPlanContext = createContext<TripPlanContextValue | null>(null)

export function useTripPlan() {
  const ctx = useContext(TripPlanContext)
  if (!ctx) throw new Error('useTripPlan must be used within a TripPlanProvider')
  return ctx
}
