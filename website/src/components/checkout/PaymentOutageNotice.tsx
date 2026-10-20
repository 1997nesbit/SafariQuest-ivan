import { Warning, WarningCircle } from '@phosphor-icons/react'
import type { PaymentAvailability } from '../../api/bookings'

/** Snippe outage messages above a pay button: a blocking outage in red (the button is
 * disabled by the page), single-network outages as warnings. Renders nothing otherwise. */
export function PaymentOutageNotice({ availability }: { availability: PaymentAvailability | null }) {
  if (!availability) return null
  const { blocked, message, warnings } = availability
  if (!blocked && warnings.length === 0) return null
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      {blocked && message && (
        <p className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-on-surface">
          <WarningCircle size={20} weight="fill" className="text-error shrink-0 mt-0.5" />
          {message}
        </p>
      )}
      {warnings.map((warning) => (
        <p key={warning} className="flex items-start gap-2 rounded-xl border border-golden-sun/40 bg-golden-sun/10 p-4 text-sm text-on-surface">
          <Warning size={20} weight="fill" className="text-golden-sun shrink-0 mt-0.5" />
          {warning}
        </p>
      ))}
    </div>
  )
}
