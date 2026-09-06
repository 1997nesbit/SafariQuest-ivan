import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaretRight, PencilSimple, SealCheck, Star, UploadSimple, SignOut, Question } from '@phosphor-icons/react'
import { GuideTopBar } from '../../components/guide/GuideTopBar'
import { GuideBottomNav } from '../../components/guide/GuideBottomNav'
import { guideRatingSummary } from '../../data/guideReviews'
import { useAuth } from '../../auth/AuthContext'

const AVAILABILITY_OPTIONS = ['Available', 'On Trip', 'Off-Duty'] as const
type Availability = (typeof AVAILABILITY_OPTIONS)[number]

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const LANGUAGES = ['Swahili', 'English', 'French', 'German']
const SPECIALTIES = ['Big Cat Tracking', 'Bird Watching', 'Photography Safaris', 'Cultural Visits']
const CERTIFICATIONS = [
  { title: 'Tanzania Tourist Board License', validUntil: 'Valid until Jun 2027' },
  { title: 'Wilderness First Responder', validUntil: 'Valid until Feb 2027' },
]

export function GuideProfile() {
  const [availability, setAvailability] = useState<Availability>('On Trip')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || user?.email || 'Guide'

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface-bright">
      <GuideTopBar
        title="My Profile"
        right={
          <button type="button" aria-label="Edit profile" className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-colors">
            <PencilSimple size={20} />
          </button>
        }
      />

      <main className="pt-20 pb-28 px-5 max-w-lg mx-auto min-h-screen">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center text-3xl font-headline-md text-on-surface-variant border-4 border-surface-container-lowest shadow-sm">
            {initials(displayName)}
          </div>
          <h2 className="font-headline-md text-[22px] text-on-surface mt-4">{displayName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
              Senior Guide
            </span>
          </div>
          <Link to="/guide/reviews" className="flex items-center gap-1 mt-2 text-golden-sun">
            <Star size={18} weight="fill" />
            <span className="font-label-md text-on-surface">{guideRatingSummary.average}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant underline">{guideRatingSummary.total} reviews</span>
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Availability</h3>
          <div className="flex gap-2">
            {AVAILABILITY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAvailability(option)}
                className={`flex-1 py-2 rounded-full font-label-sm text-label-sm transition-colors ${
                  availability === option ? 'bg-golden-sun text-on-secondary-fixed-variant font-bold' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
            Auto-set to "On Trip" while an assigned trip is in progress.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Bio</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            10+ years leading safaris across the Serengeti ecosystem. Fluent in Swahili, English and French. Passionate
            about big-cat tracking and sustainable tourism.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <span key={lang} className="font-label-sm text-label-sm bg-surface-container text-on-surface px-3 py-1.5 rounded-full">
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES.map((s) => (
              <span
                key={s}
                className="font-label-sm text-label-sm bg-primary-fixed-dim/20 text-on-primary-fixed-variant px-3 py-1.5 rounded-full border border-primary-fixed-dim/30"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant/50 mb-4">
          <h3 className="font-label-md text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Certifications</h3>
          <div className="space-y-3">
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.title} className="flex items-center gap-3">
                <SealCheck size={22} weight="fill" className="text-savanna-green shrink-0" />
                <div className="flex-1">
                  <p className="font-label-md text-on-surface">{cert.title}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{cert.validUntil}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-outline-variant rounded-lg py-2.5 text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-md text-label-md"
          >
            <UploadSimple size={20} />
            Add Certification
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Link
            to="/guide/support"
            className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-surface-variant/50"
          >
            <span className="flex items-center gap-3 font-label-md text-on-surface">
              <Question size={20} className="text-on-surface-variant" />
              Support
            </span>
            <CaretRight size={20} className="text-on-surface-variant" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-error/30 text-error font-label-md text-label-md"
          >
            <SignOut size={20} />
            Sign Out
          </button>
        </div>
      </main>

      <GuideBottomNav active="profile" />
    </div>
  )
}
