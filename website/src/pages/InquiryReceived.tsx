import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Envelope, WhatsappLogo, ArrowRight } from '@phosphor-icons/react'
import { contact } from '../config/contact'

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDesVZGFt-aoHfJ7FeHiLmji7XefHjnsnUXzZd1Linkh5ziLhhb4XayUPMgbOlIWUj9gD2VWhjyp3DLqmqjFvtzc-6xsKugMFnVkfY4g7SyZPyiFjTdY_L0zQBQ519AlPeya3zGsOOBFuyIOkTx1h8g_vIvrBT2eBD0jZaCk7fxf8hWoB2thCcU6yS_ZJOOPhVvFIqdwtbnnAOPj5-kKNSCiol3UMwbUoIRh4-68I9NvA8Fo6PRceEH'

export function InquiryReceived() {
  const location = useLocation()
  const name = (location.state as { name?: string } | null)?.name

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-5 md:px-margin-desktop py-section-gap bg-ivory-base text-center">
      <div className="w-full max-w-md h-56 md:h-64 mx-auto mb-12 rounded-xl overflow-hidden relative shadow-[0_10px_40px_-10px_rgba(45,45,45,0.08)]">
        <img src={HERO_IMAGE} alt="An acacia tree silhouetted against a golden African sunset" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-ivory-base/90 backdrop-blur-sm rounded-full p-6 shadow-sm border border-savanna-green/20">
            <CheckCircle size={48} weight="fill" className="text-savanna-green" />
          </div>
        </div>
      </div>

      <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6 max-w-2xl">
        {name ? `Thank you, ${name}!` : 'Inquiry received!'}
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
        Your custom itinerary request has been sent to our safari specialists. A personalized quote will arrive in
        your inbox within 24 hours.
      </p>

      <div className="bg-surface-container-low rounded-xl p-6 md:p-8 mb-12 max-w-xl w-full border border-sand-stone relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-golden-sun" />
        <div className="flex items-start gap-4 text-left">
          <Envelope size={28} weight="fill" className="text-golden-sun shrink-0" />
          <div>
            <h3 className="font-label-md text-label-md text-on-surface mb-2">Account Created</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              To help you manage your adventure, we&apos;ve created a secure account for you so you can track your
              trip from planning to departure.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
        <Link
          to="/account"
          className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md text-label-md py-4 px-8 rounded-lg hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(30,142,62,0.2)]"
        >
          Go to My Dashboard
          <ArrowRight size={18} weight="bold" />
        </Link>
        {contact.social.whatsapp && (
          <a
            href={contact.social.whatsapp}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-ivory-base text-terracotta border border-terracotta font-label-md text-label-md py-4 px-8 rounded-lg hover:bg-surface-container-lowest transition-colors"
          >
            <WhatsappLogo size={20} />
            Chat on WhatsApp
          </a>
        )}
      </div>
    </section>
  )
}
