import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FunnelSimple, ShieldCheck, Leaf, Medal } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { SafariCard } from '../components/SafariCard'
import { getSafaris } from '../api/safaris'
import { useFetch } from '../lib/useFetch'

const DURATION_OPTIONS = [
  { label: 'Duration (Any)', value: '' },
  { label: '3 - 5 Days', value: '3-5' },
  { label: '6 - 10 Days', value: '6-10' },
  { label: '11+ Days', value: '11+' },
]

const BUDGET_OPTIONS = [
  { label: 'Budget (Any)', value: '' },
  { label: 'Under $3,000', value: 'under-3000' },
  { label: '$3,000 - $6,000', value: '3000-6000' },
  { label: '$6,000+', value: '6000+' },
]

const DESTINATION_OPTIONS = [
  { label: 'Destination (All)', value: '' },
  { label: 'Serengeti National Park', value: 'Serengeti National Park' },
  { label: 'Ngorongoro Conservation Area', value: 'Ngorongoro Conservation Area' },
  { label: 'Tarangire & Manyara', value: 'Tarangire & Manyara' },
  { label: 'Zanzibar Extensions', value: 'Zanzibar Extensions' },
]

function matchesDuration(days: number, filter: string) {
  if (!filter) return true
  if (filter === '3-5') return days >= 3 && days <= 5
  if (filter === '6-10') return days >= 6 && days <= 10
  if (filter === '11+') return days >= 11
  return true
}

function matchesBudget(price: number, filter: string) {
  if (!filter) return true
  if (filter === 'under-3000') return price < 3000
  if (filter === '3000-6000') return price >= 3000 && price <= 6000
  if (filter === '6000+') return price > 6000
  return true
}

export function Safaris() {
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
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuArsN8LIH04BlazCIX5eEOzeZucqZDj_kX5blC2ZNDcNAWwC5jDKs-8mGwb-Hfk8aRFQ5QOpshVrmPDLncF37L2Xxn2dm3XaggjgRwBTn0VKO-QrBb5WIyIq5skrUvjXU_7mvAbH0xB1ekeLMgMXjNiZvglIglcF35QnXcz0JQjjEMqkzDsqR9XMx3eoM1vd2rZa_JjqyiP-h_ayzVq86mLinqc3dtvtK1rIJCgHb1lSarNT_JEjwUK"
          alt="A green Land Rover safari vehicle driving through tall golden grass in the Serengeti at hazy sunset."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-4">Our Safari Packages</h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl">
            Discover the untamed heart of Tanzania with our expertly curated journeys, from the Great Migration to
            the hidden gems of Ngorongoro.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-[72px] z-40 bg-surface-container-lowest shadow-sm py-6">
        <div className="px-5 md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col md:flex-row gap-gutter items-center">
          <div className="flex items-center gap-3 text-on-surface-variant font-label-md shrink-0">
            <FunnelSimple size={20} />
            <span>Filter By:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <select
              aria-label="Filter by duration"
              className={selectClass(!!duration)}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by budget"
              className={selectClass(!!budget)}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by destination"
              className={selectClass(!!destination)}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {DESTINATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Safari Grid */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        {loading && <p className="text-center text-on-surface-variant py-20">Loading safaris…</p>}
        {error && <p className="text-center text-error py-20">{error}</p>}
        {!loading && !error && filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-16">
            {filtered.map((safari, i) => (
              <Reveal key={safari.id} delay={(i % 3) * 80}>
                <SafariCard safari={safari} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-20">
            No safaris match those filters yet — try widening your search, or{' '}
            <Link to="/about#contact" className="text-savanna-green underline">
              talk to our specialists
            </Link>
            .
          </p>
        )}
      </section>

      {/* Custom Booking CTA */}
      <section className="py-20 md:py-section-gap px-5">
        <Reveal className="max-w-container-max mx-auto bg-deep-earth rounded-3xl p-10 md:p-12 text-center md:text-left">
          <div className="md:flex items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-ivory-base mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="font-body-lg text-body-lg text-surface-variant">
                Our safari experts are ready to design a bespoke itinerary tailored perfectly to your dreams,
                schedule, and budget.
              </p>
            </div>
            <Link
              to="/about#contact"
              className="mt-8 md:mt-0 inline-flex min-h-[44px] items-center bg-savanna-green text-on-primary px-10 py-5 rounded-full font-label-md text-body-lg transition-transform hover:scale-105 shadow-xl shrink-0"
            >
              Let us customize your safari
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Trust Badges */}
      <section className="pb-20 md:pb-section-gap px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">Park Authorized</span>
          </div>
          <div className="flex items-center gap-3">
            <Leaf size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">Eco-Friendly Tours</span>
          </div>
          <div className="flex items-center gap-3">
            <Medal size={32} className="text-savanna-green" />
            <span className="font-label-md uppercase tracking-widest text-on-surface">Certified Guides</span>
          </div>
        </div>
      </section>
    </>
  )
}
