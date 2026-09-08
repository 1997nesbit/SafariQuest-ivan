import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarBlank, CalendarCheck, CaretRight, CheckCircle } from '@phosphor-icons/react'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { guideTrips } from '../../data/guideTrips'
import { useAuth } from '../../auth/AuthContext'

const FILTERS = ['Today', 'Upcoming', 'Past'] as const
type Filter = (typeof FILTERS)[number]

const STATUS_TO_FILTER: Record<string, Filter> = {
  'in-progress': 'Today',
  confirmed: 'Upcoming',
  completed: 'Past',
}

export function GuideSchedule() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || user?.email || 'there'
  const [filter, setFilter] = useState<Filter>('Today')
  const visibleTrips = guideTrips.filter((trip) => STATUS_TO_FILTER[trip.status] === filter)

  return (
    <div className="min-h-screen bg-surface-bright">
      <header className="fixed top-0 inset-x-0 h-16 z-40 flex items-center justify-between px-5 bg-surface/80 backdrop-blur-md border-b border-surface-variant/60">
        <div>
          <span className="font-headline-md text-[20px] font-bold text-savanna-green">Pande Wilderness Safari</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant -mt-0.5">Guide Portal</p>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors"
        >
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary" />
        </button>
      </header>

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="mb-6">
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">Karibu, {firstName}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant/50">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CalendarCheck size={20} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Today</span>
            </div>
            <p className="font-display-lg text-2xl text-on-surface font-bold">
              1 <span className="font-body-md text-body-md text-on-surface-variant font-normal">trip</span>
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-variant/50">
            <div className="flex items-center gap-2 text-primary mb-1">
              <CalendarBlank size={20} />
              <span className="font-label-sm text-label-sm text-on-surface-variant">This Week</span>
            </div>
            <p className="font-display-lg text-2xl text-on-surface font-bold">
              3 <span className="font-body-md text-body-md text-on-surface-variant font-normal">trips</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-full font-label-md text-label-md transition-colors ${
                filter === f ? 'bg-savanna-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {visibleTrips.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
              No {filter.toLowerCase()} trips.
            </p>
          )}
          {visibleTrips.map((trip) => {
            const isInProgress = trip.status === 'in-progress'
            const isCompleted = trip.status === 'completed'
            return (
              <Link
                key={trip.id}
                to={`/guide/trips/${trip.id}`}
                className={`block bg-surface-container-lowest rounded-xl p-4 border relative overflow-hidden ${
                  isInProgress ? 'border-golden-sun/40 shadow-sm' : 'border-surface-variant/50'
                } ${isCompleted ? 'opacity-70' : ''}`}
              >
                {isInProgress && <div className="absolute top-0 left-0 w-1.5 h-full bg-golden-sun" />}
                <div className={`flex items-start justify-between gap-3 ${isInProgress ? 'pl-2' : ''}`}>
                  <div>
                    {isInProgress && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary border border-secondary-container/30 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
                        <span className="font-label-sm text-label-sm">{trip.statusLabel}</span>
                      </div>
                    )}
                    {!isInProgress && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm mb-2 ${
                          isCompleted ? 'bg-surface-container text-on-surface-variant' : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {isCompleted && <CheckCircle size={14} />}
                        {trip.statusLabel}
                      </span>
                    )}
                    <h3 className={`font-headline-md text-[20px] ${isCompleted ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                      {trip.packageTitle}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {isCompleted ? trip.dateRange : `${trip.guest.name} party`}
                    </p>
                    {!isCompleted && (
                      <div className="flex items-center gap-4 mt-3 text-on-surface-variant">
                        <span className="flex items-center gap-1 font-label-sm text-label-sm">
                          <CalendarBlank size={16} />
                          {trip.dateRange}
                        </span>
                      </div>
                    )}
                  </div>
                  <CaretRight size={20} className="text-on-surface-variant mt-1 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
