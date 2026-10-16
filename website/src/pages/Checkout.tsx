import { Fragment, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Link } from '../i18n/routing'
import { useLocalizedNavigate as useNavigate } from '../i18n/useLocale'
import {
  CreditCard,
  CalendarBlank,
  Users,
  MapPin,
  ShieldCheck,
  Leaf,
  Lock,
  ArrowLeft,
  ArrowRight,
  PencilSimple,
  Info,
} from '@phosphor-icons/react'
import { getSafari, type SafariPackage } from '../api/safaris'
import { getRegionSafari, type RegionSafari } from '../api/regionSafaris'
import { getDestinations } from '../api/destinations'
import { createBooking, payForBooking } from '../api/bookings'
import { getSeasons } from '../api/pricing'
import { useFetch } from '../lib/useFetch'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { addDays } from '../lib/date'
import { activeSeasonForDate, seasonalPrice } from '../lib/seasonalPrice'
import { contact } from '../config/contact'
import { AccountFields, type AccountMode } from '../components/checkout/AccountFields'
import { MockCardFields } from '../components/checkout/MockCardFields'
import { ReferralCodeField } from '../components/checkout/ReferralCodeField'

type CheckoutStep = 'details' | 'review' | 'account' | 'payment'

const ALL_STEP_KEYS: CheckoutStep[] = ['details', 'account', 'review', 'payment']

export function Checkout({ kind }: { kind: 'safari' | 'regionSafari' }) {
  const { t, i18n } = useTranslation('booking')
  const { id } = useParams<{ id: string }>()
  // Both hooks always run (Rules of Hooks) — only the one matching `kind` actually
  // fetches; the other resolves immediately to null, same pattern as an edit-vs-create
  // form fetching "if editing" elsewhere in this codebase.
  const {
    data: safari,
    loading: safariLoading,
    error: safariError,
  } = useFetch<SafariPackage | null>(() => (kind === 'safari' ? getSafari(id!) : Promise.resolve(null)), [kind, id])
  const {
    data: regionSafari,
    loading: regionSafariLoading,
    error: regionSafariError,
  } = useFetch<RegionSafari | null>(
    () => (kind === 'regionSafari' ? getRegionSafari(id!) : Promise.resolve(null)),
    [kind, id],
  )
  const { data: destinations } = useFetch(getDestinations, [])
  const { data: seasons } = useFetch(getSeasons, [])
  const navigate = useNavigate()
  const { user, login, register, logout } = useAuth()
  const isAuthenticated = Boolean(user)

  const [step, setStep] = useState<CheckoutStep>('details')
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [preferredDate, setPreferredDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // The booking created by a pay attempt that then failed, and the details it was made
  // from — retrying with the same details pays for it rather than creating a second one.
  const [pendingBooking, setPendingBooking] = useState<{ id: number; key: string } | null>(null)

  // Account step — only reached when nobody is signed in yet.
  const [accountMode, setAccountMode] = useState<AccountMode>('register')
  const [signInEmail, setSignInEmail] = useState('')
  const [password, setPassword] = useState('')

  // Mock payment step — no gateway is integrated yet (PLANNED); these fields
  // never leave the browser. The server prices the deposit itself.
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [referralDiscountPercent, setReferralDiscountPercent] = useState<number | null>(null)

  const loading = safariLoading || regionSafariLoading
  const loadError = safariError || regionSafariError
  const source = kind === 'safari' ? safari : regionSafari

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">{t('loading')}</div>
  }

  if (loadError || !source) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">{t('notFound')}</h1>
          <Link
            to={kind === 'safari' ? '/safaris' : '/destinations'}
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            {kind === 'safari' ? t('backToSafaris') : t('backToDestinations')}
          </Link>
        </div>
      </section>
    )
  }

  if (user && user.role !== 'tourist') {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Sign In Required</h1>
          <p className="text-on-surface-variant mb-8">
            You're signed in with a {user.role.replace('_', ' ')} account, which can't make bookings. Sign out and
            continue as a tourist (or without an account) to book this safari.
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </div>
      </section>
    )
  }

  // Normalized view over whichever product this checkout is for, so the rest of the
  // page doesn't need to branch on `kind` again.
  const item = {
    id: source.id,
    title: source.title,
    image: source.image,
    imageAlt: source.imageAlt,
    days: source.days,
    price: source.price,
    destination:
      kind === 'safari'
        ? (source as SafariPackage).destination
        : (destinations ?? []).find((d) => d.id === (source as RegionSafari).region)?.name ??
          (source as RegionSafari).region,
  }

  const activeSeason = activeSeasonForDate(seasons ?? [], preferredDate)
  const adultPrice = seasonalPrice(item.price, seasons ?? [], preferredDate)
  const childPrice = Math.round(adultPrice * 0.5)
  const total = adultPrice * adults + childPrice * children
  const discountedTotal = referralDiscountPercent ? Math.round(total * (1 - referralDiscountPercent / 100)) : total
  const deposit = Math.round(discountedTotal * 0.3)
  const stepKeys = isAuthenticated ? ALL_STEP_KEYS.filter((k) => k !== 'account') : ALL_STEP_KEYS
  const steps = stepKeys.map((key) => ({ key, label: t(`steps.${key}`) }))
  const activeIndex = steps.findIndex((s) => s.key === step)
  const safariTitle = item.title
  // Once signed in — whether they arrived that way or just registered/signed in on the
  // Account step — the account's real name/email is authoritative over whatever was typed
  // on the Details step (which may be stale, e.g. after signing in with a different email).
  const displayName = user?.name || fullName
  const displayEmail = user?.email || email

  const travelersText =
    children > 0
      ? `${t('travelers.adults', { count: adults })}, ${t('travelers.children', { count: children })}`
      : t('travelers.adults', { count: adults })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'details') {
      setStep(isAuthenticated ? 'review' : 'account')
      return
    }
    if (step === 'account') {
      setSubmitError(null)
      setSubmitting(true)
      try {
        if (accountMode === 'register') {
          await register(email, fullName, password)
        } else {
          await login(signInEmail, password)
        }
        setStep('review')
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : t('somethingWentWrong'))
      } finally {
        setSubmitting(false)
      }
      return
    }
    if (step === 'review') {
      setStep('payment')
      return
    }

    // step === 'payment'
    setSubmitError(null)
    setSubmitting(true)
    try {
      const bookingInput = {
        name: displayName,
        email: displayEmail,
        safari: kind === 'safari' ? item.id : undefined,
        regionSafari: kind === 'regionSafari' ? item.id : undefined,
        startDate: preferredDate,
        endDate: addDays(preferredDate, item.days),
        guests: adults + children,
        children,
        message: `${travelersText}.`,
      }
      const bookingKey = JSON.stringify(bookingInput)
      let bookingId = pendingBooking?.key === bookingKey ? pendingBooking.id : null
      if (bookingId === null) {
        bookingId = (await createBooking(bookingInput)).id
        setPendingBooking({ id: bookingId, key: bookingKey })
      }
      const paid = await payForBooking(bookingId, referralDiscountPercent ? referralCode.trim() : undefined)
      setPendingBooking(null)
      navigate('/booking-confirmed', {
        state: { title: safariTitle, paidAmount: deposit, paidToEmail: paid.customerEmail },
      })
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t('somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  const ctaLabel =
    step === 'payment'
      ? submitting
        ? t('cta.processing')
        : t('cta.payAndBook', { amount: deposit.toLocaleString(i18n.language) })
      : step === 'account'
        ? submitting
          ? t('cta.pleaseWait')
          : accountMode === 'register'
            ? t('cta.createAccountAndContinue')
            : t('cta.signInAndContinue')
        : step === 'review'
          ? t('cta.continueToPayment')
          : isAuthenticated
            ? t('cta.continueToReview')
            : t('cta.continueToAccount')

  return (
    <section className="min-h-screen bg-surface-container-low py-16 md:py-20 px-5 md:px-margin-desktop">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, i) => {
            const isDone = i < activeIndex
            const isActive = i === activeIndex
            return (
              <Fragment key={s.key}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-label-md font-bold ${
                      isDone || isActive ? 'bg-savanna-green text-on-primary' : 'border-2 border-sand-stone text-on-surface-variant'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`font-label-md text-label-md ${isActive ? 'text-savanna-green' : 'text-on-surface-variant'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-12 md:w-24 mx-2 md:mx-4 -mt-6 ${isDone ? 'bg-savanna-green' : 'bg-sand-stone'}`} />
                )}
              </Fragment>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest rounded-xl p-6 md:p-10 shadow-sm border border-sand-stone"
            >
              {step === 'details' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    {t('details.heading')}
                  </h1>
                  <p className="text-on-surface-variant mb-8">
                    {t('details.subtitle', { title: item.title })}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-name" className="font-label-md text-label-sm text-on-surface-variant">
                        {t('details.fullName')}
                      </label>
                      <input
                        id="checkout-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('details.fullNamePlaceholder')}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-email" className="font-label-md text-label-sm text-on-surface-variant">
                        {t('details.emailAddress')}
                      </label>
                      <input
                        id="checkout-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('details.emailPlaceholder')}
                        disabled={isAuthenticated}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-adults" className="font-label-md text-label-sm text-on-surface-variant">
                        {t('details.adultsLabel')}
                      </label>
                      <input
                        id="checkout-adults"
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={adults}
                        onChange={(e) => setAdults(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-children" className="font-label-md text-label-sm text-on-surface-variant">
                        {t('details.childrenLabel')}
                      </label>
                      <input
                        id="checkout-children"
                        type="number"
                        min={0}
                        step={1}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-date" className="font-label-md text-label-sm text-on-surface-variant">
                        {t('details.preferredStartDate')}
                      </label>
                      <input
                        id="checkout-date"
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green">
                      {t('review.heading')}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="inline-flex items-center gap-1.5 text-terracotta font-label-md text-label-md hover:opacity-80 transition-opacity"
                    >
                      <PencilSimple size={16} />
                      {t('review.edit')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.fullName')}
                      </p>
                      <p className="font-label-md text-on-surface">{displayName || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.email')}
                      </p>
                      <p className="font-label-md text-on-surface">{displayEmail || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.travelers')}
                      </p>
                      <p className="font-label-md text-on-surface">{travelersText}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.preferredStartDate')}
                      </p>
                      <p className="font-label-md text-on-surface">{preferredDate}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.package')}
                      </p>
                      <p className="font-label-md text-on-surface">{item.title}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        {t('review.duration')}
                      </p>
                      <p className="font-label-md text-on-surface">{t('days', { count: item.days })}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    {t('review.back')}
                  </button>
                </div>
              )}

              {step === 'account' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    {accountMode === 'register' ? t('account.createHeading') : t('account.signInHeading')}
                  </h1>
                  <p className="text-on-surface-variant mb-6">
                    {accountMode === 'register' ? t('account.registerSubtitle') : t('account.signInSubtitle')}
                  </p>

                  <AccountFields
                    accountMode={accountMode}
                    onAccountModeChange={setAccountMode}
                    email={email}
                    password={password}
                    onPasswordChange={setPassword}
                    signInEmail={signInEmail}
                    onSignInEmailChange={setSignInEmail}
                    onEditDetails={() => setStep('details')}
                  />

                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    {t('account.back')}
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    {t('payment.heading')}
                  </h1>
                  <p className="text-on-surface-variant mb-6">
                    {t('payment.subtitle')}
                  </p>

                  <ReferralCodeField
                    code={referralCode}
                    onCodeChange={setReferralCode}
                    onDiscountChange={setReferralDiscountPercent}
                  />

                  <div className="mt-6">
                    <MockCardFields
                      namePlaceholder={fullName || 'Johnathan Doe'}
                      cardName={cardName}
                      onCardNameChange={setCardName}
                      cardNumber={cardNumber}
                      onCardNumberChange={setCardNumber}
                      cardExpiry={cardExpiry}
                      onCardExpiryChange={setCardExpiry}
                      cardCvv={cardCvv}
                      onCardCvvChange={setCardCvv}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    {t('payment.back')}
                  </button>
                </div>
              )}

            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 py-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <ShieldCheck size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">{t('trustBadges.certifiedOperator')}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Leaf size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">{t('trustBadges.ecoTourism')}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Lock size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">{t('trustBadges.secureCheckout')}</span>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-sand-stone sticky top-24">
              <div className="h-44 relative">
                <img src={item.image} alt={item.imageAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/70 to-transparent flex items-end p-5">
                  <h2 className="font-headline-md text-[20px] text-ivory-base leading-tight">{item.title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <CalendarBlank size={16} /> {t('summary.duration')}
                    </span>
                    <span className="font-label-md text-on-surface">{t('days', { count: item.days })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <MapPin size={16} /> {t('summary.location')}
                    </span>
                    <span className="font-label-md text-on-surface">{item.destination}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <Users size={16} /> {t('summary.guests')}
                    </span>
                    <span className="font-label-md text-on-surface">{travelersText}</span>
                  </div>
                </div>

                <hr className="border-sand-stone" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>{t('priceLine.adults', { count: adults, price: adultPrice.toLocaleString(i18n.language) })}</span>
                    <span>${(adultPrice * adults).toLocaleString(i18n.language)}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-on-surface-variant">
                      <span>{t('priceLine.children', { count: children, price: childPrice.toLocaleString(i18n.language) })}</span>
                      <span>${(childPrice * children).toLocaleString(i18n.language)}</span>
                    </div>
                  )}
                  {activeSeason && (
                    <p className="text-xs text-terracotta">
                      {t('summary.seasonPricingApplied', { season: activeSeason.name, multiplier: activeSeason.multiplier })}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-sand-stone">
                  <span className="font-label-md text-label-md text-on-surface-variant">{t('summary.total')}</span>
                  <span className="font-headline-md text-[28px] text-savanna-green">${total.toLocaleString(i18n.language)}</span>
                </div>
                <div className="flex justify-between font-label-md text-label-md text-terracotta">
                  <span>
                    {t('summary.depositDueNow')}
                    {referralDiscountPercent ? ` (${referralDiscountPercent}% off applied)` : ''}
                  </span>
                  <span>${deposit.toLocaleString(i18n.language)}</span>
                </div>

                {submitError && (
                  <p role="alert" className="text-center text-error font-label-sm text-label-sm">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={submitting}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-4 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-lg shadow-savanna-green/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ctaLabel}
                  {step === 'payment' && <CreditCard size={18} weight="bold" />}
                  {step !== 'payment' && <ArrowRight size={18} weight="bold" />}
                </button>
                <p className="text-center text-label-sm text-on-surface-variant px-2">
                  {t('cta.termsAgreement', { cta: ctaLabel })}
                </p>
              </div>
            </div>

            <div className="mt-6 p-6 bg-terracotta/5 border border-terracotta/20 rounded-xl flex gap-4">
              <Info size={22} className="text-terracotta shrink-0" />
              <div>
                <h4 className="font-label-md text-label-md text-terracotta mb-1">{t('needHelp.heading')}</h4>
                <p className="text-sm text-on-surface-variant mb-1">
                  {t('needHelp.body')}
                </p>
                {contact.phoneHref && (
                  <a href={contact.phoneHref} className="text-terracotta font-bold text-sm hover:underline">
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
