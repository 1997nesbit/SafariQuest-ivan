import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../i18n/routing'
import { FunnelSimple, ShieldCheck, Leaf, Medal } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { SafariCard } from '../components/SafariCard'
import { getSafaris } from '../api/safaris'
import { useFetch } from '../lib/useFetch'
import { useSiteImages } from '../lib/useSiteImage'

const DURATION_OPTIONS = [
  { key: 'any', value: '' },
  { key: '3-5', value: '3-5' },
  { key: '6-10', value: '6-10' },
  { key: '11+', value: '11+' },
] as const

const BUDGET_OPTIONS = [
  { key: 'any', value: '' },
  { key: 'under-7500k', value: 'under-7500k' },
  { key: '7500k-15m', value: '7500k-15m' },
  { key: '15m+', value: '15m+' },
] as const

const DESTINATION_OPTIONS = [
  { key: 'all', value: '' },
  { key: 'serengeti', value: 'Serengeti National Park' },
  { key: 'ngorongoro', value: 'Ngorongoro Conservation Area' },
  { key: 'tarangireManyara', value: 'Tarangire & Manyara' },
  { key: 'zanzibar', value: 'Zanzibar Extensions' },
] as const

function matchesDuration(days: number, filter: string) {
  if (!filter) return true
  if (filter === '3-5') return days >= 3 && days <= 5
  if (filter === '6-10') return days >= 6 && days <= 10
  if (filter === '11+') return days >= 11
  return true
}

// Per-person price bands in TZS (prices are stored in shillings).
const BUDGET_LOW = 7_500_000
const BUDGET_HIGH = 15_000_000

function matchesBudget(price: number, filter: string) {
  if (!filter) return true
  if (filter === 'under-7500k') return price < BUDGET_LOW
  if (filter === '7500k-15m') return price >= BUDGET_LOW && price <= BUDGET_HIGH
  if (filter === '15m+') return price > BUDGET_HIGH
  return true
}

export function Safaris() {
  const { t } = useTranslation('safaris')
  const siteImage = useSiteImages()
  const heroPhoto = siteImage('safaris_hero', "A green Land Rover safari vehicle driving through tall golden grass in the Serengeti at hazy sunset.")
  const [duration, setDuration] = useState('')
  const [budget, setBudget] = useState('')
  const [destination, setDestination] = useState('')

  const { data: safariPackages, loading, error } = useFetch(getSafaris, [])

  const filtered = useMemo(
    () =>
      (safariPackages ?? []).filter(
        (safari) =>
          matchesDuration(safari.days, duration) &&
          matchesBudget(safari.price, budget) &&
          (!destination || safari.destination === destination),
      ),
    [safariPackages, duration, budget, destination],
  )

  const selectClass = (active: boolean) =>
    `w-full bg-ivory-base border rounded-lg px-4 py-3 min-h-[44px] font-label-md appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-savanna-green ${
      active ? 'border-savanna-green ring-2 ring-savanna-green' : 'border-sand-stone'
    }`

  return (
    <>
      {/* Hero */}
      <section className="relative h-[500px] md:h-[614px] flex items-center overflow-hidden">
        <img
          src={heroPhoto.image}
          alt={heroPhoto.alt}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-4">{t('hero.heading')}</h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[72px] z-40 bg-surface-container-lowest shadow-sm py-6">
        <div className="px-5 md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col md:flex-row gap-gutter items-center">
          <div className="flex items-center gap-3 text-on-surface-variant font-label-md shrink-0">
            <FunnelSimple size={20} />
            <span>{t('filter.filterBy')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <select
              aria-label={t('filter.filterByDuration')}
              className={selectClass(!!duration)}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>
                  {t(`filter.duration.${opt.key}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t('filter.filterByBudget')}
              className={selectClass(!!budget)}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>
                  {t(`filter.budget.${opt.key}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t('filter.filterByDestination')}
              className={selectClass(!!destination)}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {DESTINATION_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>
                  {t(`filter.destination.${opt.key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Safari Grid */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        {loading && <p className="text-center text-on-surface-variant py-20">{t('loading')}</p>}
        {!loading && error && <p className="text-center text-error py-20">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-on-surface-variant py-20">
            {t('noResults')}{' '}
            <Link to="/about#contact" className="text-savanna-green underline">
              {t('talkToSpecialists')}
            </Link>
            .
          </p>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-16">
            {filtered.map((safari, i) => (
              <Reveal key={safari.id} delay={(i % 3) * 80}>
                <SafariCard safari={safari} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Custom Booking CTA */}
      <section className="py-20 md:py-section-gap px-5">
        <Reveal className="max-w-container-max mx-auto bg-deep-earth rounded-3xl p-10 md:p-12 text-center md:text-left">
          <div className="md:flex items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ivory-base mb-4">
                {t('customCta.heading')}
              </h2>
              <p className="font-body-lg text-body-lg text-surface-variant">
                {t('customCta.body')}
              </p>
            </div>
            <Link
              to="/about#contact"
              className="mt-8 md:mt-0 inline-flex min-h-[44px] items-center bg-savanna-green text-on-primary px-10 py-5 rounded-full font-label-md text-body-lg transition-transform hover:scale-105 shadow-xl shrink-0"
            >
              {t('customCta.cta')}
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Trust Badges */}
      <section className="pb-20 md:pb-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">{t('trustBadges.parkAuthorized')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Leaf size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">{t('trustBadges.ecoFriendlyTours')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Medal size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">{t('trustBadges.certifiedGuides')}</span>
          </div>
        </div>
      </section>
    </>
  )
}
