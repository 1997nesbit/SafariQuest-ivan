export interface GuideReview {
  id: string
  guestName: string
  tripTitle: string
  date: string
  rating: number
  comment: string
}

export const guideReviews: GuideReview[] = [
  {
    id: 'r1',
    guestName: 'Mark Thompson',
    tripTitle: '7-Day Great Migration Quest',
    date: 'Aug 2026',
    rating: 5,
    comment:
      "Juma made our trip unforgettable — his knowledge of animal behavior and patience finding the migration crossing was incredible.",
  },
  {
    id: 'r2',
    guestName: 'Elena Fischer',
    tripTitle: 'Ngorongoro & Tarangire Escape',
    date: 'Jul 2026',
    rating: 5,
    comment: 'Warm, professional, and clearly loves what he does. Highly recommend requesting him directly.',
  },
  {
    id: 'r3',
    guestName: 'Robert Chen',
    tripTitle: 'Great Migration Quest',
    date: 'Jun 2026',
    rating: 4,
    comment: 'Great trip overall. Would have liked a bit more flexibility on the daily start time.',
  },
]

export interface RatingDistributionRow {
  stars: number
  percent: number
}

export const guideRatingSummary: {
  average: number
  total: number
  distribution: RatingDistributionRow[]
} = {
  average: 4.9,
  total: 48,
  distribution: [
    { stars: 5, percent: 88 },
    { stars: 4, percent: 10 },
    { stars: 3, percent: 2 },
    { stars: 2, percent: 0 },
    { stars: 1, percent: 0 },
  ],
}
