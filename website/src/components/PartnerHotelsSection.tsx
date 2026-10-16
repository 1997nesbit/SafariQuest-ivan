import { useTranslation } from 'react-i18next'
import { ArrowSquareOut, Buildings, Info, MapPin } from '@phosphor-icons/react'
import { getPartnerHotels } from '../api/homepage'
import { useFetch } from '../lib/useFetch'
import { Reveal } from './Reveal'

/**
 * The hotels and lodges Pande works with, each linking to its own website, under
 * a note that each property answers for its own facilities. Renders nothing until
 * at least one hotel is published, like the site's other admin-managed lists.
 */
export function PartnerHotelsSection() {
  const { t } = useTranslation('home')
  const { data } = useFetch(() => getPartnerHotels(), [])
  const hotels = data ?? []
  if (hotels.length === 0) return null

  return (
    <section className="py-20 md:py-section-gap bg-surface-container-lowest">
      <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="max-w-3xl mb-10">
          <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">
            {t('partnerHotels.eyebrow')}
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-5">
            {t('partnerHotels.heading')}
          </h2>
          <p className="flex items-start gap-3 bg-surface-container-low border border-sand-stone rounded-xl p-4 text-on-surface-variant text-sm">
            <Info size={20} className="text-savanna-green shrink-0 mt-0.5" />
            {t('partnerHotels.disclaimer')}
          </p>
        </Reveal>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {hotels.map((hotel, i) => (
            <li key={hotel.id}>
              <Reveal delay={i * 60} className="h-full">
                <a
                  href={hotel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group h-full flex flex-col bg-ivory-base rounded-xl overflow-hidden border border-sand-stone/60 shadow-[0_4px_20px_-2px_rgba(45,45,45,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(45,45,45,0.1)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-surface-container flex items-center justify-center overflow-hidden">
                    {hotel.image ? (
                      <img src={hotel.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <Buildings size={40} className="text-outline" aria-hidden />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-1.5">
                    <h3 className="font-headline-md text-lg text-on-surface">{hotel.name}</h3>
                    {hotel.location && (
                      <p className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <MapPin size={15} className="shrink-0" />
                        {hotel.location}
                      </p>
                    )}
                    <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-savanna-green font-label-md text-sm group-hover:underline">
                      {t('partnerHotels.visitWebsite')}
                      <ArrowSquareOut size={15} />
                      <span className="sr-only"> {t('partnerHotels.opensInNewTab')}</span>
                    </span>
                  </div>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
