import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '../i18n/routing'
import { Leaf, Handshake, SealCheck, WhatsappLogo, ChatCircleText, ArrowRight } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { contact } from '../config/contact'
import { getTeam, localizedTeamTexts } from '../api/team'
import { useFetch } from '../lib/useFetch'
import { initials } from '../lib/initials'
import { useCurrentLocale } from '../i18n/useLocale'

const VALUES = [
  { icon: Leaf, key: 'conservation' },
  { icon: Handshake, key: 'community' },
] as const

const STATS = [
  { value: '15+', key: 'yearsExperience' },
  { value: '1,200+', key: 'happyTravelers' },
  { value: '100%', key: 'localGuides' },
] as const

const INTEREST_KEYS = ['greatMigration', 'luxuryHoneymoon', 'familyAdventure', 'photographicSafari'] as const

export function About() {
  const { t } = useTranslation('about')
  const locale = useCurrentLocale()
  // Team members come from the API. A failed fetch or an empty team hides the
  // section entirely rather than leaving a heading over nothing.
  const { data: team } = useFetch(getTeam, [])
  // This section used to be a name/email/interest form that showed "Inquiry
  // sent" and then threw the lead away — it had no endpoint, and its three
  // fields cannot satisfy POST /api/bookings/, which needs dates, guests and a
  // safari. Rather than stand up a second lead funnel, it now hands off to the
  // Trip Curator, which is the one that actually reaches the Admin inquiries
  // pipeline. The chosen interest rides along and lands in the inquiry's notes.
  const [interestKey, setInterestKey] = useState<(typeof INTEREST_KEYS)[number]>(INTEREST_KEYS[0])
  const interest = t(`interests.${interestKey}`)

  return (
    <>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[614px] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg5BIRgzqVDmehBpFEJA8lbYjauwRxJ6csIXTWJR34T4eINtkLZuaiTGAs33ctIjezztbrkTYi_Lljx_QgcuArjhckEv0C50VQ6St-MP-PFAtHryw6hyE-6cxwmPJRUzTc_TxeOZkkOJsmbmN5e4fOzE-IX5ga_th3bILhOBg6i5uOorFLdzWLFMXvXaT47qA91_eNEua1I60D9m64ZJl-qLZ7_aovcAfAtYEuMUw_Sxt3q_ag80lC"
          alt={t('hero.imageAlt')}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-deep-earth/40" />
        <div className="relative z-10 text-center px-5 md:px-margin-desktop">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-6 max-w-4xl mx-auto drop-shadow-lg">
            {t('hero.heading')}
          </h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Story & Values */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter lg:gap-20 items-center">
          <Reveal>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-8">
              {t('story.heading')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
              {t('story.paragraph1')}
            </p>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              {t('story.paragraph2')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
              {VALUES.map((value) => (
                <div key={value.key} className="flex items-start gap-4">
                  <value.icon size={30} weight="fill" className="text-savanna-green shrink-0" />
                  <div>
                    <h3 className="font-headline-md text-[20px] mb-2 text-on-surface">{t(`story.values.${value.key}.title`)}</h3>
                    <p className="text-on-surface-variant">{t(`story.values.${value.key}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150} className="relative h-[420px] md:h-[600px] w-full rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnKe-biQFongU_NYNWVlg6_noR6CDiiUiWStAjS2Oh14yfL8A7Zw_Ie1w1_WaEa0F6fkrEBZkHVIvbntLlEpg5qpCD-hggdprX2gnujvxNE98Rq3OjpPvJErmL33uxTYWbjnLe3xoSRuDJUPdzynCYXEeIScoPItZ1t8Kam1UT7D0pu5sXK9Q2V8r_kEhPOdKJpaOBIDQKDzzJxLZ7jkMm_iYhPZo53E8lo4F66OidyHU-xTxEVjcv"
              alt={t('story.imageAlt')}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* Credentials Strip */}
      <section className="bg-surface-container-low py-16">
        <div className="max-w-container-max mx-auto px-5 md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-sand-stone/50">
            {STATS.map((stat, i) => (
              <Reveal key={stat.key} delay={i * 100} className="p-6">
                <div className="font-display-lg text-display-lg text-savanna-green mb-2">{stat.value}</div>
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  {t(`stats.${stat.key}`)}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Experts */}
      {team && team.length > 0 && (
        <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
              {t('team.heading')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {t('team.subtitle')}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {team.map((member, i) => {
              const texts = localizedTeamTexts(member, locale)
              return (
                <Reveal
                  key={member.id}
                  delay={i * 100}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(45,45,45,0.06)] group"
                >
                  <div className="h-80 overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={texts.photoAlt}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        role="img"
                        aria-label={texts.photoAlt}
                        className="w-full h-full bg-surface-container flex items-center justify-center font-headline-lg text-[64px] text-on-surface-variant/60"
                      >
                        {initials(member.name)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <h3 className="font-headline-md text-[24px] text-on-surface">{member.name}</h3>
                        <p className="font-body-md text-terracotta">{texts.title}</p>
                      </div>
                      {contact.social.whatsapp && (
                        <a
                          href={contact.social.whatsapp}
                          title={t('team.contactOnWhatsApp')}
                          className="text-savanna-green hover:text-primary-container transition-colors flex items-center justify-center bg-surface-container-low p-2 rounded-full shrink-0"
                        >
                          <ChatCircleText size={22} weight="fill" />
                        </a>
                      )}
                    </div>
                    <p className="font-body-md text-on-surface-variant mt-4 line-clamp-3">{texts.bio}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {/* Integrated Inquiry Section */}
      <section id="contact" className="bg-surface-container-low py-20 md:py-section-gap scroll-mt-24">
        <div className="max-w-container-max mx-auto px-5 md:px-margin-desktop">
          <Reveal className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(45,45,45,0.06)] p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-md text-on-surface mb-6">
                  {t('inquiry.heading')}
                </h2>
                <p className="font-body-md text-on-surface-variant mb-8">
                  {t('inquiry.subtitle')}
                </p>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="about-interest" className="block font-label-md text-label-md text-on-surface mb-2">
                      {t('inquiry.primaryInterest')}
                    </label>
                    <select
                      id="about-interest"
                      name="interest"
                      value={interestKey}
                      onChange={(e) => setInterestKey(e.target.value as (typeof INTEREST_KEYS)[number])}
                      className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                    >
                      {INTEREST_KEYS.map((key) => (
                        <option key={key} value={key}>{t(`interests.${key}`)}</option>
                      ))}
                    </select>
                  </div>
                  <Link
                    to={`/plan?interest=${encodeURIComponent(interest)}`}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md text-label-md px-6 py-4 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {t('inquiry.startPlanning')}
                    <ArrowRight size={18} />
                  </Link>
                  <p className="font-body-sm text-on-surface-variant">
                    {t('inquiry.helperText')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center lg:border-l border-sand-stone/50 lg:pl-12">
                <div className="bg-ivory-base rounded-xl p-8 border border-sand-stone/30 relative overflow-hidden">
                  <ChatCircleText size={120} weight="fill" className="absolute top-0 right-0 p-4 text-on-surface opacity-5" />
                  <h3 className="font-headline-md text-[28px] text-on-surface mb-4 relative z-10">{t('inquiry.preferToChat')}</h3>
                  <p className="font-body-md text-on-surface-variant mb-8 relative z-10">
                    {t('inquiry.chatBody')}
                  </p>
                  {contact.social.whatsapp && (
                    <a
                      href={contact.social.whatsapp}
                      className="inline-flex items-center justify-center w-full bg-[#25D366] text-white font-label-md text-label-md px-6 py-4 rounded-lg hover:bg-[#128C7E] transition-colors relative z-10 shadow-sm"
                    >
                      <WhatsappLogo size={20} weight="fill" className="mr-2" />
                      {t('inquiry.messageOnWhatsApp')}
                    </a>
                  )}
                  <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant relative z-10">
                    <SealCheck size={20} weight="fill" className="text-golden-sun" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">
                      {t('inquiry.certifiedLocalOperator')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
