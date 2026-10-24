import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, DeviceMobile } from '@phosphor-icons/react'
import { useCurrentLocale, useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { getSeasons } from '../../api/pricing'
import { createBooking, getPaymentAvailability, payForBooking } from '../../api/bookings'
import { useFetch } from '../../lib/useFetch'
import { useTripPlan } from '../../components/plan/tripPlanStore'
import { usePlanSelections } from '../../components/plan/usePlanSelections'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { addDays } from '../../lib/date'
import { seasonalPrice } from '../../lib/seasonalPrice'
import { trackFunnelEvent } from '../../lib/funnelTracking'
import { MobileMoneyNotice } from '../../components/checkout/MobileMoneyNotice'
import { PaymentWaiting } from '../../components/checkout/PaymentWaiting'
import { PhoneNumberField } from '../../components/checkout/PhoneNumberField'
import { PaymentOutageNotice } from '../../components/checkout/PaymentOutageNotice'
import { ReferralCodeField } from '../../components/checkout/ReferralCodeField'
import { formatMoney, productPrice, type Currency } from '../../lib/money'
import { useDisplayCurrency } from '../../lib/currencyPreference'
import { CurrencyChoice } from '../../components/checkout/CurrencyChoice'
import { canPayWith } from '../../lib/mobileNumbers'

export function PlanPayment() {
  const { t, i18n } = useTranslation('plan')
  const { plan } = useTripPlan()
  const navigate = useNavigate()
  const locale = useCurrentLocale()
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
  const { data: paymentAvailability } = useFetch(getPaymentAvailability, [])
  const dataLoading = selectionsLoading || seasonsLoading

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number | null>(null)
  // The booking created by a pay attempt that then failed, and the details it was made
  // from — retrying with the same details pays for it rather than creating a second one.
  const [pendingBooking, setPendingBooking] = useState<{ id: number; key: string } | null>(null)
  // Direct payments: the number the prompt goes to (the plan's contact phone to start
  // with), and the prompt now waiting for the tourist's PIN.
  const [phone, setPhone] = useState(plan.contactPhone ?? '')
  const [waiting, setWaiting] = useState<{
    bookingId: number
    paymentId: number
    phoneMasked: string
    amount: number
    currency: Currency
  } | null>(null)
  // What this booking is priced and paid in: the visitor's currency, shared with the
  // header toggle — choosing here switches the whole site, and vice versa.
  const { currency: chosenCurrency, setCurrency: setChosenCurrency } = useDisplayCurrency()

  const travelers = plan.adults + plan.children

  useEffect(() => {
    if (dataLoading) return
    if (!plan.contactEmail || !plan.travelDates || primaryPrice === undefined) {
      void navigate('/plan/review')
      return
    }
    if (!user) {
      void navigate('/plan/account')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, plan.contactEmail, plan.travelDates, primaryPrice, user])

  if (dataLoading) {
    return null
  }

  if (!plan.contactEmail || !plan.travelDates || primaryPrice === undefined || !user) {
    return null
  }

  // A trip with no USD price can only be booked in TZS, whatever was chosen.
  const product = primarySafari ?? primaryRegionSafari
  const usdPriced = product ? productPrice(product, 'USD') !== null : false
  const currency: Currency = usdPriced ? chosenCurrency : 'TZS'
  const basePrice = (product && productPrice(product, currency)) ?? primaryPrice
  const money = (amount: number) => formatMoney(amount, i18n.language, currency)
  const adultPrice = seasonalPrice(basePrice, seasons ?? [], plan.travelDates)
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
        currency,
      }
      const bookingKey = JSON.stringify(bookingInput)
      let bookingId = pendingBooking?.key === bookingKey ? pendingBooking.id : null
      if (bookingId === null) {
        bookingId = (await createBooking(bookingInput)).id
        setPendingBooking({ id: bookingId, key: bookingKey })
      }
      const checkout = await payForBooking(bookingId, locale, {
        referralCode: referralDiscountPercent ? referralCode.trim() : undefined,
        phoneNumber: payingByPhone ? phone : undefined,
      })
      trackFunnelEvent('submitted')
      if (checkout.mode === 'hosted') {
        // Off to Snippe's checkout page; it sends the tourist back to /booking-confirmed.
        // `submitting` stays true so the button can't be pressed again on the way out.
        window.location.assign(checkout.checkoutUrl)
        return
      }
      setWaiting({
        bookingId,
        paymentId: checkout.paymentId,
        phoneMasked: checkout.phoneMasked,
        amount: checkout.amount,
        currency,
      })
      setSubmitting(false)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('payment.somethingWentWrong'))
      setSubmitting(false)
    }
  }

  // Direct unless the server says hosted; it's the server that decides either way.
  const directMode = paymentAvailability?.mode !== 'hosted'
  // TZS goes to Snippe (a phone prompt in direct mode); USD to Senjaropay, once connected.
  const payingByPhone = currency === 'TZS' && directMode
  const usdUnavailable = currency === 'USD' && !paymentAvailability?.currencies?.USD
  const snippeBlocked = currency === 'TZS' && Boolean(paymentAvailability?.blocked)
  const payDisabled = submitting || snippeBlocked || usdUnavailable || (payingByPhone && !canPayWith(phone))

  let paymentMethodField: ReactNode = <MobileMoneyNotice />
  if (currency === 'USD') {
    // The currency choice above already says USD payments are coming soon.
    paymentMethodField = null
  } else if (directMode) {
    paymentMethodField = (
      <PhoneNumberField id="plan-payment-phone" value={phone} onChange={setPhone} disabled={submitting} />
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">{t('payment.heading')}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {currency === 'USD' ? t('payment.subtitleUsd') : t('payment.subtitle')}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone space-y-6"
      >
        <div className="flex justify-between items-baseline pb-4 border-b border-sand-stone">
          <span className="font-label-md text-label-md text-on-surface-variant">
            {t('payment.depositDueNow')}
            {referralDiscountPercent ? ` (${referralDiscountPercent}% off applied)` : ''}
          </span>
          <span className="font-headline-md text-[24px] text-savanna-green">{money(deposit)}</span>
        </div>

        {waiting && (
          <PaymentWaiting
            bookingId={waiting.bookingId}
            paymentId={waiting.paymentId}
            phoneMasked={waiting.phoneMasked}
            amount={waiting.amount}
            currency={waiting.currency}
            onCompleted={() =>
              void navigate(`/booking-confirmed?booking=${waiting.bookingId}&payment=${waiting.paymentId}`)
            }
            onTryAgain={() => setWaiting(null)}
          />
        )}
        {!waiting && (
          <>
            <CurrencyChoice
              name="plan-currency"
              value={currency}
              onChange={setChosenCurrency}
              usdPriced={usdPriced}
              usdPayable={Boolean(paymentAvailability?.currencies?.USD)}
            />
            <ReferralCodeField code={referralCode} onCodeChange={setReferralCode} onDiscountChange={setReferralDiscountPercent} />
            {paymentMethodField}
            {currency === 'TZS' && <PaymentOutageNotice availability={paymentAvailability} />}
          </>
        )}

        {submitError && (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => void navigate('/plan/review')}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <ArrowLeft size={18} />
            {t('payment.back')}
          </button>
          <button
            type="submit"
            hidden={waiting !== null}
            disabled={payDisabled}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-8 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t('payment.processing') : t('payment.payAndBook', { amount: money(deposit) })}
            <DeviceMobile size={18} weight="bold" />
          </button>
        </div>
      </form>
    </div>
  )
}
