import { Fragment, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CreditCard,
  Bank,
  DeviceMobile,
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
import { useFetch } from '../lib/useFetch'
import { contact } from '../config/contact'

type PaymentOption = 'card' | 'transfer' | 'mobile'
type CheckoutStep = 'details' | 'review' | 'payment'

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
]

export function Checkout() {
  const { id } = useParams<{ id: string }>()
  const { data: safari, loading, error } = useFetch<SafariPackage>(() => getSafari(id!), [id])
  const navigate = useNavigate()

  const [step, setStep] = useState<CheckoutStep>('details')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [payment, setPayment] = useState<PaymentOption>('card')

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (error || !safari) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-5 py-32 text-center">
        <div className="max-w-xl">
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Safari Not Found</h1>
          <Link
            to="/safaris"
            className="min-h-[44px] inline-flex items-center justify-center bg-savanna-green text-on-primary px-8 py-3.5 rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Back to Safaris
          </Link>
        </div>
      </section>
    )
  }

  const total = safari.price * adults + safari.price * 0.5 * children
  const deposit = total * 0.3
  const activeIndex = STEPS.findIndex((s) => s.key === step)
  const safariTitle = safari.title

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'details') {
      setStep('review')
    } else if (step === 'review') {
      setStep('payment')
    } else {
      navigate('/booking-confirmed', { state: { title: safariTitle } })
    }
  }

  return (
    <section className="min-h-screen bg-surface-container-low py-16 md:py-20 px-5 md:px-margin-desktop">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-12">
          {STEPS.map((s, i) => {
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
                {i < STEPS.length - 1 && (
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
                    Reservation Details
                  </h1>
                  <p className="text-on-surface-variant mb-8">
                    Please provide your details exactly as they appear on your passport to ensure a smooth park
                    entry and lodge check-in for {safari.title}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-name" className="font-label-md text-label-sm text-on-surface-variant">
                        Full Name
                      </label>
                      <input
                        id="checkout-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Johnathan Doe"
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-email" className="font-label-md text-label-sm text-on-surface-variant">
                        Email Address
                      </label>
                      <input
                        id="checkout-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-adults" className="font-label-md text-label-sm text-on-surface-variant">
                        Adults (12+ yrs)
                      </label>
                      <select
                        id="checkout-adults"
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      >
                        <option value={1}>1 Adult</option>
                        <option value={2}>2 Adults</option>
                        <option value={3}>3 Adults</option>
                        <option value={4}>4+ Adults</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-children" className="font-label-md text-label-sm text-on-surface-variant">
                        Children (2-11 yrs)
                      </label>
                      <select
                        id="checkout-children"
                        value={children}
                        onChange={(e) => setChildren(Number(e.target.value))}
                        className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      >
                        <option value={0}>0 Children</option>
                        <option value={1}>1 Child</option>
                        <option value={2}>2 Children</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="checkout-date" className="font-label-md text-label-sm text-on-surface-variant">
                        Preferred Start Date
                      </label>
                      <input
                        id="checkout-date"
                        type="date"
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
                      Review Your Details
                    </h1>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="inline-flex items-center gap-1.5 text-terracotta font-label-md text-label-md hover:opacity-80 transition-opacity"
                    >
                      <PencilSimple size={16} />
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Full Name
                      </p>
                      <p className="font-label-md text-on-surface">{fullName || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Email
                      </p>
                      <p className="font-label-md text-on-surface">{email || '—'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Travelers
                      </p>
                      <p className="font-label-md text-on-surface">
                        {adults} adult{adults !== 1 ? 's' : ''}
                        {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Preferred Start Date
                      </p>
                      <p className="font-label-md text-on-surface">{preferredDate || 'Flexible'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Package
                      </p>
                      <p className="font-label-md text-on-surface">{safari.title}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                        Duration
                      </p>
                      <p className="font-label-md text-on-surface">{safari.days} days</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="mt-8 inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div>
                  <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                    Payment Option
                  </h1>
                  <p className="text-on-surface-variant mb-8">Choose how you&apos;d like to pay your deposit.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() => setPayment('card')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        payment === 'card' ? 'border-2 border-savanna-green bg-savanna-green/5' : 'border-2 border-sand-stone hover:border-outline'
                      }`}
                    >
                      <CreditCard size={22} className="text-savanna-green" />
                      <span className="font-label-md text-label-md text-on-surface">Credit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayment('transfer')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        payment === 'transfer' ? 'border-2 border-savanna-green bg-savanna-green/5' : 'border-2 border-sand-stone hover:border-outline'
                      }`}
                    >
                      <Bank size={22} className="text-savanna-green" />
                      <span className="font-label-md text-label-md text-on-surface">Bank Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayment('mobile')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        payment === 'mobile' ? 'border-2 border-savanna-green bg-savanna-green/5' : 'border-2 border-sand-stone hover:border-outline'
                      }`}
                    >
                      <DeviceMobile size={22} className="text-savanna-green" />
                      <span className="font-label-md text-label-md text-on-surface">Mobile Money</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('review')}
                    className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>
                </div>
              )}

            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 py-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <ShieldCheck size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Certified Operator</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Leaf size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Eco-Tourism</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Lock size={18} className="text-savanna-green" />
                <span className="text-label-sm font-label-sm uppercase">Secure Checkout</span>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-sand-stone sticky top-24">
              <div className="h-44 relative">
                <img src={safari.image} alt={safari.imageAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/70 to-transparent flex items-end p-5">
                  <h2 className="font-headline-md text-[20px] text-ivory-base leading-tight">{safari.title}</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <CalendarBlank size={16} /> Duration
                    </span>
                    <span className="font-label-md text-on-surface">{safari.days} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <MapPin size={16} /> Location
                    </span>
                    <span className="font-label-md text-on-surface">{safari.destination}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant flex items-center gap-2">
                      <Users size={16} /> Guests
                    </span>
                    <span className="font-label-md text-on-surface">
                      {adults} adult{adults !== 1 ? 's' : ''}
                      {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
                    </span>
                  </div>
                </div>

                <hr className="border-sand-stone" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>
                      {adults} adult{adults !== 1 ? 's' : ''} × ${safari.price.toLocaleString()}
                    </span>
                    <span>${(safari.price * adults).toLocaleString()}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-on-surface-variant">
                      <span>
                        {children} child{children !== 1 ? 'ren' : ''} × ${(safari.price * 0.5).toLocaleString()}
                      </span>
                      <span>${(safari.price * 0.5 * children).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-sand-stone">
                  <span className="font-label-md text-label-md text-on-surface-variant">TOTAL</span>
                  <span className="font-headline-md text-[28px] text-savanna-green">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-label-md text-label-md text-terracotta">
                  <span>Deposit due now (30%)</span>
                  <span>${deposit.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary py-4 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-lg shadow-savanna-green/20"
                >
                  {step === 'payment' ? 'Complete Booking' : step === 'review' ? 'Continue to Payment' : 'Continue to Review'}
                  <ArrowRight size={18} weight="bold" />
                </button>
                <p className="text-center text-label-sm text-on-surface-variant px-2">
                  By clicking &apos;{step === 'payment' ? 'Complete Booking' : 'Continue'}&apos;, you agree to our
                  Terms of Service and Cancellation Policy.
                </p>
              </div>
            </div>

            <div className="mt-6 p-6 bg-terracotta/5 border border-terracotta/20 rounded-xl flex gap-4">
              <Info size={22} className="text-terracotta shrink-0" />
              <div>
                <h4 className="font-label-md text-label-md text-terracotta mb-1">Need Help?</h4>
                <p className="text-sm text-on-surface-variant mb-1">
                  Our safari experts are available 24/7 to assist with your booking.
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
