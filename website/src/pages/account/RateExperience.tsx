import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, PaperPlaneTilt, SealCheck, Star } from '@phosphor-icons/react'
import { myTrips } from '../../data/myTrips'

function StarPicker({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n !== 1 ? 's' : ''}`}>
          <Star
            size={size}
            weight={n <= value ? 'fill' : 'regular'}
            className={n <= value ? 'text-golden-sun' : 'text-outline-variant'}
          />
        </button>
      ))}
    </div>
  )
}

export function RateExperience() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = myTrips.find((t) => t.id === tripId)
  const navigate = useNavigate()

  const [guideRating, setGuideRating] = useState(0)
  const [overallRating, setOverallRating] = useState(0)
  const [testimonial, setTestimonial] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!trip) {
    return (
      <div className="text-center py-20">
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Trip Not Found</h1>
        <Link to="/account" className="text-savanna-green font-label-md">
          Back to My Trips
        </Link>
      </div>
    )
  }

  return (
    <div>
      {submitted ? (
          <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-sm">
            <CheckCircle size={48} weight="fill" className="text-savanna-green mx-auto mb-4" />
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-3">Thank you!</h1>
            <p className="text-on-surface-variant mb-8">
              Your review helps other travelers and means a lot to {trip.guide.name}.
            </p>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="min-h-[44px] bg-savanna-green text-on-primary px-8 py-3 rounded-full font-label-md hover:opacity-90 transition-opacity"
            >
              Back to My Trips
            </button>
          </div>
        ) : (
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
          >
            <div className="text-center">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-savanna-green mb-3">
                How was your safari?
              </h1>
              <p className="text-on-surface-variant">
                Thank you for choosing Pande Wilderness Safari. We'd love to hear about your adventure!
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative shrink-0">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVAnstwi92aQfMckYJ4pl7wJiy5yvO_7_N-qEjOKnJ3hCMlsXTyFggdbRekAK2kIx2QUeuv49_t1UlPsXMMm18oHfQMA5JlajyrH4BlBE7XsubpKj2M0TJNv22AArdA7EtWneJr6T4h7QJjCNF8ixKqTUQGR-Y0QbE-yntIUfF83uiAI0k_adPKpKFPJB_-NysQbNR0kQofmDGdCbKHjnN20WvqdnxL8hf4Fly6tSBlz-moDq7PrsE"
                    alt={`${trip.guide.name} portrait`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-surface-container-low shadow-sm"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-savanna-green text-on-primary p-2 rounded-full shadow-sm">
                    <SealCheck size={14} weight="fill" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <span className="font-label-sm text-label-sm text-terracotta uppercase tracking-wider">
                    Your Lead Guide
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{trip.guide.name}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">
                    How would you rate {trip.guide.name.split(' ')[0]}'s knowledge, hospitality, and overall guidance
                    during your trip?
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-on-surface-variant text-xs">Tap to rate</span>
                  <StarPicker value={guideRating} onChange={setGuideRating} />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-6 md:p-8 shadow-sm flex flex-col items-center text-center gap-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Overall Experience</h3>
              <p className="text-on-surface-variant text-sm">
                From booking to departure, how was your journey with Pande Wilderness?
              </p>
              <StarPicker value={overallRating} onChange={setOverallRating} size={36} />
            </div>

            <div>
              <label htmlFor="testimonial" className="block font-label-md text-label-md text-on-surface mb-2">
                Share Your Memories
              </label>
              <p className="text-on-surface-variant text-sm mb-3">
                Tell us about your favorite moments, any feedback for improvement, or a testimonial we can share.
              </p>
              <textarea
                id="testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                rows={5}
                required
                placeholder="The sunrise over the Serengeti was..."
                className="w-full bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green resize-y"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guideRating === 0 || overallRating === 0}
                className="min-h-[44px] inline-flex items-center gap-2 bg-savanna-green text-on-primary px-8 py-4 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Review
                <PaperPlaneTilt size={18} />
              </button>
            </div>
          </form>
        )}
    </div>
  )
}
