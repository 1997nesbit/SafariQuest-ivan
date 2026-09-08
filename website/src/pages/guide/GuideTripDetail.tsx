import { Link, useParams } from 'react-router-dom'
import { Car, CalendarBlank, ChatCircle, MapPin, Phone, Ticket, CaretDown, CheckCircle } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { guideTrips } from '../../data/guideTrips'

export function GuideTripDetail() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = guideTrips.find((t) => t.id === tripId)

  if (!trip) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Trip Detail" showBack />
        <main className="pt-24 pb-28 px-5 max-w-lg mx-auto text-center">
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">Trip not found.</p>
          <Link to="/guide" className="text-savanna-green font-label-md text-label-md">
            Back to Schedule
          </Link>
        </main>
        <GuideBottomNav active="schedule" />
      </div>
    )
  }

  const currentIndex = trip.milestones.findIndex((m) => m.status === 'current')

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="Trip Detail" showBack />

      <main className="pt-20 pb-40 px-5 max-w-lg mx-auto min-h-screen">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary border border-secondary-container/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
            <span className="font-label-sm text-label-sm">{trip.statusLabel}</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">{trip.packageTitle}</h2>
          <div className="flex items-center gap-4 mt-2 text-on-surface-variant">
            <span className="flex items-center gap-1 font-label-sm text-label-sm">
              <CalendarBlank size={16} />
              {trip.dateRange}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Guest Party</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant shrink-0">
              {trip.guest.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-label-md text-on-surface">
                {trip.guest.name} +{trip.guest.partySize - 1} guests
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{trip.guest.partySize} adults</p>
            </div>
            <a
              href={`tel:${trip.guest.phone}`}
              aria-label="Call guest"
              className="p-2.5 rounded-full bg-surface-container text-primary hover:bg-surface-container-high transition-colors"
            >
              <Phone size={20} />
            </a>
            <a
              href={`https://wa.me/${trip.guest.whatsapp}`}
              aria-label="Message guest on WhatsApp"
              className="p-2.5 rounded-full bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-colors"
            >
              <ChatCircle size={20} weight="fill" />
            </a>
          </div>
          {trip.guest.specialRequests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-variant">
              {trip.guest.specialRequests.map((req) => (
                <span key={req} className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-md">
                  {req}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Logistics</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Car size={20} className="text-primary" />
              <span className="font-body-md text-body-md text-on-surface">{trip.vehicle}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-primary" />
              <span className="font-body-md text-body-md text-on-surface">Pickup: {trip.pickup}</span>
            </div>
            <div className="flex items-center gap-3">
              <Ticket size={20} className="text-primary" />
              <span className="font-body-md text-body-md text-on-surface">
                Park permits: <span className="text-savanna-green font-bold">{trip.permitsStatus}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant/50 overflow-hidden">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider p-5 pb-2">Itinerary</h3>
          {trip.milestones.map((milestone, i) => (
            <details key={milestone.id} className="border-t border-surface-variant" open={i === currentIndex}>
              <summary className={`flex items-center justify-between p-5 cursor-pointer list-none marker:content-none ${i === currentIndex ? 'bg-surface-container-low' : ''}`}>
                <div>
                  {milestone.status === 'current' ? (
                    <span className="font-label-sm text-label-sm text-golden-sun font-bold">{milestone.day} · You are here</span>
                  ) : (
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{milestone.day}</span>
                  )}
                  <p className="font-label-md text-on-surface mt-0.5">{milestone.title}</p>
                </div>
                <CaretDown size={20} className="text-on-surface-variant shrink-0" />
              </summary>
              <div className="px-5 pb-5">
                <p className="font-body-md text-body-md text-on-surface-variant">{milestone.description}</p>
              </div>
            </details>
          ))}
        </div>
      </main>

      <div className="fixed bottom-16 inset-x-0 z-30 px-5 py-3 bg-gradient-to-t from-surface-bright via-surface-bright/95 to-transparent">
        <Link
          to={`/guide/trips/${trip.id}/progress`}
          className="max-w-lg mx-auto w-full flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-3.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors"
        >
          <CheckCircle size={20} />
          Update Trip Progress
        </Link>
      </div>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
