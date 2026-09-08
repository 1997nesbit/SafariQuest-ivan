import { Link } from 'react-router-dom'
import type { ComponentType } from 'react'
import { CalendarBlank, CheckCircle, Clock, ImagesSquare, ClockCounterClockwise } from '@phosphor-icons/react'
import { myTrips, type MyTrip } from '../../data/myTrips'

type Status = MyTrip['status']

const BADGE: Record<Status, { className: string; icon: ComponentType<{ size?: number; weight?: 'fill' }>; label: string }> = {
  'in-progress': { className: 'bg-golden-sun text-on-surface', icon: Clock, label: 'In Progress' },
  upcoming: { className: 'bg-surface-tint text-on-primary', icon: CheckCircle, label: 'Confirmed' },
  completed: { className: 'bg-outline text-on-tertiary', icon: ClockCounterClockwise, label: 'Completed' },
}

export function MyTrips() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">My Trips</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Manage your upcoming adventures, review pending quotes, and revisit past journeys across the vast plains of
          Africa.
        </p>
      </div>

      {myTrips.length === 0 ? (
        <p className="text-on-surface-variant">No trips yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {myTrips.map((trip) => {
            const badge = BADGE[trip.status]
            const BadgeIcon = badge.icon
            const isCompleted = trip.status === 'completed'
            return (
              <div
                key={trip.id}
                className={`group relative rounded-xl overflow-hidden ambient-shadow shadow-[0_4px_20px_rgba(45,45,45,0.06)] transition-transform hover:-translate-y-1 duration-300 flex flex-col h-[480px] ${
                  isCompleted ? 'bg-surface-container-low' : 'bg-ivory-base'
                }`}
              >
                <div className={`h-56 relative w-full overflow-hidden ${isCompleted ? 'opacity-90' : ''}`}>
                  <img
                    src={trip.image}
                    alt={trip.imageAlt}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                      isCompleted ? 'grayscale-[30%]' : ''
                    }`}
                  />
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm ${badge.className}`}
                  >
                    <BadgeIcon size={14} weight="fill" />
                    {badge.label}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-headline-md text-[24px] leading-tight text-on-surface mb-2">{trip.packageTitle}</h3>
                  <div className="flex items-center gap-2 text-on-surface-variant font-body-md mb-4">
                    <CalendarBlank size={18} weight="fill" className="text-savanna-green shrink-0" />
                    <span>{trip.dateRange}</span>
                  </div>
                  <p className="font-body-md text-on-surface-variant/80 text-sm mb-6 flex-1 line-clamp-2">
                    {trip.milestones[0]?.description}
                  </p>
                  {isCompleted ? (
                    <Link
                      to={`/account/trips/${trip.id}`}
                      className="w-full mt-auto flex items-center justify-center gap-2 text-savanna-green font-label-md hover:text-primary-container transition-colors py-3"
                    >
                      <ImagesSquare size={20} />
                      View Gallery &amp; Itinerary
                    </Link>
                  ) : (
                    <Link
                      to={`/account/trips/${trip.id}`}
                      className="w-full mt-auto bg-savanna-green text-on-primary py-3 rounded-lg font-label-md hover:bg-primary-container transition-colors text-center"
                    >
                      View Trip Details
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
