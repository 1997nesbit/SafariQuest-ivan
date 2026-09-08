import { Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'
import { DestinationSlideshow } from '../components/DestinationSlideshow'
import { getDestinations } from '../api/destinations'
import { useFetch } from '../lib/useFetch'

const BENTO_PATTERN = [
  { colSpan: 'md:col-span-8', height: 'h-[400px] md:h-[500px]', headline: 'lg' as const },
  { colSpan: 'md:col-span-4', height: 'h-[400px] md:h-[500px]', headline: 'md' as const },
  { colSpan: 'md:col-span-6', height: 'h-[350px] md:h-[400px]', headline: 'md' as const },
  { colSpan: 'md:col-span-6', height: 'h-[350px] md:h-[400px]', headline: 'md' as const },
  { colSpan: 'md:col-span-5', height: 'h-[380px] md:h-[450px]', headline: 'md' as const },
  { colSpan: 'md:col-span-7', height: 'h-[380px] md:h-[450px]', headline: 'md' as const },
]

export function Destinations() {
  const { data: destinations, loading, error } = useFetch(getDestinations, [])

  return (
    <main className="pt-32 md:pt-40 pb-20 md:pb-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
      {/* Page Header */}
      <Reveal className="mb-16 md:mb-24 text-center md:text-left max-w-3xl">
        <h1 className="font-display-lg text-[40px] md:text-display-lg text-savanna-green mb-6 leading-tight">
          Explore by Region
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Discover the diverse landscapes and unique wildlife of Tanzania's most iconic safari destinations, from
          the endless plains of the Serengeti to the turquoise waters of Zanzibar.
        </p>
        <div className="mt-8">
          <Link
            to="/plan"
            className="inline-flex min-h-[44px] items-center bg-golden-sun hover:bg-secondary-container text-on-secondary px-8 py-4 rounded-full font-label-md text-label-md transition-all shadow-sm hover:scale-105"
          >
            Start Your Journey
          </Link>
        </div>
      </Reveal>

      {loading && <p className="text-center text-on-surface-variant py-20">Loading destinations…</p>}
      {error && <p className="text-center text-error py-20">{error}</p>}
      {!loading && !error && destinations && destinations.length === 0 && (
        <p className="text-center text-on-surface-variant py-20">No destinations are available yet.</p>
      )}

      {/* Bento Grid Layout for Regions */}
      {!loading && !error && destinations && destinations.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {destinations.map((destination, i) => {
            const tile = BENTO_PATTERN[i % BENTO_PATTERN.length]
            return (
              <Reveal key={destination.id} delay={(i % BENTO_PATTERN.length) * 100} className={tile.colSpan}>
                <Link
                  to={`/destinations/${destination.id}`}
                  className={`group relative flex flex-col justify-end ${tile.height} rounded-xl overflow-hidden bg-ivory-base shadow-[0_4px_20px_rgba(45,45,45,0.05)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(45,45,45,0.1)]`}
                >
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <div className="w-full h-full transition-transform duration-700 group-hover:scale-105">
                      <DestinationSlideshow images={destination.images} alt={destination.imageAlt} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/90 via-deep-earth/30 to-transparent" />
                  </div>
                  <div className="relative z-10 p-6 md:p-8">
                    <span className="inline-block bg-savanna-green/20 text-primary-fixed px-3 py-1 rounded-full font-label-sm text-label-sm backdrop-blur-md border border-savanna-green/30 mb-3">
                      {destination.experiences.length} Experience{destination.experiences.length !== 1 ? 's' : ''}
                    </span>
                    <h2
                      className={`${tile.headline === 'lg' ? 'font-headline-lg text-headline-lg-mobile md:text-headline-lg' : 'font-headline-md text-headline-md'} text-surface-container-lowest mb-2`}
                    >
                      {destination.name}
                    </h2>
                    <p className="font-body-md text-body-md text-surface-container-low max-w-xl">
                      {destination.highlight}
                    </p>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </section>
      )}
    </main>
  )
}
