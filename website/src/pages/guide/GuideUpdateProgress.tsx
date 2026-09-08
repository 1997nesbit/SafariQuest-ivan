import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Camera, Check, CheckCircle, Lock, MapPin, PencilSimple, WifiSlash } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { guideTrips, type TripMilestone } from '../../data/guideTrips'

export function GuideUpdateProgress() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = guideTrips.find((t) => t.id === tripId)
  const [milestones, setMilestones] = useState<TripMilestone[]>(trip?.milestones ?? [])
  const [note, setNote] = useState('')

  if (!trip) {
    return (
      <div className="min-h-screen bg-surface-bright">
        <GuideTopBar title="Update Progress" showBack />
        <main className="pt-24 pb-28 px-5 max-w-lg mx-auto text-center">
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">Trip not found.</p>
          <Link to="/guide" className="text-savanna-green font-label-md text-label-md">
            Back to Schedule
          </Link>
        </main>
        <GuideBottomNav active="schedule" />
      </div>
    )
  }

  function markCurrentComplete() {
    setMilestones((prev) => {
      const currentIndex = prev.findIndex((m) => m.status === 'current')
      if (currentIndex === -1) return prev
      const next = prev.map((m, i) => {
        if (i === currentIndex) {
          return { ...m, status: 'completed' as const, timestamp: `Completed at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` }
        }
        if (i === currentIndex + 1) {
          return { ...m, status: 'current' as const }
        }
        return m
      })
      return next
    })
    setNote('')
  }

  const hasCurrent = milestones.some((m) => m.status === 'current')

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar title="Update Progress" showBack />

      <main className="pt-20 pb-40 px-5 max-w-lg mx-auto min-h-screen">
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-2">{trip.packageTitle}</p>

        <div className="flex items-center gap-2 bg-secondary-container/15 border border-secondary-container/30 text-secondary rounded-lg px-4 py-2.5 mb-6">
          <WifiSlash size={18} />
          <span className="font-label-sm text-label-sm">You're offline. Updates will sync automatically once reconnected.</span>
        </div>

        <div className="relative pl-5 space-y-6 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-0.5 before:bg-outline-variant before:z-0">
          {milestones.map((milestone) => {
            if (milestone.status === 'completed') {
              return (
                <div key={milestone.id} className="relative z-10 flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-savanna-green flex items-center justify-center shadow-sm relative z-10 mt-0.5">
                    <Check size={18} weight="bold" className="text-on-primary" />
                  </div>
                  <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-surface-variant/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-label-md text-on-surface">{milestone.title}</h4>
                      <PencilSimple size={18} className="text-on-surface-variant" />
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{milestone.timestamp}</p>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">{milestone.description}</p>
                  </div>
                </div>
              )
            }

            if (milestone.status === 'current') {
              return (
                <div key={milestone.id} className="relative z-10 flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-golden-sun flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] relative z-10 mt-0.5">
                    <MapPin size={18} weight="fill" className="text-on-secondary-fixed-variant" />
                  </div>
                  <div className="flex-1 bg-surface-container-lowest rounded-xl p-5 border-2 border-golden-sun shadow-sm">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary mb-2 border border-secondary-container/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-golden-sun animate-pulse" />
                      <span className="font-label-sm text-label-sm">Current stop</span>
                    </div>
                    <h4 className="font-headline-md text-[18px] text-on-surface">{milestone.title}</h4>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note about this stop (optional)"
                      className="w-full mt-3 bg-surface border border-surface-variant rounded-lg p-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      className="w-full mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant rounded-lg py-3 text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-md text-label-md"
                    >
                      <Camera size={20} />
                      Add Photo
                    </button>
                    <button
                      type="button"
                      onClick={markCurrentComplete}
                      className="w-full mt-3 bg-savanna-green text-on-primary py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
                    >
                      <CheckCircle size={20} />
                      Mark Complete
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={milestone.id} className="relative z-10 flex gap-4 items-start opacity-60">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-outline-variant relative z-10 mt-0.5">
                  <Lock size={16} className="text-outline" />
                </div>
                <div className="flex-1 pt-1.5">
                  <h4 className="font-label-md text-on-surface-variant">{milestone.title}</h4>
                  <p className="font-label-sm text-label-sm text-outline mt-1">{milestone.day}</p>
                </div>
              </div>
            )
          })}

          {!hasCurrent && (
            <div className="relative z-10 pl-12 -mt-2">
              <p className="font-body-md text-body-md text-savanna-green font-bold">All milestones complete for this trip.</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-16 inset-x-0 z-30 px-5 py-3 bg-gradient-to-t from-surface-bright via-surface-bright/95 to-transparent">
        <button
          type="button"
          className="max-w-lg mx-auto w-full flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-3.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-colors"
        >
          Save Progress
        </button>
      </div>

      <GuideBottomNav active="schedule" />
    </div>
  )
}
