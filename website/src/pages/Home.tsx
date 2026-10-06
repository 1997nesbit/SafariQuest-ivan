import { useTranslation } from 'react-i18next'
import { Link } from '../i18n/routing'
import {
  ShieldCheck,
  MapTrifold,
  Leaf,
  ArrowRight,
  CaretDoubleDown,
  Star,
  Compass,
  NotePencil,
  Airplane,
  Medal,
  Headset,
  HandCoins,
  Buildings,
  Suitcase,
  UsersThree,
} from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { SafariCard } from '../components/SafariCard'
import { DestinationSlideshow } from '../components/DestinationSlideshow'
import { getSafaris } from '../api/safaris'
import { getDestinations } from '../api/destinations'
import { getPublicReferralSettings } from '../api/referrals'
import { useFetch } from '../lib/useFetch'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { PromotionsSection } from '../components/PromotionsSection'

const REFERRAL_AUDIENCES = [
  { icon: Buildings, key: 'hotels' },
  { icon: Suitcase, key: 'agents' },
  { icon: UsersThree, key: 'travellers' },
] as const

const JOURNEY_STEPS = [
  { icon: Compass, key: 'curate' },
  { icon: NotePencil, key: 'quote' },
  { icon: Airplane, key: 'journeyStep' },
] as const

const PILLARS = [
  { icon: ShieldCheck, key: 'licensedGuides' },
  { icon: MapTrifold, key: 'customItineraries' },
  { icon: Leaf, key: 'localExpertise' },
] as const

const WHY_CHOOSE_POINTS = [
  { icon: Medal, key: 'localGuides' },
  { icon: Leaf, key: 'sustainable' },
  { icon: Headset, key: 'concierge' },
] as const

const TESTIMONIALS = [
  {
    key: 'sarah',
    name: 'Sarah Jenkins',
    location: 'London, United Kingdom',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBFIMzrREe_jcC3X0qovnWDaglzRGvVy0TWU8RkvZ8FJFjt-G5ui8oQjFLRe3CjGQe2MWNdqNmotnl0vlV60AzI9bMFWwk2Q2eK5OjTg-v-gmsruDqc-NYDmoFI8Z5vwRsPWq1OlFUbnLj_zrLqx3krWRcM6QldqT6dEiHrROyL29Ks4Bdym0GDriAjvrOfWr3vdON_EefgGk_D94U9rguoRtCUh5hZdfcgEE7999SG7KSS1R32gbmq',
  },
  {
    key: 'markus',
    name: 'Markus Weber',
    location: 'Munich, Germany',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDRcYLtsIkom74XG5p6jZlqurQPzqTawzyhwQ6VXrrML45M24gF6_2XWFN9-a94dapRlzTqElUJ7UjxxyQuKE6SnAbUzrCjiczFOjpgbOZusViypZ-6K0Dl10Ox4FWyVTMexcAn2w_0U7rOHLYR3auBrDSGUthdHkhP48mSb2CswDWp9H7Dv5ckSe4T5Y2tLLzjuHSCKkT3ed6U1caTHsIIeNswwZpmrf8GSvDrf3zz5FL90q6PW_Z',
  },
] as const

const GALLERY = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsIQ0laWmQuJ5AQGU-MZ2072mfZEQdaQkkaUsq6_PkZkYtTfEY95tkb3PZ0BKDnIRu9l8YS6HRCPPCiwVBk9g1NlUeazkm_csfHTeaoFhcTWB__xcH4ynGYcPq8xYCfhT4tLUmLcu78V_2ezyAdb1WRRfGHQIx2olP-2eIcQ6q20ZEMoyahkAK9YlASM-bRXwgspPT4PgcaZJlpfz027neyCw1iCq2a7fhmM3S3LRoWY1G8skxGXQ3',
    key: 'flamingos',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuH0tePT8qXq_sHGAE4U3Wpha89bXX6gx6ymIKtzx6ySqYp405qvn7vRhJ6rtisiulxyHtycuBJapgtHaAnHfJvpqWCJDYXHShwbcvIdtnfC4IUwzUNXFLjsMLyPLGFNfplUR2nTi0Eduedi6wzDHL1o4hk9nGkuPGdPC8lACGsD6Jn0qNLmtJrXqWp-QWsiyglOScAe-CdT2X9NCU-Qw1lX9rJVKr9siAAV72jk3p8Ii-RlCwBl3T',
    key: 'wildebeest',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpGD1x2a6nBVYSpCjkjQDx3K3ZZD2PlILrve174tC3eyqNGnv9ODFvhlkC6K4kiBjd7VaJXRlrMhPLIGQVfCASltN5NrgcMsk_QuIhZ7BNj50Cs2Z3ACAxBFhtDncWsywDgS54SqpzhRYEGNPTxLCjvWTW82gCTzfdZxhd5fMpRLKles2hCVupN0WSG2PYgnniyzAZQyuBl21E24Am7eGeQkoHB4SjaTriJxjuD05MXIji1PQpVNWL',
    key: 'tent',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCtN0NgbmLUwPgXkv2bz7m5k4NdWFw6BqiXNYnVLiVRIZEYGk29NwE-yM_9XpdsdfAX3t09Vl-BgSfeCic1dLLcFfnRwXtGWWxQd-WcQ8-7nt_LgOtrJUBrTsofGxzfKwbpVFLLPIy6krV2Z4TtCtKLDxz0x3PJ6F1kl5TNc5HiMPQTRDxqRk1CgFFSJ6bJsYsIkCyLr5elPs5nAMO18mxUxO8CgiVDSOevWPfdBM337-7dygXpJNl',
    key: 'cheetah',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnT1UDxNruXxK2N_ZyiXvfqpFmDOChCGzdi_ALZSSxsdOMkNCpeqYkKywimRGndbUhdEmd2PEbtrwUB0SpE0GkwQCxkwAu5eeXztZRLJW4o0vDrU5C0azHpA2e-q4p0nHZMDSZMsYF7xfLezL8n9tjjgXUiqZws_ZwzwvEGwa0_mHNhBg9nMUUw7fHXT1kPt8LG-76w92Jc47wnLEmivr3d4jJNKGlTdKYWnCs6ZcEs9w2u9g5dXC5',
    key: 'maasai',
  },
] as const

export function Home() {
  const { t } = useTranslation('home')
  const { data: safaris } = useFetch(getSafaris, [])
  const signaturePackages = (safaris ?? []).filter((s) => s.signature)
  const { data: destinations } = useFetch(getDestinations, [])
  const { data: referralRates } = useFetch(getPublicReferralSettings, [])
  const featuredDestinations = (destinations ?? []).slice(0, 4)

  // <video autoPlay> ignores the global prefers-reduced-motion CSS (it only
  // covers CSS animations/transitions), so it's gated here in JS instead.
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen min-h-[640px] w-full flex items-center justify-center overflow-hidden">
        <video
          src="/videos/hero.mp4"
          poster="https://lh3.googleusercontent.com/aida-public/AB6AXuAMR8vztW8A14neiYV4bSqSlUMuo1Y9-mwfvWjE4CS0mK-8UA2Exzvz2F3I9sG-hFGJblKAlfOaZBBbnZqeDi0ivQhv_4XdzmiDeAA7SaAoD1Vbohvb_KalozG-peJSBYM_iDUlD4JEMW3paUXvdttilCgtcnAE5GUg_AiBUFlosW2GqV24mFAx3gROTnY6wB7wJfGBPDixNHiweh10u0W2I2xJeSNIcMvacvsGk_NOXRiC7ZdnPoFM"
          autoPlay={!prefersReducedMotion}
          loop={!prefersReducedMotion}
          muted
          playsInline
          preload={prefersReducedMotion ? 'none' : 'auto'}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 text-center px-5 max-w-4xl">
          <h1 className="font-display-lg text-[40px] md:text-display-lg text-white mb-6">
            {t('hero.heading')}
          </h1>
          <p className="font-body-lg text-body-lg text-white/90 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/plan"
              className="bg-savanna-green text-white px-10 py-4 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors min-h-[44px] flex items-center justify-center"
            >
              {t('hero.bookSafari')}
            </Link>
            <Link
              to="/destinations"
              className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-lg font-label-md text-label-md hover:bg-white/20 transition-colors min-h-[44px] flex items-center justify-center"
            >
              {t('hero.exploreDestinations')}
            </Link>
          </div>
        </div>

        <CaretDoubleDown
          size={28}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white animate-bounce"
          aria-hidden
        />
      </section>

      {/* Trust Bar */}
      <section className="relative z-20 -mt-8 mx-5 md:mx-margin-desktop rounded-xl shadow-[0_10px_30px_-10px_rgba(45,45,45,0.08)] bg-ivory-base">
        <div className="max-w-container-max mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <ShieldCheck size={36} weight="fill" className="text-savanna-green" />
            <div>
              <p className="font-label-md text-label-md text-deep-earth">{t('trustBar.localExperts')}</p>
              <p className="text-on-surface-variant">{t('trustBar.localExpertsSub')}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-sand-stone" />
          <div className="flex items-center gap-4">
            <div className="flex text-golden-sun" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} weight="fill" />
              ))}
            </div>
            <div>
              <p className="font-label-md text-label-md text-deep-earth">{t('trustBar.fiveStarRated')}</p>
              <p className="text-on-surface-variant">{t('trustBar.fiveStarRatedSub')}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-sand-stone" />
          <div className="flex items-center gap-4">
            <Leaf size={36} weight="fill" className="text-terracotta" />
            <div>
              <p className="font-label-md text-label-md text-deep-earth">{t('trustBar.ecoConscious')}</p>
              <p className="text-on-surface-variant">{t('trustBar.ecoConsciousSub')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pande Wilderness Safari */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">{t('pillars.eyebrow')}</span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            {t('pillars.heading')}
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {PILLARS.map((pillar, i) => (
            <Reveal
              key={pillar.key}
              delay={i * 100}
              className="bg-surface-container-low p-10 rounded-xl shadow-[0_10px_30px_-10px_rgba(45,45,45,0.08)] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="bg-savanna-green/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <pillar.icon size={30} className="text-savanna-green" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-4">{t(`pillars.items.${pillar.key}.title`)}</h3>
              <p className="text-on-surface-variant leading-relaxed">{t(`pillars.items.${pillar.key}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Signature Safari Packages. Guarded the same way the Destinations
          section below already is: getSafaris() failing (network error, or a
          genuinely empty result) used to still render this section's heading
          and "View All Safaris" link over an empty grid — a dangling,
          broken-looking header with nothing under it, on the public homepage,
          with no visitor-facing signal that anything had gone wrong. */}
      {signaturePackages.length > 0 && (
        <section className="py-20 md:py-section-gap bg-surface-container">
          <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto">
            <Reveal className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">
                  {t('signature.eyebrow')}
                </span>
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                  {t('signature.heading')}
                </h2>
              </div>
              <Link to="/safaris" className="text-savanna-green font-label-md flex items-center gap-2 group">
                {t('signature.viewAll')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {signaturePackages.map((safari, i) => (
                <Reveal key={safari.id} delay={i * 80}>
                  <SafariCard safari={safari} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotions — client-designed banner ads. Renders nothing when none are live. */}
      <PromotionsSection />

      {/* Explore Tanzania by Region */}
      {featuredDestinations.length > 0 && (
        <section className="py-20 md:py-section-gap bg-surface-container-low">
          <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto">
            <Reveal className="text-center mb-16">
              <span className="text-terracotta font-label-md tracking-widest uppercase mb-2 block">
                {t('destinationsSection.eyebrow')}
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                {t('destinationsSection.heading')}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-gutter">
              {featuredDestinations.map((destination, i) => (
                <Reveal
                  key={destination.id}
                  delay={i * 100}
                  className="relative group h-[400px] rounded-xl overflow-hidden"
                >
                  <DestinationSlideshow images={destination.images} alt={destination.imageAlt} />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/90 via-deep-earth/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-headline-md text-[24px] text-ivory-base mb-2">{destination.name}</h3>
                    <p className="text-sm text-sand-stone/90 mb-4">{destination.highlight}</p>
                    <Link
                      to={`/destinations/${destination.id}`}
                      className="inline-block border border-ivory-base/50 text-ivory-base px-4 py-2 rounded font-label-sm text-label-sm hover:bg-ivory-base hover:text-deep-earth transition-colors min-h-[44px] flex items-center justify-center w-fit"
                    >
                      {destination.linkLabel}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            {t('journey.heading')}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mt-4">
            {t('journey.subtitle')}
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-sand-stone z-0" />
          {JOURNEY_STEPS.map((step, i) => (
            <Reveal
              key={step.key}
              delay={i * 100}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-6 shadow-[0_10px_30px_-10px_rgba(45,45,45,0.08)] text-savanna-green border-4 border-ivory-base">
                <step.icon size={40} />
              </div>
              <h3 className="font-headline-md text-[24px] text-deep-earth mb-3">{t(`journey.steps.${step.key}.title`)}</h3>
              <p className="text-on-surface-variant">{t(`journey.steps.${step.key}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why Choose Pande Wilderness Safari */}
      <section id="about" className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <span className="text-savanna-green font-label-md tracking-widest uppercase mb-2 block">
              {t('whyChoose.eyebrow')}
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-8">
              {t('whyChoose.heading')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10">
              {t('whyChoose.body')}
            </p>
            <ul className="space-y-8">
              {WHY_CHOOSE_POINTS.map((point) => (
                <li key={point.key} className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-golden-sun">
                      <point.icon size={24} weight="fill" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-headline-md text-[20px] text-on-surface mb-2">{t(`whyChoose.points.${point.key}.title`)}</h4>
                    <p className="text-on-surface-variant">{t(`whyChoose.points.${point.key}.description`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={200} className="relative h-[600px] rounded-2xl overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq7Lsu0HDL-2KGvgsD6LvFmTWdIgoRYe-AbUqxiwAMN_cGEM7-I3AB8qoVKHprpteo07PH2DRQVyb4OUTsHBwiNzWADYgfWXjAyMENaOpgVWASL1KTaJjJVIKGwto0mVMnM8ylw70q1IwdL93jMzsSX0yMLOwssyAFiumjbS2qdweYQ3AM07V9LP-WrBG40dWEthdYFnka2n0armknnE1Qa2qeoZaeN_VBnujcXbnbJYwzGUyKBVUR"
              alt={t('whyChoose.imageAlt')}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-surface-container-highest rounded-full -z-10 blur-3xl opacity-50" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-golden-sun/20 rounded-full -z-10 blur-2xl" />
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-section-gap bg-deep-earth text-white overflow-hidden relative">
        <div className="px-5 md:px-margin-desktop max-w-container-max mx-auto relative z-10">
          <Reveal className="max-w-3xl">
            <span className="text-savanna-green font-label-md tracking-widest uppercase mb-4 block">
              {t('testimonials.eyebrow')}
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-16">
              {t('testimonials.heading')}
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {TESTIMONIALS.map((testimonial, i) => (
              <Reveal key={testimonial.key} delay={i * 100} className="space-y-6">
                <div className="flex text-golden-sun" aria-hidden>
                  {'★★★★★'}
                </div>
                <blockquote className="font-headline-md text-2xl md:text-3xl italic font-normal leading-relaxed">
                  “{t(`testimonials.items.${testimonial.key}.quote`)}”
                </blockquote>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={`Portrait of ${testimonial.name}`}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover bg-sand-stone/20"
                  />
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-white/60">{testimonial.location}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Strip */}
      <section className="py-12 bg-surface-container-lowest overflow-hidden">
        <div className="flex gap-4 px-5">
          {GALLERY.map((photo) => (
            <div key={photo.src} className="w-64 md:w-80 h-48 md:h-60 shrink-0 rounded-lg overflow-hidden">
              <img src={photo.src} alt={t(`gallery.alts.${photo.key}`)} loading="lazy" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="bg-surface-container-low rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
              {t('newsletter.heading')}
            </h2>
            <p className="text-on-surface-variant max-w-md">
              {t('newsletter.body')}
            </p>
          </div>
          <form
            className="flex w-full md:w-auto max-w-md gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              {t('newsletter.emailAddress')}
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              required
              placeholder={t('newsletter.emailPlaceholder')}
              className="min-h-[44px] flex-1 bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
            <button
              type="submit"
              className="min-h-[44px] bg-savanna-green text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t('newsletter.subscribe')}
            </button>
          </form>
        </Reveal>
      </section>

      {/* Refer & Earn — lives down here rather than in the header so it doesn't compete
          with "Plan Your Journey", the site's primary call to action. */}
      <section className="pb-20 md:pb-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="bg-savanna-green text-on-primary rounded-3xl p-10 md:p-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-golden-sun font-label-md tracking-widest uppercase mb-4">
              <HandCoins size={20} weight="bold" />
              {t('referral.eyebrow')}
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-4">
              {t('referral.heading')}
            </h2>
            <p className="opacity-90 mb-6">
              {referralRates
                ? t('referral.bodyWithRates', {
                    commission: referralRates.commissionPercent,
                    discount: referralRates.discountPercent,
                  })
                : t('referral.body')}
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {REFERRAL_AUDIENCES.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-center gap-2 text-sm opacity-90">
                  <Icon size={18} className="text-golden-sun shrink-0" />
                  {t(`referral.audiences.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/become-agent"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-savanna-green font-label-md text-label-md px-8 py-4 rounded-lg hover:opacity-90 transition-opacity shrink-0 self-start lg:self-center"
          >
            {t('referral.cta')}
            <ArrowRight size={18} />
          </Link>
        </Reveal>
      </section>
    </>
  )
}
