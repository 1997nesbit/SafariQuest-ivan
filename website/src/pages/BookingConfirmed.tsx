import { Link, useLocation } from 'react-router-dom'
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
} from '@phosphor-icons/react'
import { contact } from '../config/contact'

const NEXT_STEPS = [
  {
    icon: CalendarPlus,
    borderColor: 'border-savanna-green',
    iconColor: 'text-savanna-green',
    title: '1. Itinerary Prep',
    body: 'Our experts curate a personalized itinerary based on your preferences within 24 hours.',
  },
  {
    icon: PhoneCall,
    borderColor: 'border-golden-sun',
    iconColor: 'text-golden-sun',
    title: '2. Consultation Call',
    body: "We'll schedule a brief 15-minute call to answer questions and fine-tune your breathtaking journey details.",
  },
  {
    icon: ShieldCheck,
    borderColor: 'border-terracotta',
    iconColor: 'text-terracotta',
    title: '3. Secure Your Spot',
    body: 'Finalize your booking with a secure deposit and receive your full welcome pack.',
  },
]

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD46ZODNecN_x9gUPz05p-6LL7fuBmRbE-9ijpnHvZHq9qTOoiaPErlqy9TDsD8rkMW56A9bfcpdGNPbcTR90iQZ8GdJl0KdSJyYi1EyGR8wMB0xXwYkJ64oYXMvaLlwhH-uGbjzXNH8g_M7pXeu0Cu--tNA8CEaYC71W7mbiNJHRTX-r01h_iG-J5eXHFyQc9OI0xk2bDyws_zde5SL_YFT6xR0oRzBkOBe08_mSs8XxGRapLyXtiC7LYeEHF_eGG_hPmYmZyskXA17g'
const BENTO_LARGE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrN7f-31QBo6HA8nmmSsbZ9ZyLEsBm-vJSD8B0tFwsxYCSPAgQKOwjVXDIa1pVFTaTFbEhXI_eR6LXa0Q6g6Bz1l0LOUiuH4FEIrjGdjgjn-qJoRZB8TazdW6oY-UPPy9kjeH3kb7q1eUfhBpQBTRFzyieWQUUWtUo66qS93eDQ5JGSobxmP2iqY7GSA-1jAOrW4RmbsVktB2MoMAqNPADvuzS73fRqWLmCydWeLYQGlABf3_P1MDL'
const BENTO_SMALL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDfb3LhZ4Grm0EXswuE5zBp3bZPKCMbytAJpHpmDfYSNUSTDLm5vYbftZAZwdux5Q10iL-7nfKMQg9gzB74EyU-dMsejXRcEUVnSl1i8FV0bk8wqKQ500OvVgY7bwTHOYEizBHy9AhLKpsW63GHbJJQq8CMeqP282vuua5vMOMe6owsDuN6sHYWzZPNy9azvAOs0qxaDVkvRNXpkYde_jb-9PtOXTFePInwlQemsHJgYLxKoAmZB8BKSA2j_iAC9JqqYQ'

export function BookingConfirmed() {
  const location = useLocation()
  const title = (location.state as { title?: string } | null)?.title

  return (
    <>
      <section className="w-full bg-surface-container-low px-5 md:px-margin-desktop py-16 md:py-20">
        <div className="max-w-container-max mx-auto grid md:grid-cols-2 gap-10 md:gap-gutter items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/10 text-savanna-green rounded-full mb-6 font-label-md text-label-md">
              <CheckCircle size={18} weight="fill" />
              Booking Successfully Confirmed
            </div>
            <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface mb-6 leading-tight">
              Your Safari Journey <br />
              <span className="text-savanna-green">Begins Today.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-10">
              {title ? `Thank you for booking ${title}.` : 'Thank you for booking with Pande Wilderness Safari.'} Our
              master guides and planners have received your reservation and are already mapping out your authentic
              Tanzanian adventure.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/account"
                className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity shadow-lg shadow-savanna-green/20"
              >
                Go to My Dashboard
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                to="/safaris"
                className="min-h-[44px] inline-flex items-center justify-center border-2 border-terracotta text-terracotta px-8 py-3.5 rounded-full font-label-md text-label-md hover:bg-terracotta hover:text-white transition-colors"
              >
                Browse More Safaris
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl relative z-10 bg-surface-container">
              <img src={HERO_IMAGE} alt="Elephant crossing a watering hole at golden sunset" className="w-full h-full object-cover" />
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
              What Happens Next
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Three simple steps to finalizing your dream expedition.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-sand-stone z-0" />
            {NEXT_STEPS.map((step) => (
              <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 bg-ivory-base border-4 ${step.borderColor} rounded-full flex items-center justify-center mb-6 shadow-sm`}
                >
                  <step.icon size={40} className={step.iconColor} />
                </div>
                <h3 className="font-headline-md text-headline-md text-[20px] text-on-surface mb-3">{step.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-low px-5 md:px-margin-desktop py-16 md:py-24">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                Resources for your journey
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                Get ready for the wild with our expert tips.
              </p>
            </div>
            <Link to="/faqs" className="text-savanna-green font-label-md text-label-md flex items-center gap-2 hover:underline">
              View all resources
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[520px]">
            <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg">
              <img
                src={BENTO_LARGE_IMAGE}
                alt="Luxury safari camp glowing at night under a star-filled sky"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-on-primary">
                <span className="bg-terracotta px-3 py-1 rounded-md text-label-sm mb-4 inline-block uppercase tracking-wider">
                  Expert Guide
                </span>
                <h3 className="font-headline-md text-headline-md mb-2">Packing for the Savanna</h3>
                <p className="font-body-md text-body-md opacity-90 max-w-sm">
                  From breathable fabrics to high-end optics: everything you need.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg">
              <img
                src={BENTO_SMALL_IMAGE}
                alt="A hammock overlooking turquoise water at a beach resort"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 text-on-primary">
                <h3 className="font-headline-md text-headline-md mb-2">Safari Photography Tips</h3>
                <p className="font-body-md text-body-md opacity-90 max-w-sm">
                  Capture the soul of the Serengeti with our pro guide&apos;s advice.
                </p>
              </div>
            </div>

            <div className="md:col-span-1 relative rounded-xl overflow-hidden shadow-lg bg-ivory-base border border-sand-stone p-8 flex flex-col justify-end">
              <ShieldStar size={40} weight="fill" className="text-golden-sun mb-4" />
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface mb-1">Safe &amp; Secure</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Our safety protocols</p>
            </div>

            <div className="md:col-span-1 relative rounded-xl overflow-hidden shadow-lg bg-savanna-green p-8 flex flex-col justify-end">
              <Headset size={40} className="text-on-primary mb-4" />
              <h3 className="font-body-lg text-body-lg font-bold text-on-primary mb-1">Direct Help</h3>
              <p className="font-label-sm text-label-sm text-on-primary/80">Talk to us now</p>
            </div>
          </div>

          <div className="mt-14 pt-10 border-t border-sand-stone text-center">
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">
              Have an urgent question? Our team is available 24/7.
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
