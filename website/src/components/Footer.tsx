import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Phone,
  EnvelopeSimple,
  PaperPlaneTilt,
  InstagramLogo,
  FacebookLogo,
  TiktokLogo,
  LinkedinLogo,
  WhatsappLogo,
  UserCircle,
} from '@phosphor-icons/react'
import { contact } from '../config/contact'
import { Link } from '../i18n/routing'

export function Footer() {
  const { t } = useTranslation('common')
  return (
    <footer className="bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-5 md:px-margin-desktop py-16 md:py-section-gap max-w-container-max mx-auto">
        <div>
          <div className="font-headline-md text-headline-md text-savanna-green mb-6">{t('brandName')}</div>
          <p className="text-on-surface-variant font-body-md mb-6">
            {t('footer.tagline')}
          </p>
          {/* `|| '#'` used to render these as dead links whenever the VITE_SOCIAL_*
              vars were unset, which is their state in .env and .env.example alike.
              About.tsx and BookingConfirmed.tsx already gate on the value being
              present; this matches them. */}
          <div className="flex items-center gap-4 text-on-surface-variant">
            {contact.social.instagram && (
              <a href={contact.social.instagram} aria-label="Instagram" className="hover:text-savanna-green transition-colors">
                <InstagramLogo size={22} />
              </a>
            )}
            {contact.social.facebook && (
              <a href={contact.social.facebook} aria-label="Facebook" className="hover:text-savanna-green transition-colors">
                <FacebookLogo size={22} />
              </a>
            )}
            {contact.social.tiktok && (
              <a href={contact.social.tiktok} aria-label="TikTok" className="hover:text-savanna-green transition-colors">
                <TiktokLogo size={22} />
              </a>
            )}
            {contact.social.linkedin && (
              <a href={contact.social.linkedin} aria-label="LinkedIn" className="hover:text-savanna-green transition-colors">
                <LinkedinLogo size={22} />
              </a>
            )}
            {contact.social.whatsapp && (
              <a href={contact.social.whatsapp} aria-label="WhatsApp" className="hover:text-savanna-green transition-colors">
                <WhatsappLogo size={22} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">{t('footer.quickLinks')}</h4>
          <ul className="space-y-3">
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/safaris">{t('nav.safaris')}</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/destinations">{t('nav.destinations')}</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/experiences">{t('nav.experiences')}</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/about">{t('nav.about')}</Link></li>
            <li><Link className="text-on-surface-variant hover:text-terracotta transition-colors" to="/become-agent">{t('footer.referAndEarn')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">{t('footer.legal')}</h4>
          <ul className="space-y-3">
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">{t('footer.privacyPolicy')}</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">{t('footer.termsOfService')}</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">{t('footer.parkRegulations')}</a></li>
            <li><a className="text-on-surface-variant hover:text-terracotta transition-colors" href="#">{t('footer.sitemap')}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-label-md text-label-md text-on-surface font-bold mb-6 uppercase tracking-wider">{t('footer.contact')}</h4>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-on-surface-variant">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <span>{contact.address}</span>
            </li>
            <li className="flex items-center gap-2 text-on-surface-variant">
              <Phone size={18} className="shrink-0" />
              <a className="hover:text-terracotta transition-colors" href={`tel:${contact.phoneHref}`}>{contact.phone}</a>
            </li>
            <li className="flex items-center gap-2 text-on-surface-variant">
              <EnvelopeSimple size={18} className="shrink-0" />
              <a className="hover:text-terracotta transition-colors" href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            {contact.secondary.name && (
              <li className="flex items-center gap-2 text-on-surface pt-3 font-label-md text-label-sm">
                <UserCircle size={18} className="shrink-0" />
                <span>{contact.secondary.name}</span>
              </li>
            )}
            {contact.secondary.phone && (
              <li className="flex items-center gap-2 text-on-surface-variant">
                <Phone size={18} className="shrink-0" />
                <a className="hover:text-terracotta transition-colors" href={`tel:${contact.secondary.phone.replace(/\s/g, '')}`}>
                  {contact.secondary.phone}
                </a>
              </li>
            )}
            {contact.secondary.email && (
              <li className="flex items-center gap-2 text-on-surface-variant">
                <EnvelopeSimple size={18} className="shrink-0" />
                <a className="hover:text-terracotta transition-colors break-all" href={`mailto:${contact.secondary.email}`}>
                  {contact.secondary.email}
                </a>
              </li>
            )}
          </ul>
          <form className="flex" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">{t('footer.emailAddress')}</label>
            <input
              id="newsletter-email"
              className="bg-ivory-base border border-sand-stone rounded-l-lg px-4 py-2 w-full min-h-[44px] focus:outline-none focus:ring-1 focus:ring-savanna-green"
              placeholder={t('footer.emailPlaceholder')}
              type="email"
              required
            />
            <button
              type="submit"
              className="bg-savanna-green text-on-primary px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity min-w-[44px] min-h-[44px] cursor-pointer"
              aria-label={t('footer.subscribeToNewsletter')}
            >
              <PaperPlaneTilt size={20} />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-surface-variant py-8 text-center px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <p className="text-on-surface-variant text-label-sm">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  )
}
