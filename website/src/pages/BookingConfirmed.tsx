import { useState } from 'react'
import { useLocation, useNavigate, Link as PlainLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Link } from '../i18n/routing'
import {
  CheckCircle,
  CalendarPlus,
  PhoneCall,
  ShieldCheck,
  ShieldStar,
  Headset,
  ArrowRight,
  Phone,
  Envelope,
  CreditCard,
  WhatsappLogo,
  HandCoins,
} from '@phosphor-icons/react'
import { contact } from '../config/contact'
import { activateReferralAgent, getPublicReferralSettings } from '../api/referrals'
import { useAuth } from '../auth/AuthContext'
import { useFetch } from '../lib/useFetch'
import { ApiError } from '../lib/api'

const NEXT_STEPS = [
  { icon: CalendarPlus, borderColor: 'border-savanna-green', iconColor: 'text-savanna-green', key: 'itineraryPrep' },
  { icon: PhoneCall, borderColor: 'border-golden-sun', iconColor: 'text-golden-sun', key: 'consultationCall' },
  { icon: ShieldCheck, borderColor: 'border-terracotta', iconColor: 'text-terracotta', key: 'welcomePack' },
] as const

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD46ZODNecN_x9gUPz05p-6LL7fuBmRbE-9ijpnHvZHq9qTOoiaPErlqy9TDsD8rkMW56A9bfcpdGNPbcTR90iQZ8GdJl0KdSJyYi1EyGR8wMB0xXwYkJ64oYXMvaLlwhH-uGbjzXNH8g_M7pXeu0Cu--tNA8CEaYC71W7mbiNJHRTX-r01h_iG-J5eXHFyQc9OI0xk2bDyws_zde5SL_YFT6xR0oRzBkOBe08_mSs8XxGRapLyXtiC7LYeEHF_eGG_hPmYmZyskXA17g'
const BENTO_LARGE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrN7f-31QBo6HA8nmmSsbZ9ZyLEsBm-vJSD8B0tFwsxYCSPAgQKOwjVXDIa1pVFTaTFbEhXI_eR6LXa0Q6g6Bz1l0LOUiuH4FEIrjGdjgjn-qJoRZB8TazdW6oY-UPPy9kjeH3kb7q1eUfhBpQBTRFzyieWQUUWtUo66qS93eDQ5JGSobxmP2iqY7GSA-1jAOrW4RmbsVktB2MoMAqNPADvuzS73fRqWLmCydWeLYQGlABf3_P1MDL'
const BENTO_SMALL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDfb3LhZ4Grm0EXswuE5zBp3bZPKCMbytAJpHpmDfYSNUSTDLm5vYbftZAZwdux5Q10iL-7nfKMQg9gzB74EyU-dMsejXRcEUVnSl1i8FV0bk8wqKQ500OvVgY7bwTHOYEizBHy9AhLKpsW63GHbJJQq8CMeqP282vuua5vMOMe6owsDuN6sHYWzZPNy9azvAOs0qxaDVkvRNXpkYde_jb-9PtOXTFePInwlQemsHJgYLxKoAmZB8BKSA2j_iAC9JqqYQ'

/**
 * Invites a traveller who has just booked to refer friends, at the moment they're most
 * enthusiastic. Referral agent is a profile on the same tourist login
 * (see User.is_referral_agent), so a signed-in traveller activates it in one click.
 */
function ReferAndEarnCard() {
  const { t } = useTranslation('booking')
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { data: rates } = useFetch(getPublicReferralSettings, [])
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guide and admin accounts can't book, so they never reach this page as a customer.
  if (user && user.role !== 'tourist') return null

  async function handleActivate() {
    setError(null)
    setActivating(true)
    try {
      await activateReferralAgent()
      await refreshUser()
      navigate('/agent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('confirmed.referral.error'))
      setActivating(false)
    }
  }

  const buttonClass =
    'min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-savanna-green font-label-md text-label-md px-8 py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shrink-0'

  return (
    <section className="w-full px-5 md:px-margin-desktop pb-16 md:pb-24">
      <div className="max-w-container-max mx-auto bg-savanna-green text-on-primary rounded-3xl p-8 md:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-golden-sun font-label-md tracking-widest uppercase mb-3">
            <HandCoins size={20} weight="bold" />
            {t('confirmed.referral.eyebrow')}
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-3">
            {t('confirmed.referral.heading')}
          </h2>
          <p className="opacity-90">
            {rates
              ? t('confirmed.referral.bodyWithRates', {
                  discount: rates.discountPercent,
                  commission: rates.commissionPercent,
                })
              : t('confirmed.referral.body')}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-golden-sun font-label-sm text-label-sm">
              {error}
            </p>
          )}
        </div>
        {user?.isReferralAgent ? (
          // /agent is an unprefixed portal, so the plain router Link, not the locale-aware one.
          <PlainLink to="/agent" className={buttonClass}>
            {t('confirmed.referral.openDashboard')}
            <ArrowRight size={18} weight="bold" />
          </PlainLink>
        ) : user ? (
          <button type="button" onClick={handleActivate} disabled={activating} className={buttonClass}>
            {activating ? t('confirmed.referral.activating') : t('confirmed.referral.activate')}
            <ArrowRight size={18} weight="bold" />
          </button>
        ) : (
          <Link to="/become-agent" className={buttonClass}>
            {t('confirmed.referral.learnMore')}
            <ArrowRight size={18} weight="bold" />
          </Link>
        )}
      </div>
    </section>
  )
}

export function BookingConfirmed() {
  const { t, i18n } = useTranslation('booking')
  const location = useLocation()
  const state = location.state as { title?: string; paidAmount?: number; paidToEmail?: string } | null
  const title = state?.title
  const paidAmount = state?.paidAmount
  const paidToEmail = state?.paidToEmail

  return (
    <>
      <section className="w-full bg-surface-container-low px-5 md:px-margin-desktop py-16 md:py-20">
        <div className="max-w-container-max mx-auto grid md:grid-cols-2 gap-10 md:gap-gutter items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/10 text-savanna-green rounded-full mb-6 font-label-md text-label-md">
              <CheckCircle size={18} weight="fill" />
              {t('confirmed.badge')}
            </div>
            <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface mb-6 leading-tight">
              {t('confirmed.headingLine1')} <br />
              <span className="text-savanna-green">{t('confirmed.headingLine2')}</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-10">
              {title ? t('confirmed.thankYouWithTitle', { title }) : t('confirmed.thankYouGeneric')} {t('confirmed.subtitle')}
            </p>
            {paidAmount !== undefined && (
              <div className="flex items-start gap-3 bg-savanna-green/10 border border-savanna-green/20 rounded-xl p-5 mb-10 max-w-lg">
                <CreditCard size={22} className="text-savanna-green shrink-0 mt-0.5" />
                <div>
                  <p className="font-label-md text-label-md text-on-surface mb-1">
                    {t('confirmed.depositReceived', { amount: paidAmount.toLocaleString(i18n.language) })}
                  </p>
                  <p className="text-on-surface-variant text-sm">
                    {t('confirmed.confirmationSentTo', { email: paidToEmail ?? t('confirmed.yourRegistrationEmail') })}
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/account"
                className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity shadow-lg shadow-savanna-green/20"
              >
                {t('confirmed.goToDashboard')}
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                to="/safaris"
                className="min-h-[44px] inline-flex items-center justify-center border-2 border-terracotta text-terracotta px-8 py-3.5 rounded-full font-label-md text-label-md hover:bg-terracotta hover:text-white transition-colors"
              >
                {t('confirmed.browseMoreSafaris')}
              </Link>
              {contact.social.whatsapp && (
                <a
                  href={contact.social.whatsapp}
                  className="min-h-[44px] inline-flex items-center gap-2 border-2 border-savanna-green text-savanna-green px-8 py-3.5 rounded-full font-label-md text-label-md hover:bg-savanna-green/5 transition-colors"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  {t('confirmed.chatOnWhatsApp')}
                </a>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative z-10 bg-surface-container">
              <img src={HERO_IMAGE} alt={t('confirmed.heroImageAlt')} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-golden-sun/20 rounded-full blur-3xl z-0" />
            <div className="absolute -top-6 -left-6 w-48 h-48 bg-savanna-green/10 rounded-full blur-3xl z-0" />
          </div>
        </div>
      </section>

      <section className="w-full px-5 md:px-margin-desktop py-16 md:py-24">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              {t('confirmed.nextSteps.heading')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {t('confirmed.nextSteps.subtitle')}
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-sand-stone z-0" />
            {NEXT_STEPS.map((step) => (
              <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 bg-ivory-base border-4 ${step.borderColor} rounded-full flex items-center justify-center mb-6 shadow-sm`}
                >
                  <step.icon size={40} className={step.iconColor} />
                </div>
                <h3 className="font-headline-md text-headline-md text-[20px] text-on-surface mb-3">{t(`confirmed.nextSteps.${step.key}.title`)}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">{t(`confirmed.nextSteps.${step.key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReferAndEarnCard />

      <section className="w-full bg-surface-container-low px-5 md:px-margin-desktop py-16 md:py-24">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                {t('confirmed.resources.heading')}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                {t('confirmed.resources.subtitle')}
              </p>
            </div>
            <Link to="/faqs" className="text-savanna-green font-label-md text-label-md flex items-center gap-2 hover:underline">
              {t('confirmed.resources.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[520px]">
            <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg">
              <img
                src={BENTO_LARGE_IMAGE}
                alt={t('confirmed.resources.packingGuide.imageAlt')}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-on-primary">
                <span className="bg-terracotta px-3 py-1 rounded-md text-label-sm mb-4 inline-block uppercase tracking-wider">
                  {t('confirmed.resources.packingGuide.badge')}
                </span>
                <h3 className="font-headline-md text-headline-md mb-2">{t('confirmed.resources.packingGuide.title')}</h3>
                <p className="font-body-md text-body-md opacity-90 max-w-sm">
                  {t('confirmed.resources.packingGuide.body')}
                </p>
              </div>
            </div>

            <div className="md:col-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg">
              <img
                src={BENTO_SMALL_IMAGE}
                alt={t('confirmed.resources.photographyTips.imageAlt')}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-on-primary">
                <h3 className="font-headline-md text-headline-md mb-2">{t('confirmed.resources.photographyTips.title')}</h3>
                <p className="font-body-md text-body-md opacity-90 max-w-sm">
                  {t('confirmed.resources.photographyTips.body')}
                </p>
              </div>
            </div>

            <div className="md:col-span-1 relative rounded-xl overflow-hidden shadow-lg bg-ivory-base border border-sand-stone p-8 flex flex-col justify-end">
              <ShieldStar size={40} weight="fill" className="text-golden-sun mb-4" />
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">{t('confirmed.resources.safeSecure.title')}</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('confirmed.resources.safeSecure.body')}</p>
            </div>

            <div className="md:col-span-1 relative rounded-xl overflow-hidden shadow-lg bg-savanna-green p-8 flex flex-col justify-end">
              <Headset size={40} className="text-on-primary mb-4" />
              <h3 className="font-body-lg text-body-lg font-bold text-on-primary mb-1">{t('confirmed.resources.directHelp.title')}</h3>
              <p className="font-label-sm text-label-sm text-on-primary/80">{t('confirmed.resources.directHelp.body')}</p>
            </div>
          </div>

          <div className="mt-14 pt-10 border-t border-sand-stone text-center">
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">
              {t('confirmed.urgentQuestion')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {contact.phoneHref && (
                <a href={contact.phoneHref} className="flex items-center gap-2 text-on-surface font-label-md hover:text-savanna-green transition-colors">
                  <Phone size={18} className="text-savanna-green" />
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-on-surface font-label-md hover:text-savanna-green transition-colors">
                  <Envelope size={18} className="text-savanna-green" />
                  {contact.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
