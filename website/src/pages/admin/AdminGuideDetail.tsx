import { Link, useParams } from 'react-router-dom'
import { Star, Check, CaretRight, ChatCircleDots, ArrowLeft } from '@phosphor-icons/react'
import { adminStaff } from '../../data/adminStaff'

const STAGE_ORDER = ['New Inquiry', 'Quoted', 'Deposit Paid', 'Confirmed', 'Completed'] as const

export function AdminGuideDetail() {
  const { id } = useParams<{ id: string }>()
  const staff = adminStaff.find((s) => s.id === id)

  if (!staff) {
    return (
      <div>
        <p className="text-on-surface-variant mb-4">Staff member not found.</p>
        <Link to="/admin/guides" className="text-savanna-green font-label-md">
          Back to Staff & Guides
        </Link>
      </div>
    )
  }

  // No backend yet for guide trip assignments; the pipeline booking data
  // (website/src/api/bookings.ts) isn't keyed to this mock staff roster.
  const activeBookings: { id: string; customerName: string; packageTitle: string; dateRange: string }[] = []
  const upcomingBookings: { id: string; customerName: string; packageTitle: string; dateRange: string }[] = []
  const currentTrip = activeBookings[0]
  const currentStageIndex = -1

  return (
    <div>
      <Link to="/admin/guides" className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green text-sm mb-4">
        <ArrowLeft size={16} />
        Back to Staff &amp; Guides
      </Link>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center font-headline-md text-xl text-on-surface-variant border-2 border-sand-stone shrink-0">
          {staff.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-headline-md text-[24px] text-on-surface">{staff.name}</h2>
          <p className="text-on-surface-variant text-sm">
            {staff.role} &bull; {staff.status}
          </p>
        </div>
        <div className="flex items-center gap-1 text-golden-sun bg-surface-container-low rounded-lg px-4 py-2">
          <Star size={20} weight="fill" />
          <span className="font-headline-md text-on-surface">{staff.rating}</span>
          <span className="text-on-surface-variant text-sm ml-1">({staff.reviewCount} reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider">Current Trip Tracking</h3>
              {currentTrip && (
                <span className="bg-savanna-green/10 text-savanna-green px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-savanna-green rounded-full animate-pulse" />
                  In Progress
                </span>
              )}
            </div>

            {!currentTrip && <p className="text-on-surface-variant text-sm">No active trip right now.</p>}

            {currentTrip && (
              <div className="bg-surface-container-low rounded-xl p-4 border border-sand-stone/50">
                <p className="font-body-md text-on-surface font-semibold mb-1">
                  {currentTrip.id.toUpperCase()} &middot; {currentTrip.customerName}
                </p>
                <p className="font-label-sm text-on-surface-variant mb-4">
                  {currentTrip.packageTitle} &bull; {currentTrip.dateRange}
                </p>
                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:h-full before:bg-sand-stone">
                  {STAGE_ORDER.map((stage, i) => {
                    const isDone = i < currentStageIndex
                    const isCurrent = i === currentStageIndex
                    return (
                      <div key={stage} className="relative">
                        <span
                          className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface-container-low ${
                            isDone ? 'bg-savanna-green' : isCurrent ? 'bg-primary-container' : 'bg-surface-dim'
                          }`}
                        >
                          {isDone && <Check size={12} weight="bold" className="text-white" />}
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-on-primary-container" />}
                        </span>
                        <div className="flex justify-between items-start">
                          <p className={`font-label-md text-sm ${isCurrent ? 'text-savanna-green font-bold' : isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {stage}
                          </p>
                          {isCurrent && <span className="font-label-sm text-xs text-savanna-green font-bold">Current Stage</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50">
            <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider mb-4">Upcoming Assignments</h3>
            <div className="space-y-3">
              {upcomingBookings.length === 0 && <p className="text-on-surface-variant text-sm">No upcoming assignments.</p>}
              {upcomingBookings.map((b) => (
                <Link
                  key={b.id}
                  to={`/admin/inquiries/${b.id}`}
                  className="flex items-center gap-4 bg-surface-container p-3 rounded-lg hover:bg-surface-container-high transition-colors border border-transparent hover:border-sand-stone"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-sm text-on-surface font-bold truncate">{b.packageTitle}</p>
                    <p className="font-label-sm text-on-surface-variant text-xs">
                      {b.customerName} &bull; {b.dateRange}
                    </p>
                  </div>
                  <CaretRight size={16} className="text-on-surface-variant shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-sand-stone/50 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label-md text-sm text-on-surface font-bold uppercase tracking-wider">Recent Reviews</h3>
            <ChatCircleDots size={18} className="text-on-surface-variant" />
          </div>
          <div className="space-y-4">
            {staff.reviews.length === 0 && <p className="text-on-surface-variant text-sm">No reviews yet.</p>}
            {staff.reviews.map((r, i) => (
              <div key={i} className={`pb-4 ${i < staff.reviews.length - 1 ? 'border-b border-sand-stone/50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-0.5 text-golden-sun">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star key={star} size={14} weight="fill" className={star < r.rating ? '' : 'text-outline-variant'} />
                    ))}
                  </div>
                  <span className="font-label-sm text-on-surface-variant text-xs">{r.date}</span>
                </div>
                <p className="font-body-md text-sm text-on-surface">&ldquo;{r.comment}&rdquo;</p>
                <p className="font-label-sm text-on-surface-variant text-xs mt-2">&mdash; {r.guestName}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
