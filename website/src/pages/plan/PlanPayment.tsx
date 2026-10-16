import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CreditCard } from '@phosphor-icons/react'
import { useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { getSeasons } from '../../api/pricing'
import { createBooking, payForBooking } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { usePlanSelections } from '../../components/plan/usePlanSelections'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { addDays } from '../../lib/date'
import { seasonalPrice } from '../../lib/seasonalPrice'
import { trackFunnelEvent } from '../../lib/funnelTracking'
import { MockCardFields } from '../../components/checkout/MockCardFields'
import { ReferralCodeField } from '../../components/checkout/ReferralCodeField'

export function PlanPayment() {
  const { t, i18n } = useTranslation('plan')
  const { plan } = useTripPlan()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    loading: selectionsLoading,
    selectedDestinations,
    selectedExperiences,
    primarySafari,
    primaryRegionSafari,
    primaryPrice,
  } = usePlanSelections()
  const { data: seasons, loading: seasonsLoading } = useFetch(getSeasons, [])
  const dataLoading = selectionsLoading || seasonsLoading

  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number | null>(null)
  // The booking created by a pay attempt that then failed, and the details it was made
  // from — retrying with the same details pays for it rather than creating a second one.
  const [pendingBooking, setPendingBooking] = useState<{ id: number; key: string } | null>(null)

  const travelers = plan.adults + plan.children

  useEffect(() => {
    if (dataLoading) return
    if (!plan.contactEmail || !plan.travelDates || primaryPrice === undefined) {
      navigate('/plan/review')
      return
    }
    if (!user) {
      navigate('/plan/account')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, plan.contactEmail, plan.travelDates, primaryPrice, user])

  if (dataLoading) {
    return null
  }

  if (!plan.contactEmail || !plan.travelDates || primaryPrice === undefined || !user) {
    return null
  }

  const adultPrice = seasonalPrice(primaryPrice, seasons ?? [], plan.travelDates)
  const childPrice = Math.round(adultPrice * 0.5)
  const total = adultPrice * plan.adults + childPrice * plan.children
  const discountedTotal = referralDiscountPercent ? Math.round(total * (1 - referralDiscountPercent / 100)) : total
  const deposit = Math.round(discountedTotal * 0.3)

  function buildMessage(): string {
    const lines = [
      t('message.destinations', { list: selectedDestinations.map((d) => d.name).join(', ') || t('message.noneSelected') }),
      t('message.experiences', { list: selectedExperiences.map((e) => e.title).join(', ') || t('message.noneSelected') }),
      t('message.accommodationStyle', { style: t(`details.tiers.${plan.accommodationTier}.title`) }),
    ]
    if (plan.contactPhone) lines.push(t('message.phoneWhatsApp', { phone: plan.contactPhone }))
    if (plan.notes) lines.push(t('message.notes', { notes: plan.notes }))
    return lines.join('\n')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitting(true)
    try {
      const bookingInput = {
        name: plan.contactName,
        email: plan.contactEmail,
        safari: primarySafari?.id,
        regionSafari: !primarySafari ? primaryRegionSafari?.id : undefined,
        startDate: plan.travelDates,
        endDate: addDays(plan.travelDates, plan.days),
        guests: travelers,
        children: plan.children,
        message: buildMessage(),
      }
      const bookingKey = JSON.stringify(bookingInput)
      let bookingId = pendingBooking?.key === bookingKey ? pendingBooking.id : null
      if (bookingId === null) {
        bookingId = (await createBooking(bookingInput)).id
        setPendingBooking({ id: bookingId, key: bookingKey })
      }
      const paid = await payForBooking(bookingId, referralDiscountPercent ? referralCode.trim() : undefined)
      setPendingBooking(null)
      trackFunnelEvent('submitted')
      navigate('/booking-confirmed', {
        state: {
          title: primarySafari?.title ?? primaryRegionSafari?.title,
          paidAmount: deposit,
          paidToEmail: paid.customerEmail,
        },
      })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('payment.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">{t('payment.heading')}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t('payment.subtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-6"
      >
        <div className="flex justify-between items-baseline pb-4 border-b border-sand-stone">
          <span className="font-label-md text-label-md text-on-surface-variant">
            {t('payment.depositDueNow')}
            {referralDiscountPercent ? ` (${referralDiscountPercent}% off applied)` : ''}
          </span>
          <span className="font-headline-md text-[24px] text-savanna-green">${deposit.toLocaleString(i18n.language)}</span>
        </div>

        <ReferralCodeField code={referralCode} onCodeChange={setReferralCode} onDiscountChange={setReferralDiscountPercent} />

        <MockCardFields
          namePlaceholder={plan.contactName || 'Johnathan Doe'}
          cardName={cardName}
          onCardNameChange={setCardName}
          cardNumber={cardNumber}
          onCardNumberChange={setCardNumber}
          cardExpiry={cardExpiry}
          onCardExpiryChange={setCardExpiry}
          cardCvv={cardCvv}
          onCardCvvChange={setCardCvv}
        />

        {submitError && (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/plan/review')}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <ArrowLeft size={18} />
            {t('payment.back')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-8 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t('payment.processing') : t('payment.payAndBook', { amount: deposit.toLocaleString(i18n.language) })}
            <CreditCard size={18} weight="bold" />
          </button>
        </div>
      </form>
    </div>
  )
}
