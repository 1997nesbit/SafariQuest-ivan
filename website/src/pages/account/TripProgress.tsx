import { Link, useParams } from 'react-router-dom'
import { Check, WhatsappLogo, Star, Warning, SealCheck, MapPin } from '@phosphor-icons/react'
import { myTrips } from '../../data/myTrips'

export function TripProgress() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = tripId
    ? myTrips.find((t) => t.id === tripId)
    : myTrips.find((t) => t.status === 'in-progress') ?? myTrips.find((t) => t.status === 'upcoming')

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">No Active Trip</h1>
        <p className="text-on-surface-variant mb-8">You don&apos;t have a trip in progress right now.</p>
        <Link
          to="/account"
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          Back to My Trips
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
          Your Safari Journey
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{trip.packageTitle}</p>
      </div>

      {/* Assigned Guide Card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant">
        <img
          src={trip.guide.avatar}
          alt={`${trip.guide.name} portrait`}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-surface shadow-sm shrink-0"
        />
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant mb-2">
            <SealCheck size={16} weight="fill" className="text-savanna-green" />
            <span className="font-label-sm text-label-sm">Certified Guide</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface">{trip.guide.name}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{trip.guide.role}</p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href={`https://wa.me/${trip.guide.whatsapp}`}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-lg font-label-md text-label-md transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <WhatsappLogo size={20} weight="fill" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Itinerary Progress</h3>
        <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:inset-y-0 before:left-[15px] md:before:left-[19px] before:w-0.5 before:bg-outline-variant">
          {trip.milestones.map((m) => (
            <div key={m.id} className="relative z-10 flex gap-6 md:gap-8 items-start">
              <div
                className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative z-10 -ml-6 md:-ml-10 ${
                  m.status === 'completed'
                    ? 'bg-savanna-green shadow-sm'
                    : m.status === 'current'
                      ? 'bg-golden-sun shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-surface-container-highest border-2 border-outline-variant'
                }`}
              >
                {m.status === 'completed' && <Check size={18} weight="bold" className="text-on-primary" />}
                {m.status === 'current' && <MapPin size={18} weight="fill" className="text-on-secondary-fixed-variant" />}
              </div>
              <div className={`flex-1 pb-2 ${m.status === 'upcoming' ? 'opacity-70' : ''}`}>
                {m.status === 'current' && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary mb-2 border border-secondary-container/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
                    <span className="font-label-sm text-label-sm">You are here</span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
                  <h4
                    className={`font-headline-md text-[20px] md:text-[24px] ${
                      m.status === 'upcoming' ? 'text-on-surface-variant' : 'text-on-surface'
                    }`}
                  >
                    {m.title}
                  </h4>
                  <span
                    className={`font-label-sm text-label-sm ${
                      m.status === 'current' ? 'font-bold text-golden-sun' : 'text-on-surface-variant'
                    }`}
                  >
                    {m.day}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">{m.description}</p>
                {m.status !== 'upcoming' && (
                  <Link
                    to={`/account/trips/${trip.id}/report-issue`}
                    className="inline-flex items-center gap-1 mt-3 font-label-sm text-label-sm text-terracotta hover:text-secondary transition-colors"
                  >
                    <Warning size={16} />
                    Something wrong? Tell us.
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {trip.status === 'completed' && (
        <Link
          to={`/account/trips/${trip.id}/rate`}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-4 rounded-full font-label-md hover:opacity-90 transition-opacity"
        >
          <Star size={20} weight="fill" />
          Rate Your Experience
        </Link>
      )}
    </div>
  )
}
