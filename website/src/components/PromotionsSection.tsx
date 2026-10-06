import { useEffect, useState } from 'react'
import { CaretLeft, CaretRight, WhatsappLogo } from '@phosphor-icons/react'
import { getPromotions, whatsappUrl, type Promotion } from '../api/promotions'
import { useFetch } from '../lib/useFetch'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'

const AUTO_ADVANCE_MS = 7000

/** Sponsoring Events on the homepage. Renders nothing when no event is published,
 * so an empty section never shows as a blank block. */
export function PromotionsSection() {
  const { data } = useFetch(getPromotions, [])
  const events = data ?? []
  const prefersReducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)

  const count = events.length
  const safeIndex = count > 0 ? index % count : 0

  useEffect(() => {
    if (count < 2 || prefersReducedMotion) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [count, prefersReducedMotion])

  if (count === 0) return null

  const event: Promotion = events[safeIndex]

  return (
    <section aria-labelledby="sponsoring-events-heading" className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
      <h2 id="sponsoring-events-heading" className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-10">
        Sponsoring Events
      </h2>

      <article className="grid md:grid-cols-2 gap-8 items-center bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
        <img src={event.image} alt={event.title} loading="lazy" className="w-full aspect-[4/3] object-cover" />
        <div className="p-8 md:p-12 flex flex-col gap-5">
          <h3 className="font-headline-md text-[26px] text-on-surface">{event.title}</h3>
          <p className="text-on-surface-variant">{event.description}</p>
          <a
            href={whatsappUrl(event.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-2 self-start bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
          >
            <WhatsappLogo size={20} weight="fill" />
            {event.phone}
          </a>
        </div>
      </article>

      {count > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            aria-label="Previous event"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="w-11 h-11 rounded-full border border-sand-stone flex items-center justify-center hover:border-savanna-green"
          >
            <CaretLeft size={18} />
          </button>
          <div className="flex gap-2" aria-hidden="true">
            {events.map((item, i) => (
              <span key={item.id} className={`h-2 rounded-full transition-all ${i === safeIndex ? 'w-6 bg-savanna-green' : 'w-2 bg-sand-stone'}`} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next event"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="w-11 h-11 rounded-full border border-sand-stone flex items-center justify-center hover:border-savanna-green"
          >
            <CaretRight size={18} />
          </button>
        </div>
      )}
    </section>
  )
}
