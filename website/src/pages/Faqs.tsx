import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CaretDown,
  FirstAidKit,
  HandCoins,
  IdentificationCard,
  MagnifyingGlass,
  Suitcase,
  Sun,
  XCircle,
} from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { faqCategories } from '../data/faqs'

const categoryIcons: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  'Booking & Payment': HandCoins,
  'Visas & Entry': IdentificationCard,
  'Best Time to Visit': Sun,
  Packing: Suitcase,
  'Health & Safety': FirstAidKit,
  'Cancellation Policy': XCircle,
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const firstCategory = faqCategories[0]
const firstItem = firstCategory?.items[0]
const defaultOpenKey = firstCategory && firstItem ? `${firstCategory.category}-${firstItem.question}` : null

export function Faqs() {
  const [openKey, setOpenKey] = useState<string | null>(defaultOpenKey)
  const [activeCategory, setActiveCategory] = useState<string | null>(firstCategory?.category ?? null)
  const [query, setQuery] = useState('')

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faqCategories
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [query])

  return (
    <>
      {/* Hero */}
      <section className="relative h-[420px] md:h-[512px] flex items-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5QRwWzMyeKz5t--BZvq_Nd0Ms76XKRN2xYqy2xM6zXS6OqlJWJv74kYmwf0Izr1VUDbdwHFHSx835VE7edWB4NdjBMTBEO7QC9PXnYP3mDtXbKC6UgllN3Vk8tvJlTOVVmy7D4nOIE4K5fRkEAc56cTeRbQPrI6Ws9NnJir2yO2BBxD5o0TuIulxabch4kO41uKmPlw35PVi3VbAoCojuJfDPDdaJuv5bdwi_R5b4eovW257i8dmu"
          alt="A Tanzanian safari guide beside a Land Rover on the golden Serengeti plains at sunrise."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-earth/70 via-deep-earth/40 to-transparent" />
        <div className="relative z-10 px-5 md:px-margin-desktop w-full max-w-container-max mx-auto">
          <h1 className="font-display-lg text-[32px] md:text-display-lg text-ivory-base mb-4 max-w-2xl">
            Frequently Asked Questions
          </h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-xl mb-8">
            Preparation is the key to an unforgettable journey. Find expert answers to all your logistical, safety,
            and travel questions here.
          </p>
          <div className="relative max-w-md">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a topic (e.g. 'Vaccinations')"
              className="w-full min-h-[44px] bg-white/95 text-on-surface border-none rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-savanna-green shadow-[0_4px_20px_-2px_rgba(45,45,45,0.15)] font-body-md"
            />
          </div>
        </div>
      </section>

      {/* Categories + accordions */}
      <section className="py-16 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-28 space-y-2">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">
              Categories
            </h3>
            <nav className="flex flex-col gap-1">
              {faqCategories.map((cat) => {
                const Icon = categoryIcons[cat.category]
                return (
                  <a
                    key={cat.category}
                    href={`#${slugify(cat.category)}`}
                    onClick={() => setActiveCategory(cat.category)}
                    className={`flex items-center justify-between gap-2 p-3 rounded-lg transition-colors font-label-md text-label-md ${
                      activeCategory === cat.category
                        ? 'bg-surface-container-high text-savanna-green'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-savanna-green'
                    }`}
                  >
                    {cat.category}
                    {Icon && <Icon size={20} className="shrink-0" />}
                  </a>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-16">
          {visibleCategories.length === 0 && (
            <p className="text-on-surface-variant font-body-md">No questions match “{query}”. Try a different search.</p>
          )}
          {visibleCategories.map((cat) => {
            const Icon = categoryIcons[cat.category]
            return (
              <div key={cat.category} id={slugify(cat.category)} className="scroll-mt-28">
                <Reveal>
                  <div className="flex items-center gap-3 mb-6">
                    {Icon && <Icon size={24} className="text-savanna-green" />}
                    <h2 className="font-headline-md text-headline-md text-on-surface">{cat.category}</h2>
                  </div>
                  <div className="space-y-4">
                    {cat.items.map((item) => {
                      const key = `${cat.category}-${item.question}`
                      const isOpen = openKey === key
                      return (
                        <div key={key} className="border-b border-sand-stone pb-4">
                          <button
                            type="button"
                            onClick={() => setOpenKey(isOpen ? null : key)}
                            aria-expanded={isOpen}
                            className="group w-full flex items-center justify-between gap-4 py-2 text-left min-h-[44px]"
                          >
                            <span className="font-body-lg text-body-lg font-bold text-on-surface group-hover:text-savanna-green">
                              {item.question}
                            </span>
                            <CaretDown
                              size={20}
                              className={`text-on-surface-variant shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="mt-4 text-on-surface-variant font-body-md leading-relaxed bg-surface-container-low p-6 rounded-lg">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Reveal>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-container-low py-16 md:py-24">
        <Reveal className="max-w-container-max mx-auto px-5 md:px-margin-desktop text-center">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Still have questions?</h3>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            Our safari specialists are on hand to help you plan your perfect Tanzanian adventure.
          </p>
          <Link
            to="/about#contact"
            className="inline-flex min-h-[44px] items-center gap-2 bg-savanna-green text-on-primary px-10 py-4 rounded-xl font-label-md hover:opacity-90 transition-opacity group"
          >
            Contact our experts
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </section>
    </>
  )
}
