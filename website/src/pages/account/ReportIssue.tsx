import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react'
import { myTrips } from '../../data/myTrips'

export function ReportIssue() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = myTrips.find((t) => t.id === tripId)
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Trip Not Found</h1>
        <Link to="/account" className="text-savanna-green font-label-md">
          Back to My Trips
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-3xl">
        {submitted ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-sm">
            <CheckCircle size={48} weight="fill" className="text-savanna-green mx-auto mb-4" />
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">Report Submitted</h1>
            <p className="text-on-surface-variant mb-8">
              Our guest support team has been notified and will follow up within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/account/trips/${trip.id}`)}
              className="min-h-[44px] bg-savanna-green text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-opacity"
            >
              Back to Trip
            </button>
          </div>
        ) : (
          <>
            <Link
              to={`/account/trips/${trip.id}`}
              className="inline-flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-6 hover:text-savanna-green transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Trip
            </Link>

            <div className="mb-8">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                Guest Support
              </h1>
              <p className="text-on-surface-variant">
                Please provide details regarding your experience. Our dedicated team is here to assist you.
              </p>
            </div>

            <div className="bg-surface-container-low rounded-lg p-6 mb-8 border border-surface-container-high flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Trip
                </div>
                <div className="font-headline-md text-[18px] text-on-surface">{trip.packageTitle}</div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-surface-container-highest" />
              <div>
                <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Guide
                </div>
                <div className="text-on-surface">{trip.guide.name}</div>
              </div>
            </div>

            <form
              className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-10 shadow-sm space-y-8"
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
            >
              <div>
                <label htmlFor="issue-description" className="block font-label-md text-label-md text-on-surface mb-2">
                  Tell us what went wrong
                </label>
                <textarea
                  id="issue-description"
                  required
                  rows={6}
                  placeholder="Please describe the issue in detail..."
                  className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
                />
              </div>

              <div>
                <p className="block font-label-md text-label-md text-on-surface mb-2">Optional: Upload Photos</p>
                <button
                  type="button"
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-sand-stone rounded-lg py-10 text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors"
                >
                  <Camera size={36} />
                  <span className="text-on-surface">Click to upload or drag and drop</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    PNG, JPG, or PDF (max. 10MB)
                  </span>
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-surface-variant/30">
                <div className="flex items-start gap-3 flex-1">
                  <ShieldCheck size={20} className="text-golden-sun mt-0.5 shrink-0" />
                  <p className="text-on-surface-variant text-sm">
                    We take your feedback seriously and our guest relations team will respond quickly to resolve this
                    matter.
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary px-8 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
                >
                  Submit Report
                  <PaperPlaneTilt size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
