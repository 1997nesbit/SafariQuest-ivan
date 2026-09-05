import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react'
import { useAuth } from '../auth/AuthContext'
import { ROLE_HOME } from '../api/auth'
import { ApiError } from '../lib/api'

export function SetPassword() {
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setPassword } = useAuth()

  const linkLooksValid = uid.length > 0 && token.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    setSubmitting(true)
    try {
      const role = await setPassword(uid, token, password)
      navigate(ROLE_HOME[role] ?? '/account')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-16 bg-surface-container-low">
      <div className="w-full max-w-md bg-ivory-base rounded-2xl p-8 md:p-10 shadow-[0_10px_30px_-10px_rgba(45,45,45,0.15)]">
        <h1 className="font-headline-md text-headline-md text-savanna-green mb-2">Set Your Password</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          Choose a password to finish setting up your SafariQuest account.
        </p>

        {!linkLooksValid ? (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            This link is missing information. Please use the link from your invite email.
          </p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="new-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-error font-label-sm text-label-sm">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Set Password'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/sign-in" className="font-label-sm text-label-sm text-outline hover:text-savanna-green">
            Back to Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}
