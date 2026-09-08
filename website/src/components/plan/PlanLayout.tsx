import { Outlet, useLocation } from 'react-router-dom'
import { Check } from '@phosphor-icons/react'
import { TripPlanProvider } from './TripPlanContext'

const STEPS = [
  { path: '/plan', label: 'Regions' },
  { path: '/plan/experiences', label: 'Experiences' },
  { path: '/plan/details', label: 'Details' },
  { path: '/plan/review', label: 'Review' },
]

function PlanSteps() {
  const location = useLocation()
  const activeIndex = STEPS.findIndex((s) => s.path === location.pathname)

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-12 max-w-2xl mx-auto">
      {STEPS.map((step, i) => {
        const isDone = i < activeIndex
        const isActive = i === activeIndex
        return (
          <div key={step.path} className="flex items-center gap-2 md:gap-4 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0 ${
                  isDone ? 'bg-savanna-green text-on-primary' : isActive ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {isDone ? <Check size={16} weight="bold" /> : i + 1}
              </div>
              <span className={`hidden md:block text-xs text-center ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-savanna-green' : 'bg-sand-stone'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function PlanLayout() {
  return (
    <TripPlanProvider>
      <section className="min-h-screen bg-surface-container-low py-16 md:py-20 px-5 md:px-margin-desktop">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface text-center mb-2">
            Plan Your Journey
          </h1>
          <p className="text-on-surface-variant text-center mb-10">
            Build a custom Tanzania itinerary in four simple steps.
          </p>
          <PlanSteps />
          <Outlet />
        </div>
      </section>
    </TripPlanProvider>
  )
}
