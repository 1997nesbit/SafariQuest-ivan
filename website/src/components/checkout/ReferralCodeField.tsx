import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, HandCoins, Tag, XCircle } from '@phosphor-icons/react'
import { getPublicReferralSettings, validateReferralCode } from '../../api/referrals'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'

/** Optional referral code entry for the payment step. Validates on blur so the
 * discount (and the resulting deposit) is confirmed before the tourist submits,
 * rather than failing silently at the very end.
 *
 * Also mentions, in one line, that the traveller can get their own code once
 * they've booked. It's deliberately plain text with no link: sending someone
 * away from the payment step is how bookings get abandoned. The actual offer is
 * on the booking-confirmed page. */
export function ReferralCodeField({
  code,
  onCodeChange,
  onDiscountChange,
}: {
  code: string
  onCodeChange: (value: string) => void
  onDiscountChange: (discountPercent: number | null) => void
}) {
  const { t } = useTranslation('booking')
  const { user } = useAuth()
  const { data: rates } = useFetch(getPublicReferralSettings, [])
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [message, setMessage] = useState('')

  async function handleBlur() {
    const trimmed = code.trim()
    if (!trimmed) {
      setStatus('idle')
      onDiscountChange(null)
      return
    }
    setStatus('checking')
    try {
      const { discountPercent } = await validateReferralCode(trimmed)
      setStatus('valid')
      setMessage(t('referralField.applied', { percent: discountPercent }))
      onDiscountChange(discountPercent)
    } catch (err) {
      setStatus('invalid')
      setMessage(err instanceof ApiError ? err.message : t('referralField.invalid'))
      onDiscountChange(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="referral-code" className="font-label-md text-label-sm text-on-surface-variant">
        {t('referralField.label')} <span className="text-on-surface-variant/70">{t('referralField.optional')}</span>
      </label>
      <div className="relative">
        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
        <input
          id="referral-code"
          value={code}
          onChange={(e) => {
            onCodeChange(e.target.value.toUpperCase())
            setStatus('idle')
            onDiscountChange(null)
          }}
          onBlur={handleBlur}
          placeholder={t('referralField.placeholder')}
          className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg pl-11 pr-4 py-3 tracking-widest focus:outline-none focus:ring-1 focus:ring-savanna-green"
        />
      </div>
      {status === 'checking' && <p className="text-on-surface-variant text-sm">{t('referralField.checking')}</p>}
      {status === 'valid' && (
        <p className="text-savanna-green text-sm flex items-center gap-1.5">
          <CheckCircle size={15} weight="fill" />
          {message}
        </p>
      )}
      {status === 'invalid' && (
        <p className="text-error text-sm flex items-center gap-1.5">
          <XCircle size={15} weight="fill" />
          {message}
        </p>
      )}
      {!user?.isReferralAgent && (
        <p className="text-on-surface-variant text-xs flex items-start gap-1.5 mt-1">
          <HandCoins size={14} className="text-terracotta shrink-0 mt-0.5" />
          {rates
            ? t('referralField.earnAfterBookingWithRates', {
                discount: rates.discountPercent,
                commission: rates.commissionPercent,
              })
            : t('referralField.earnAfterBooking')}
        </p>
      )}
    </div>
  )
}
