import { Link } from 'react-router-dom'
import { Warning, ChatCircleText } from '@phosphor-icons/react'
import { myTrips } from '../../data/myTrips'

export function AccountComplaints() {
  const activeTrip = myTrips.find((t) => t.status === 'in-progress' || t.status === 'upcoming') ?? myTrips[0]

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Complaints</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Something not go as planned? Let us know and our team will follow up within one business day.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0_4px_20px_rgba(45,45,45,0.06)] border border-surface-variant text-center">
        <Warning size={40} className="text-terracotta mx-auto mb-4" />
        <p className="font-headline-md text-headline-md text-on-surface mb-2">No complaints filed</p>
        <p className="text-on-surface-variant max-w-md mx-auto mb-8">
          If anything on a trip needs attention, report it directly from that trip&apos;s progress page and our team
          will step in.
        </p>
        {activeTrip && (
          <Link
            to={`/account/trips/${activeTrip.id}/report-issue`}
            className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity"
          >
            <ChatCircleText size={18} />
            Report an Issue
          </Link>
        )}
      </div>
    </div>
  )
}
