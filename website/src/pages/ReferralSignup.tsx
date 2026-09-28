import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Buildings, HandCoins, Handshake, Suitcase, UsersThree } from '@phosphor-icons/react'
import { activateReferralAgent, getPublicReferralSettings, registerAgent } from '../api/referrals'
import { useAuth } from '../auth/AuthContext'
import { PasswordInput } from '../components/PasswordInput'
import { ApiError } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { Link as LocalizedLink } from '../i18n/routing'

const AUDIENCES = [
  { icon: Buildings, label: 'Hotels & lodges' },
  { icon: Suitcase, label: 'Travel agents & tour operators' },
  { icon: UsersThree, label: 'Past Pande travellers' },
  { icon: Handshake, label: 'Anyone with friends who love to travel' },
]

/** "180 days" reads oddly for the long windows admins set, so round to months/years. */
function formatValidity(days: number): string {
  if (days >= 365 && days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`
  if (days >= 30) {
    const months = Math.round(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  }
  return days === 1 ? '1 day' : `${days} days`
}

export function ReferralSignup() {
  const navigate = useNavigate()
  const { user, isLoading, refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { data: rates } = useFetch(getPublicReferralSettings, [])

  // Signed-in tourists don't re-register: the agent profile is switched on for the
  // account they already have, so trips and referrals share one login.
  async function handleActivate() {
    setError(null)
    setSubmitting(true)
    try {
      await activateReferralAgent()
      await refreshUser()
      navigate('/agent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '')
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    if (password !== String(form.get('confirmPassword') ?? '')) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    try {
      await registerAgent({ name, email, password })
      await refreshUser()
      navigate('/agent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.isReferralAgent) {
    return <Navigate to="/agent" replace />
  }

  return (
    <section className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-16 md:py-24 bg-surface-container-low">
      <div className="w-full max-w-md bg-ivory-base rounded-2xl shadow-[0_10px_30px_-10px_rgba(45,45,45,0.15)] px-6 sm:px-10 py-12">
        <header className="mb-8 text-center">
          <div className="w-14 h-14 rounded-full bg-savanna-green/10 flex items-center justify-center mx-auto mb-4">
            <HandCoins size={28} className="text-savanna-green" />
          </div>
          <h1 className="font-headline-md text-headline-md text-savanna-green mb-2">Become a Referral Agent</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {rates ? (
              <>
                Earn <strong className="text-savanna-green">{rates.commissionPercent}% commission</strong> on every
                safari booked with your referral code — and the traveller gets {rates.discountPercent}% off.
              </>
            ) : (
              'Earn a commission every time someone books using your referral code.'
            )}
          </p>
        </header>

        <div className="mb-8 bg-surface-container-low rounded-xl p-5">
          <p className="font-label-md text-label-sm text-on-surface mb-3">Who can join?</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIENCES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-2 text-on-surface-variant text-sm">
                <Icon size={18} className="text-savanna-green shrink-0 mt-0.5" />
                {label}
              </li>
            ))}
          </ul>
          {rates && (
            <p className="text-on-surface-variant text-xs mt-4">
              Each code stays valid for {formatValidity(rates.codeExpiryDays)} — share it once and keep earning.
            </p>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-on-surface-variant text-sm">Loading…</p>
        ) : user && user.role !== 'tourist' ? (
          <p className="text-center text-on-surface-variant text-sm bg-surface-container-low rounded-lg px-4 py-3">
            Staff and guide accounts can&rsquo;t join the referral programme. Sign out and use a personal account
            instead.
          </p>
        ) : user ? (
          <div className="space-y-5">
            <p className="text-on-surface-variant text-sm text-center">
              You&rsquo;re signed in as <strong className="text-on-surface">{user.email}</strong>. Activate your agent
              profile to start sharing referral codes. Your trips stay exactly where they are, under the same login.
            </p>
          {error && (
            <p role="alert" className="text-error font-label-sm text-label-sm">
              {error}
            </p>
          )}
            <button
              type="button"
              onClick={handleActivate}
              disabled={submitting}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Activating…' : 'Activate My Agent Profile'}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="agent-name" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Full Name
              </label>
              <input
                id="agent-name"
                name="name"
                type="text"
                placeholder="Tekla Massawe"
                required
                autoComplete="name"
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="agent-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Email Address
              </label>
              <input
                id="agent-email"
                name="email"
                type="email"
                placeholder="tekla@example.com"
                required
                autoComplete="email"
                className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
              />
            </div>
            <div>
              <label htmlFor="agent-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Create Password
              </label>
              <PasswordInput
                id="agent-password"
                name="password"
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="agent-password-confirm" className="block font-label-sm text-label-sm text-on-surface mb-2">
                Confirm Password
              </label>
              <PasswordInput
                id="agent-password-confirm"
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p role="alert" className="text-error font-label-sm text-label-sm">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Account…' : 'Create Agent Account'}
              <ArrowRight size={16} />
            </button>
          </form>
            <p className="mt-6 text-center text-on-surface-variant text-sm">
              Already have a Pande account?{' '}
              <LocalizedLink
                to="/sign-in?next=/become-agent"
                className="text-savanna-green font-label-md hover:underline"
              >
                Sign in to activate
              </LocalizedLink>
            </p>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="font-label-sm text-label-sm text-outline hover:text-savanna-green inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft size={16} /> Return to Homepage
          </Link>
        </div>
      </div>
    </section>
  )
}
