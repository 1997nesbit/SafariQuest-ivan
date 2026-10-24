import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceMobile, WarningCircle } from '@phosphor-icons/react'
import { resendPaymentPrompt } from '../../api/bookings'
import { formatMoney, type Currency } from '../../lib/money'
import { usePaymentStatus } from '../../lib/usePaymentStatus'

type ResendState = 'idle' | 'sending' | 'sent' | 'failed'

const RESEND_MESSAGE_KEY: Record<Exclude<ResendState, 'idle' | 'sending'>, string> = {
  sent: 'mobilePay.resent',
  failed: 'mobilePay.resendFailed',
}

/** "Check your phone" while a direct payment's prompt waits for the tourist's PIN. Polls
 * the payment (which the server checks against Snippe) and calls `onCompleted` once it's
 * paid; on failure or expiry, offers `onTryAgain` so they can pay again, perhaps with
 * another number. */
export function PaymentWaiting({
  bookingId,
  paymentId,
  phoneMasked,
  amount,
  currency,
  onCompleted,
  onTryAgain,
}: Readonly<{
  bookingId: number
  paymentId: number
  phoneMasked: string
  amount: number
  currency: Currency
  onCompleted: () => void
  onTryAgain: () => void
}>) {
  const { t, i18n } = useTranslation('booking')
  const { payment, gaveUp } = usePaymentStatus(bookingId, paymentId)
  const [resend, setResend] = useState<ResendState>('idle')
  const completedRef = useRef(false)
  const status = payment?.status

  useEffect(() => {
    if (status === 'completed' && !completedRef.current) {
      completedRef.current = true
      onCompleted()
    }
  }, [status, onCompleted])

  async function handleResend() {
    setResend('sending')
    try {
      await resendPaymentPrompt(bookingId, paymentId)
      setResend('sent')
    } catch {
      setResend('failed')
    }
  }

  if (status === 'failed' || status === 'expired') {
    return (
      <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-6 text-center space-y-4">
        <WarningCircle size={40} weight="fill" className="mx-auto text-error" />
        <h3 className="font-headline-md text-[20px] text-on-surface">{t('mobilePay.failedHeading')}</h3>
        <p className="text-on-surface-variant text-sm">{t('mobilePay.failedBody')}</p>
        <button
          type="button"
          onClick={onTryAgain}
          className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 rounded-lg font-label-md hover:opacity-90 transition-opacity"
        >
          {t('mobilePay.tryAgain')}
        </button>
      </div>
    )
  }

  const resendMessage = resend === 'sent' || resend === 'failed' ? t(RESEND_MESSAGE_KEY[resend]) : null

  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-savanna-green/20 bg-savanna-green/10 p-6 text-center space-y-4">
      <DeviceMobile size={40} className="mx-auto text-savanna-green animate-pulse" />
      <h3 className="font-headline-md text-[20px] text-on-surface">{t('mobilePay.waitingHeading')}</h3>
      <p className="text-on-surface">
        {t('mobilePay.waitingBody', { amount: formatMoney(amount, i18n.language, currency), phone: phoneMasked })}
      </p>
      <p className="text-on-surface-variant text-sm">{gaveUp ? t('mobilePay.stillWaiting') : t('mobilePay.waitingNote')}</p>
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resend === 'sending'}
          className="min-h-[44px] px-5 rounded-lg border border-savanna-green text-savanna-green font-label-md hover:bg-savanna-green/5 transition-colors disabled:opacity-60"
        >
          {t('mobilePay.resend')}
        </button>
        <button
          type="button"
          onClick={onTryAgain}
          className="min-h-[44px] px-5 rounded-lg text-on-surface-variant font-label-md hover:text-savanna-green transition-colors"
        >
          {t('mobilePay.differentNumber')}
        </button>
      </div>
      {resendMessage && <p className="text-sm text-on-surface-variant">{resendMessage}</p>}
    </div>
  )
}
