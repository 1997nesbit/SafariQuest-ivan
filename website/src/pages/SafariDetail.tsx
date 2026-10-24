import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Link } from '../i18n/routing'
import { getSafari, type SafariPackage } from '../api/safaris'
import { useFetch } from '../lib/useFetch'
import { SafariLikeDetail } from '../components/SafariLikeDetail'

export function SafariDetail() {
  const { t } = useTranslation('safaris')
  const { id } = useParams<{ id: string }>()
  const { data: safari, loading, error } = useFetch<SafariPackage>(() => getSafari(id!), [id])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">{t('detail.loading')}</div>
  }

  if (error || !safari) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('detail.notFound')}</h1>
          <Link
            to="/safaris"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            {t('detail.backToSafaris')}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <SafariLikeDetail
      title={safari.title}
      image={safari.image}
      imageAlt={safari.imageAlt}
      galleryImages={safari.galleryImages}
      days={safari.days}
      badge={safari.badge}
      accommodation={safari.accommodation}
      locationLabel={safari.destination}
      price={safari.price}
      priceUsd={safari.priceUsd}
      overview={safari.overview}
      highlights={safari.highlights}
      included={safari.included}
      excluded={safari.excluded}
      itinerary={safari.itinerary}
      bookPath={`/safaris/${safari.id}/book`}
    />
  )
}
