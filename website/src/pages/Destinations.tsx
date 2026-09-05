import { Link } from 'react-router-dom'
import { CalendarBlank, MapPinLine, ArrowRight, Compass, ShieldCheck } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { DestinationSlideshow } from '../components/DestinationSlideshow'
import { getDestinations } from '../api/destinations'
import { useFetch } from '../lib/useFetch'

export function Destinations() {
  const { data: destinations, loading, error } = useFetch(getDestinations, [])

  return (
    <>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[560px] flex items-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQqojm4Y8oHuuWlmS1JBTqk5H4NE9-dIINTumee6Qtu8GLuT2UgA7RWoohhbGcmIq99JOXXtA5krQehWMby0EkikuEO6RDBpaoyBulgIDFKOCQBQ4Dodhu32UeqAwqs36LWbIjWDhjXe7SJdBc9rnlufJwk1zRckbUlTTSgpYmPzLjl3xA0lf2ecky9m_W0xxENmIhjNgdZNOrCkJsjit9AIKfKNRgceZonvr-ZCE5aNI-hvnih3-d"
          alt="Mount Kilimanjaro rising above the golden Tanzanian plains at sunrise."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-ivory-base" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto text-center">
          <h1 className="font-display-lg text-[32px] md:text-display-lg text-on-surface mb-4">
            Discover the Wonders of <span className="text-savanna-green">Tanzania</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
            From the endless plains of the Serengeti to the exquisite waters of Zanzibar, explore all of East
            Africa's premier wildlife destinations.
          </p>
          <a
            href="#regions"
            className="inline-flex min-h-[44px] items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            View Destinations
          </a>
        </div>
      </section>

      {/* Explore by Regions */}
      <section id="regions" className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="mb-16">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface relative inline-block pb-4">
            Explore by Regions
            <span className="absolute left-0 bottom-0 w-16 h-1 bg-terracotta" />
          </h2>
        </Reveal>
        {loading && <p className="text-center text-on-surface-variant py-20">Loading destinations…</p>}
        {error && <p className="text-center text-error py-20">{error}</p>}
        {!loading && !error && destinations && destinations.length === 0 && (
          <p className="text-center text-on-surface-variant py-20">No destinations are available yet.</p>
        )}
        {!loading && !error && destinations && destinations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {destinations.map((destination, i) => (
            <Reveal
              key={destination.id}
              delay={(i % 3) * 80}
              className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <DestinationSlideshow images={destination.images} alt={destination.imageAlt} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-label-sm font-semibold text-savanna-green">
                  {destination.badge}
                </div>
              </div>
              <div className="p-8 grow flex flex-col">
                <h3 className="font-headline-md text-headline-md mb-3">{destination.name}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {destination.tags.map((tag) => (
                    <span key={tag} className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-md text-label-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CalendarBlank size={22} className="text-savanna-green shrink-0" />
                    <div>
                      <p className="font-label-md text-label-md">Best Time to Visit</p>
                      <p className="text-on-surface-variant">{destination.bestTimeToVisit}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPinLine size={22} className="text-savanna-green shrink-0" />
                    <div>
                      <p className="font-label-md text-label-md">Highlights</p>
                      <p className="text-on-surface-variant text-sm">{destination.highlight}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-6 border-t border-sand-stone">
                  <Link
                    to={`/destinations/${destination.id}`}
                    className="text-savanna-green font-label-md flex items-center gap-1 group/link hover:underline transition-all min-h-[44px]"
                  >
                    {destination.linkLabel}
                    <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        )}
      </section>

      {/* Map Your Journey */}
      <section className="py-20 md:py-section-gap bg-surface-container-low px-5 md:px-margin-desktop">
        <Reveal className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              Map Your Journey
            </h2>
            <p className="text-on-surface-variant font-body-lg leading-relaxed mb-8">
              Our expert guides help you craft the perfect itinerary through Tanzania's northern circuit or the
              remote southern parks. Use our interactive planning tool to see how these legendary destinations
              connect.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-surface-container-lowest rounded-lg p-4">
                <Compass size={24} className="text-savanna-green shrink-0" />
                <div>
                  <p className="font-label-md">Tailored Routes</p>
                  <p className="text-on-surface-variant text-sm">Customized to your pace and interests</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-lowest rounded-lg p-4">
                <ShieldCheck size={24} className="text-savanna-green shrink-0" />
                <div>
                  <p className="font-label-md">Certified Guides</p>
                  <p className="text-on-surface-variant text-sm">Top-tier experts with deep local knowledge</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg aspect-4/3">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5-UljvqKa-1wcszt3SM23Uyr_gURor3Z95Cy9Yo_G4o3-d6CJhqj4WAQYLNHgR6eH-HUN2hrGvLoLzCT9VD06l5DSZtAhNfvsIaFF2FenW08HkCSpv6J15_q9hfim1cMLCU6F3--FwNM7kX6X-lTBnSHNwaXu4diE4WBSrWgQndT0sVvcmNNmksmf0EQ3KhXxMpRijU6cIjbAkhZF488ejBYsgT7ftCf7_DByFgHGMGPcRjH49Krv"
              alt="A stylized map of Tanzania showing national parks and key destinations."
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop text-center max-w-3xl mx-auto">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
          Ready to Start Your Quest?
        </h2>
        <p className="text-on-surface-variant font-body-lg mb-8">
          Contact our safari specialists today to begin planning your bespoke Tanzanian adventure. We handle
          everything from park permits to luxury lodge bookings.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/about#contact"
            className="min-h-[44px] flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Enquire Today
          </Link>
          <Link
            to="/safaris"
            className="min-h-[44px] flex items-center justify-center border border-terracotta text-terracotta px-8 py-3.5 rounded-full font-label-md hover:bg-terracotta hover:text-white transition-colors"
          >
            Browse Safari Packages
          </Link>
        </div>
      </section>
    </>
  )
}
