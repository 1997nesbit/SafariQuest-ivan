import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard } from '@phosphor-icons/react'
import type { PaymentCheckout } from '../../api/bookings'
import { ApiError } from '../../lib/api'
import { canPayWith } from '../../lib/mobileNumbers'
import { PaymentWaiting } from './PaymentWaiting'
import { PhoneNumberField } from './PhoneNumberField'

const BUTTON_CLASS =
  'w-full inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed'

/** One "Pay …" action on a trip card (the deposit retry, or the remaining balance).
 * Hosted mode sends the browser to Snippe's page. Direct mode opens a phone number field
 * in the card, sends the prompt, and waits for the PIN right there. */
export function TripPayButton({
  bookingId,
  label,
  directMode,
  disabled,
  note,
  start,
  onPaid,
}: Readonly<{
  bookingId: number
  label: string
  directMode: boolean
  disabled: boolean
  /** Shown under the button, e.g. why it's disabled. */
  note?: string | null
  start: (phoneNumber?: string) => Promise<PaymentCheckout>
  onPaid: () => void
}>) {
  const { t } = useTranslation('booking')
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState<PaymentCheckout | null>(null)

  async function handleStart() {
    setError(null)
    setStarting(true)
    try {
      const checkout = await start(directMode ? phone : undefined)
      if (checkout.mode === 'hosted') {
        window.location.assign(checkout.checkoutUrl)
        return
      }
      setWaiting(checkout)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
    setStarting(false)
  }

  if (waiting) {
    return (
      <div className="mb-2">
        <PaymentWaiting
          bookingId={bookingId}
          paymentId={waiting.paymentId}
          phoneMasked={waiting.phoneMasked}
          amount={waiting.amount}
          currency={waiting.currency}
          onCompleted={onPaid}
          onTryAgain={() => setWaiting(null)}
        />
      </div>
    )
  }

  if (directMode && open) {
    return (
      <div className="mb-2 space-y-3 rounded-xl border border-sand-stone p-4">
        <PhoneNumberField id={`trip-${bookingId}-phone`} value={phone} onChange={setPhone} disabled={starting} />
        {error && (
          <p role="alert" className="text-error text-sm">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={disabled || starting || !canPayWith(phone)}
          className={BUTTON_CLASS}
        >
          <CreditCard size={18} weight="bold" />
          {starting ? 'Processing…' : label}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-full min-h-[44px] text-on-surface-variant font-label-md hover:text-savanna-green transition-colors"
        >
          {t('mobilePay.cancel')}
        </button>
      </div>
    )
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => (directMode ? setOpen(true) : void handleStart())}
        disabled={disabled || starting}
        className={BUTTON_CLASS}
      >
        <CreditCard size={18} weight="bold" />
        {starting ? 'Processing…' : label}
      </button>
      {note && <p className="text-sm text-on-surface-variant mt-2">{note}</p>}
      {error && (
        <p role="alert" className="text-error text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
