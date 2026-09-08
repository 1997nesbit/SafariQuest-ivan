import { Star } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { guideReviews, guideRatingSummary } from '../../data/guideReviews'

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-golden-sun">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} weight={i < rating ? 'fill' : 'regular'} className={i < rating ? '' : 'text-outline-variant'} />
      ))}
    </div>
  )
}

export function GuideReviews() {
  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="My Reviews" />

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-variant/50 mb-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-display-lg text-4xl text-on-surface font-bold">{guideRatingSummary.average}</p>
              <div className="justify-center mt-1">
                <StarRow rating={5} />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{guideRatingSummary.total} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {guideRatingSummary.distribution.map((row) => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant w-3">{row.stars}</span>
                  <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-golden-sun" style={{ width: `${row.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {guideReviews.map((review) => (
            <div key={review.id} className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-label-sm text-on-surface-variant shrink-0">
                  {review.guestName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-on-surface">{review.guestName}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {review.tripTitle} · {review.date}
                  </p>
                </div>
              </div>
              <div className="mb-2">
                <StarRow rating={review.rating} />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">"{review.comment}"</p>
            </div>
          ))}
        </div>
      </main>

      <GuideBottomNav active="reviews" />
    </div>
  )
}
