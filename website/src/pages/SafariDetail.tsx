import { Link, useParams } from 'react-router-dom'
import {
  Bed,
  CalendarBlank,
  CheckCircle,
  Clock,
  MapPin,
  SealCheck,
  Star,
  XCircle,
  ArrowRight,
  ChatCircleText,
} from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { getSafari, type SafariPackage } from '../api/safaris'
import { useFetch } from '../lib/useFetch'

export function SafariDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: safari, loading, error } = useFetch<SafariPackage>(() => getSafari(id!), [id])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !safari) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Safari Not Found</h1>
          <Link
            to="/safaris"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Back to Safaris
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-28 md:pt-32 pb-16 md:pb-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
      {/* Hero */}
      <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden mb-4">
        <img src={safari.image} alt={safari.imageAlt} fetchPriority="high" className="w-full h-full object-cover" />
      </div>
      {safari.galleryImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-24 md:h-32 mb-12">
          {safari.galleryImages.map((src, i) => (
            <img key={src + i} src={src} alt="" loading="lazy" className="w-full h-full object-cover rounded-lg" />
          ))}
        </div>
      )}

      {/* Title & Badges */}
      <div className="mb-12">
        <h1 className="font-display-lg text-[32px] md:text-display-lg text-on-surface mb-6">{safari.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 bg-ivory-base border border-outline-variant text-on-surface px-4 py-2 rounded-full font-label-md text-label-md">
            <CalendarBlank size={16} weight="fill" className="text-savanna-green" />
            {safari.days} Days / {safari.days - 1} Nights
          </span>
          {safari.badge && (
            <span className="inline-flex items-center gap-2 bg-savanna-green/10 text-savanna-green px-4 py-2 rounded-full font-label-md text-label-md font-bold">
              <Star size={16} weight="fill" />
              {safari.badge}
            </span>
          )}
          <span className="inline-flex items-center gap-2 bg-ivory-base border border-outline-variant text-on-surface px-4 py-2 rounded-full font-label-md text-label-md">
            <Bed size={16} weight="fill" className="text-savanna-green" />
            {safari.accommodation}
          </span>
          <span className="inline-flex items-center gap-2 bg-ivory-base border border-outline-variant text-on-surface px-4 py-2 rounded-full font-label-md text-label-md">
            <MapPin size={16} weight="fill" className="text-terracotta" />
            {safari.destination}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-gutter">
        <div className="w-full lg:w-2/3 flex flex-col gap-12">
          <Reveal className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] border border-sand-stone/60">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Overview</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">{safari.overview}</p>
          </Reveal>

          <Reveal delay={60}>
            <h3 className="font-label-md text-label-sm text-savanna-green uppercase tracking-widest mb-4">Highlights</h3>
            <ul className="space-y-3">
              {safari.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-on-surface-variant">
                  <CheckCircle size={20} className="text-savanna-green shrink-0 mt-0.5" />
                  <span className="font-body-md text-body-md">{h}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Day-by-Day Itinerary</h3>
            <div className="relative border-l-2 border-sand-stone ml-2 md:ml-3 pl-8 flex flex-col gap-8">
              {safari.itinerary.map((day, i) => (
                <div key={day.day} className="relative">
                  <span
                    className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-ivory-base ${
                      i === 0 ? 'bg-savanna-green' : 'bg-surface-dim'
                    }`}
                  />
                  <h4 className="font-headline-md text-[20px] md:text-[22px] text-on-surface mb-2">
                    Day {day.day}: {day.title}
                  </h4>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{day.description}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-surface-container-low rounded-xl p-6 border border-sand-stone">
              <h3 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-2">
                <CheckCircle size={22} className="text-savanna-green" /> Included
              </h3>
              <ul className="space-y-3">
                {safari.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-on-surface-variant">
                    <CheckCircle size={18} className="text-savanna-green shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-ivory-base rounded-xl p-6 border border-sand-stone">
              <h3 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-2">
                <XCircle size={22} className="text-terracotta" /> Not Included
              </h3>
              <ul className="space-y-3">
                {safari.excluded.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-on-surface-variant">
                    <XCircle size={18} className="text-terracotta shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Sticky sidebar */}
        <div className="w-full lg:w-1/3">
          <Reveal delay={60} className="sticky top-24 bg-ivory-base border border-sand-stone rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] flex flex-col gap-6">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Inquire About This Safari</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Start planning your dream adventure today.
              </p>
              <div className="font-display-lg text-[32px] text-savanna-green font-bold">
                From ${safari.price.toLocaleString()}{' '}
                <span className="font-body-md text-body-md font-normal text-on-surface-variant">pp</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/safaris/${safari.id}/book`}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-golden-sun text-on-surface font-label-md text-label-md py-4 rounded-lg hover:opacity-90 transition-opacity font-bold"
              >
                Enquire Now
                <ArrowRight size={20} weight="bold" />
              </Link>
              <Link
                to="/about#contact"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-transparent border-2 border-savanna-green text-savanna-green font-label-md text-label-md py-4 rounded-lg hover:bg-savanna-green/5 transition-colors font-bold"
              >
                <ChatCircleText size={20} weight="fill" />
                Talk to a Tour Helper
              </Link>
            </div>

            <div className="pt-4 border-t border-sand-stone space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-sm text-on-surface-variant flex items-center gap-2">
                  <Clock size={18} /> Duration
                </span>
                <span className="font-label-md text-label-sm text-on-surface">{safari.days} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-sm text-on-surface-variant flex items-center gap-2">
                  <MapPin size={18} /> Destination
                </span>
                <span className="font-label-md text-label-sm text-on-surface text-right">{safari.destination}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-sand-stone flex items-center gap-4">
              <SealCheck size={32} weight="fill" className="text-golden-sun shrink-0" />
              <div>
                <p className="font-label-md text-label-sm text-on-surface">Certified Operator</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">100% Secure Booking</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
