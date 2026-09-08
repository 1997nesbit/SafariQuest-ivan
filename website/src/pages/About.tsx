import { useState, type FormEvent } from 'react'
import { Leaf, Handshake, SealCheck, WhatsappLogo, ChatCircleText } from '@phosphor-icons/react'
import { Reveal } from '../components/Reveal'
import { contact } from '../config/contact'

const VALUES = [
  {
    icon: Leaf,
    title: 'Conservation First',
    description: 'We partner with local wildlife funds to ensure our footprint is positive.',
  },
  {
    icon: Handshake,
    title: 'Community Led',
    description: '100% of our guides are locals, reinvesting in our shared heritage.',
  },
]

const STATS = [
  { value: '15+', label: 'Years Experience' },
  { value: '1,200+', label: 'Happy Travelers' },
  { value: '100%', label: 'Local Guides' },
]

const TEAM = [
  {
    name: 'Juma Mdoe',
    role: 'Senior Field Guide & Tracker',
    bio: "With over a decade of tracking experience in the Serengeti, Juma's intimate knowledge of predator behavior ensures you're always in the right place at the right time.",
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5enwguDy8qXqtZMfIG-73aAyI3euBWo3x4EDN22HTYzaDoMv2IhkJU6U6Z_r-Y3ERrwjnLaUH-Y6MZMbc7pfFrwtQVAM2aZTlZUBsqiaspB8IHAphQS5SRDKZ6XLzF5LWiByVNX8B4ckHipg5hBn8AHeRxGOw-8TQ31tD2pnv8w9n6eSjWZ-QnZAyFxS4AGzf03dyLGKySf3GbBoRsmRC_c5Tedm35c4NGC9r9iemG2YBZyna-0KM',
    imageAlt:
      'A professional portrait of Juma Mdoe, a Tanzanian safari field guide, standing against a blurred acacia woodland.',
  },
  {
    name: 'Amina Salim',
    role: 'Guest Experience Director',
    bio: 'Amina oversees every detail of your stay, from specialized dietary requirements to orchestrating surprise sundowner experiences in the bush.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB2gSq25f8PaKDrWwPErwUxswVJxrabBHpTwXuuqocSWMNhkUpFMXFIzgptK2_xYsBVXN0dZmAx-meHSEbUVy7qvGbqJfeRnI-m-M1JeMau5vmUAOkVYXfxny0nemPfj0ElZAbK2fEW7uDlUbXyW5F6eQi7ouDD_V4eCyax5kTEiZBIl5lQCKxIIYzAWcXYmQByA4sU0nA7AMPqR-p7uEtSOKS5qqto0DQvV-ON6LPH1oYTioFFR2Ns',
    imageAlt: 'A portrait of a Tanzanian safari lodge manager standing in front of an upscale canvas tent.',
  },
  {
    name: 'Elias Nyerere',
    role: 'Head Itinerary Architect',
    bio: 'Elias crafts our unique routes, ensuring you bypass the crowds to discover the most authentic and breathtaking corners of the parks.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA9vfiPiRJgglE7Ui7OQsQ2_LbiHxT_UIEqyiXlDS5ttwg9tyJY-6X58OFp0aNIp7_ZZRZGKivgQZ2YGDwYtWbGc_Wl0M1e5GxRLxdQoVykc6TiHAaiTvWDesbSEX-0-GngyIPlkZkk8iWkgyQaX6gMW2GyOT7q2KOkJzLvp3lvVYp--L3EjlkVia8fi94yMyA3CH8tXf6_kxrp76vMxdCOzpu_GKDS-3Ly4LqM9C7G67SW06dUiQbs',
    imageAlt: 'A portrait of a senior Tanzanian conservationist and route planner looking across a savanna landscape.',
  },
]

const INTERESTS = ['The Great Migration', 'Luxury Honeymoon Safari', 'Family Adventure', 'Photographic Safari']

export function About() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire up to a real backend/CRM once one exists.
    setSubmitted(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative h-[480px] md:h-[614px] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg5BIRgzqVDmehBpFEJA8lbYjauwRxJ6csIXTWJR34T4eINtkLZuaiTGAs33ctIjezztbrkTYi_Lljx_QgcuArjhckEv0C50VQ6St-MP-PFAtHryw6hyE-6cxwmPJRUzTc_TxeOZkkOJsmbmN5e4fOzE-IX5ga_th3bILhOBg6i5uOorFLdzWLFMXvXaT47qA91_eNEua1I60D9m64ZJl-qLZ7_aovcAfAtYEuMUw_Sxt3q_ag80lC"
          alt="A lone acacia tree silhouetted against a Tanzanian savanna sunrise painted in gold and ivory."
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-deep-earth/40" />
        <div className="relative z-10 text-center px-5 md:px-margin-desktop">
          <h1 className="font-display-lg text-[36px] md:text-display-lg text-ivory-base mb-6 max-w-4xl mx-auto drop-shadow-lg">
            Our Roots in the Wilderness
          </h1>
          <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-2xl mx-auto">
            Discover the passion, heritage, and unwavering commitment to conservation that drives Pande Wilderness
            Safari.
          </p>
        </div>
      </section>

      {/* Story & Values */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter lg:gap-20 items-center">
          <Reveal>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-8">
              A Legacy of Authentic Exploration
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
              For over 15 years, Pande Wilderness Safari has been more than a tour operator; we are custodians of
              the Tanzanian wilderness. Founded by local experts with a profound love for the land, our mission is
              to share the untouched beauty of Africa while fiercely protecting it for generations to come.
            </p>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              We believe in travel that enriches both the soul of the explorer and the communities that call this
              wild landscape home. Every journey we craft is a testament to our commitment to sustainable,
              low-impact, and highly authentic safari experiences.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
              {VALUES.map((value) => (
                <div key={value.title} className="flex items-start gap-4">
                  <value.icon size={30} weight="fill" className="text-savanna-green shrink-0" />
                  <div>
                    <h3 className="font-headline-md text-[20px] mb-2 text-on-surface">{value.title}</h3>
                    <p className="text-on-surface-variant">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150} className="relative h-[420px] md:h-[600px] w-full rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnKe-biQFongU_NYNWVlg6_noR6CDiiUiWStAjS2Oh14yfL8A7Zw_Ie1w1_WaEa0F6fkrEBZkHVIvbntLlEpg5qpCD-hggdprX2gnujvxNE98Rq3OjpPvJErmL33uxTYWbjnLe3xoSRuDJUPdzynCYXEeIScoPItZ1t8Kam1UT7D0pu5sXK9Q2V8r_kEhPOdKJpaOBIDQKDzzJxLZ7jkMm_iYhPZo53E8lo4F66OidyHU-xTxEVjcv"
              alt="A Tanzanian safari guide standing proudly beside an open-top Land Cruiser in the Serengeti."
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
              <Reveal key={stat.label} delay={i * 100} className="p-6">
                <div className="font-display-lg text-display-lg text-savanna-green mb-2">{stat.value}</div>
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  {stat.label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Experts */}
      <section className="py-20 md:py-section-gap px-5 md:px-margin-desktop max-w-container-max mx-auto">
        <Reveal className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
            Meet the Experts
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Our seasoned team of naturalists, trackers, and hospitality experts ensure your journey is flawless.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {TEAM.map((member, i) => (
            <Reveal
              key={member.name}
              delay={i * 100}
              className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(45,45,45,0.06)] group"
            >
              <div className="h-80 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.imageAlt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-headline-md text-[24px] text-on-surface">{member.name}</h3>
                    <p className="font-body-md text-terracotta">{member.role}</p>
                  </div>
                  {contact.social.whatsapp && (
                    <a
                      href={contact.social.whatsapp}
                      title="Contact on WhatsApp"
                      className="text-savanna-green hover:text-primary-container transition-colors flex items-center justify-center bg-surface-container-low p-2 rounded-full shrink-0"
                    >
                      <ChatCircleText size={22} weight="fill" />
                    </a>
                  )}
                </div>
                <p className="font-body-md text-on-surface-variant mt-4 line-clamp-3">{member.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Integrated Inquiry Section */}
      <section id="contact" className="bg-surface-container-low py-20 md:py-section-gap scroll-mt-24">
        <div className="max-w-container-max mx-auto px-5 md:px-margin-desktop">
          <Reveal className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(45,45,45,0.06)] p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-md text-on-surface mb-6">
                  Start Planning Your Journey
                </h2>
                <p className="font-body-md text-on-surface-variant mb-8">
                  Share a few details, and our safari experts will begin crafting your bespoke Tanzanian adventure.
                </p>
                {submitted ? (
                  <div className="flex flex-col items-center text-center py-10" role="status" aria-live="polite">
                    <SealCheck size={40} weight="fill" className="text-savanna-green mb-4" />
                    <p className="font-headline-md text-headline-md mb-2">Inquiry sent</p>
                    <p className="text-on-surface-variant">
                      Thank you — a safari specialist will reply to your email within one business day.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label htmlFor="about-name" className="block font-label-md text-label-md text-on-surface mb-2">
                        Full Name
                      </label>
                      <input
                        id="about-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="e.g. Jane Doe"
                        className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div>
                      <label htmlFor="about-email" className="block font-label-md text-label-md text-on-surface mb-2">
                        Email Address
                      </label>
                      <input
                        id="about-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="jane@example.com"
                        className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      />
                    </div>
                    <div>
                      <label htmlFor="about-interest" className="block font-label-md text-label-md text-on-surface mb-2">
                        Primary Interest
                      </label>
                      <select
                        id="about-interest"
                        name="interest"
                        className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                      >
                        {INTERESTS.map((interest) => (
                          <option key={interest}>{interest}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md text-label-md px-6 py-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Submit Inquiry
                    </button>
                  </form>
                )}
              </div>

              <div className="flex flex-col justify-center lg:border-l border-sand-stone/50 lg:pl-12">
                <div className="bg-ivory-base rounded-xl p-8 border border-sand-stone/30 relative overflow-hidden">
                  <ChatCircleText size={120} weight="fill" className="absolute top-0 right-0 p-4 text-on-surface opacity-5" />
                  <h3 className="font-headline-md text-[28px] text-on-surface mb-4 relative z-10">Prefer to Chat?</h3>
                  <p className="font-body-md text-on-surface-variant mb-8 relative z-10">
                    Speak directly with our local guides on WhatsApp. We promise a reply within 24 hours to help
                    shape your ideal itinerary.
                  </p>
                  {contact.social.whatsapp && (
                    <a
                      href={contact.social.whatsapp}
                      className="inline-flex items-center justify-center w-full bg-[#25D366] text-white font-label-md text-label-md px-6 py-4 rounded-lg hover:bg-[#128C7E] transition-colors relative z-10 shadow-sm"
                    >
                      <WhatsappLogo size={20} weight="fill" className="mr-2" />
                      Message us on WhatsApp
                    </a>
                  )}
                  <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant relative z-10">
                    <SealCheck size={20} weight="fill" className="text-golden-sun" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wider">
                      Certified Local Operator
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
