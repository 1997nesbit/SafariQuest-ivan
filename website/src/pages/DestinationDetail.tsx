import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Link } from '../i18n/routing'
import { Airplane, CalendarBlank, PawPrint, SealCheck } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { getDestination, type Destination } from '../api/destinations'
import { getParks, type Park } from '../api/parks'
import { getSafaris, type SafariPackage } from '../api/safaris'
import { getRegionSafaris, type RegionSafari } from '../api/regionSafaris'
import { useFetch } from '../lib/useFetch'

export function DestinationDetail() {
  const { t, i18n } = useTranslation('destinations')
  const { id } = useParams<{ id: string }>()
  const { data: destination, loading, error } = useFetch<Destination>(() => getDestination(id!), [id])
  const { data: safariPackages } = useFetch<SafariPackage[]>(getSafaris, [])
  const { data: parks } = useFetch<Park[]>(getParks, [])
  const { data: regionSafaris } = useFetch<RegionSafari[]>(getRegionSafaris, [])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">{t('detail.loading')}</div>
  }

  if (error || !destination) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('detail.notFound')}</h1>
          <Link
            to="/destinations"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            {t('detail.backToDestinations')}
          </Link>
        </div>
      </section>
    )
  }

  const regionParks = (parks ?? []).filter((p) => p.region === destination.id)
  const safarisByPark = new Map<string, SafariPackage[]>(
    regionParks.map((park) => [park.id, (safariPackages ?? []).filter((s) => s.parks.includes(park.id))]),
  )
  const regionOnlySafaris = (regionSafaris ?? []).filter((s) => s.region === destination.id)

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen max-h-[820px] min-h-[560px] w-full flex items-center justify-center overflow-hidden">
        <img
          src={destination.images[0]}
          alt={destination.imageAlt}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-ivory-base/95" />
        <div className="relative z-10 text-center max-w-3xl px-5 md:px-margin-desktop">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-6 drop-shadow-md">
            {destination.name}
          </h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl mx-auto drop-shadow">
            {destination.about}
          </p>
        </div>
      </section>

      {/* Highlights strip — overlaps the hero */}
      <Reveal>
        <section className="relative z-20 -mt-16 md:-mt-20 mx-5 md:mx-margin-desktop bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_-2px_rgba(45,45,45,0.12)]">
          <div className="max-w-container-max mx-auto px-6 md:px-12 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-sand-stone">
            <div className="flex flex-col items-center pt-6 md:pt-0">
              <PawPrint size={36} weight="fill" className="text-savanna-green mb-4" />
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-2xl">{t('detail.wildlife')}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{destination.wildlife}</p>
            </div>
            <div className="flex flex-col items-center pt-6 md:pt-0">
              <CalendarBlank size={36} weight="fill" className="text-golden-sun mb-4" />
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-2xl">{t('detail.bestSeason')}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{destination.bestTimeToVisit}</p>
            </div>
            <div className="flex flex-col items-center pt-6 md:pt-0">
              <Airplane size={36} weight="fill" className="text-terracotta mb-4" />
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 text-2xl">{t('detail.gettingThere')}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{destination.gettingThere}</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Experiences — shown for every region regardless of packages. Previously these only
          appeared when a region had no parks, so package-heavy regions (e.g. Arusha) hid them. */}
      {destination.experiences.length > 0 && (
        <section className="pt-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
          <Reveal className="mb-16 text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {t('detail.experiencesIn', { name: destination.name })}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {t('detail.experiencesSubtitle')}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {destination.experiences.map((exp, i) => (
              <Reveal
                key={exp.name}
                delay={i * 100}
                className="bg-ivory-base rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(45,45,45,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={destination.images[i % destination.images.length]}
                    alt={exp.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-headline-md text-xl mb-3">{exp.name}</h3>
                  <p className="font-body-md text-on-surface-variant">{exp.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Parks & Wonders — the packages that visit each park in this region */}
      {regionParks.length > 0 && (
        <section className="pt-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
          <Reveal className="mb-16 text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {t('detail.parksAndWondersIn', { name: destination.name })}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {t('detail.parksSubtitle')}
            </p>
          </Reveal>
          <div className="flex flex-col gap-16">
            {regionParks.map((park, i) => {
              const safaris = safarisByPark.get(park.id) ?? []
              return (
                <Reveal key={park.id} delay={i * 100}>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-2 rounded-xl overflow-hidden h-64 lg:h-full lg:sticky lg:top-24">
                      <img
                        src={park.images[0]}
                        alt={park.imageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="lg:col-span-3">
                      {park.badge && (
                        <span className="inline-block bg-savanna-green/10 text-savanna-green px-3 py-1 rounded-full font-label-sm text-label-sm mb-3">
                          {park.badge}
                        </span>
                      )}
                      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{park.name}</h3>
                      <p className="font-body-md text-on-surface-variant mb-6">{park.highlight}</p>

                      {safaris.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {safaris.map((safari) => (
                            <Link
                              key={safari.id}
                              to={`/safaris/${safari.id}`}
                              className="group bg-ivory-base rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(45,45,45,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col border border-sand-stone/50"
                            >
                              <div className="h-32 overflow-hidden">
                                <img src={safari.image} alt={safari.imageAlt} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-headline-md text-base text-on-surface mb-2">{safari.title}</h4>
                                <div className="mt-auto flex items-center justify-between pt-2">
                                  <span className="flex items-center gap-1.5 text-savanna-green">
                                    <SealCheck size={14} weight="fill" />
                                    <span className="font-label-sm text-[11px]">{t('detail.certified')}</span>
                                  </span>
                                  <span className="font-label-md text-label-sm text-terracotta group-hover:text-secondary transition-colors font-bold uppercase tracking-wider text-xs">
                                    {t('detail.viewDetails')}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-on-surface-variant text-sm">{t('detail.noSafarisYet')}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {/* Mini Safaris — shorter, region-scoped trips (no cross-region itinerary) */}
      {regionOnlySafaris.length > 0 && (
        <section className="pt-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
          <Reveal className="mb-10 text-center">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
              {t('detail.miniSafarisIn', { name: destination.name })}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {t('detail.miniSafarisSubtitle', { name: destination.name })}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionOnlySafaris.map((rs, i) => (
              <Reveal key={rs.id} delay={i * 100}>
                <Link
                  to={`/region-safaris/${rs.id}`}
                  className="group bg-ivory-base rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(45,45,45,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col border border-sand-stone/50 h-full"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img src={rs.image} alt={rs.imageAlt} className="w-full h-full object-cover" />
                    {rs.badge && (
                      <span className="absolute top-3 left-3 bg-golden-sun text-deep-earth text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {rs.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-headline-md text-base text-on-surface mb-2">{rs.title}</h4>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-on-surface-variant text-sm">{t('detail.days', { count: rs.days })}</span>
                      <span className="font-headline-md text-savanna-green font-bold">
                        ${rs.price.toLocaleString(i18n.language)}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <div className="pb-section-gap" />

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-surface-container py-24">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#8A7259 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <Reveal className="max-w-4xl mx-auto text-center px-5 relative z-10">
          <h2 className="font-display-lg text-headline-lg md:text-display-lg text-on-surface mb-6">
            {t('detail.buildYourOwnTrip', { name: destination.name })}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl mx-auto">
            {t('detail.ctaSubtitle')}
          </p>
          <Link
            to={`/plan/experiences?region=${destination.id}`}
            className="inline-flex min-h-[44px] items-center justify-center bg-golden-sun text-ivory-base font-label-md text-lg px-10 py-4 rounded-full hover:opacity-90 transition-opacity"
          >
            {t('detail.startPlanning')}
          </Link>
        </Reveal>
      </section>
    </>
  )
}
