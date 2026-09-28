import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Eye, EyeSlash, GoogleLogo } from '@phosphor-icons/react'
import { Link } from '../i18n/routing'
import { useHomeNavigate } from '../i18n/useLocale'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { PasswordInput } from '../components/PasswordInput'

type Tab = 'signin' | 'signup'

export function SignIn() {
  const { t } = useTranslation('auth')
  const [tab, setTab] = useState<Tab>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigateHome = useHomeNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()

  // ?next= brings people back to where they were headed (e.g. "sign in to activate your
  // agent profile" on /become-agent). Only same-site paths: an absolute or
  // protocol-relative URL here would turn the sign-in page into an open redirect.
  const nextParam = searchParams.get('next')
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\')
      ? nextParam
      : null

  function goOnward(home: string) {
    navigateHome(next ?? home)
  }

  async function handleSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    setSubmitting(true)
    try {
      goOnward(await login(email, password))
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? t('signIn.incorrectCredentials') : t('signIn.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const firstName = String(form.get('firstName') ?? '')
    const lastName = String(form.get('lastName') ?? '')
    const email = String(form.get('email') ?? '')
    setSubmitting(true)
    try {
      goOnward(await register(email, `${firstName} ${lastName}`.trim(), signUpPassword))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('signIn.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-16 md:py-24 bg-surface-container-low">
      <div className="w-full max-w-[1100px] bg-ivory-base rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(45,45,45,0.15)] flex flex-col md:flex-row">
        {/* Left: cinematic photography */}
        <div className="hidden md:block md:w-[55%] relative min-h-[640px]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdYTwk12RzNBJyshB1tJLUzkAvY1xMedMhEJYg5dzptaAiz88g3RuMECePo_BLThEgSHWWkNkwS8vG3UwAlZuuBhF1tYeuTEby6Ec3o8R0VMWsG758kDnhwykmXrPMUATE6Bvl96_1JgCKY7FanuQA-_ERCwAbtjW9sICSX-T8LGOJIDbkJ8sk9YsFgxb7SMHrTCbMEPqh5Tf13UQxNKREAjfQQmUWW9rWo-bhZhWuoYihi-6Pla3U"
            alt={t('signIn.sidebarImageAlt')}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-earth/70 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <h2 className="font-headline-lg text-headline-lg text-ivory-base mb-4 drop-shadow-md">{t('signIn.sidebarHeading')}</h2>
            <p className="font-body-lg text-body-lg text-ivory-base/90 max-w-md">
              {t('signIn.sidebarSubtitle')}
            </p>
          </div>
        </div>

        {/* Right: authentication form */}
        <div className="w-full md:w-[45%] flex flex-col justify-center px-6 sm:px-10 md:px-16 py-12">
          <header className="mb-10 text-center md:text-left">
            <h1 className="font-headline-md text-headline-md text-savanna-green mb-2">{t('signIn.brandName')}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('signIn.welcome')}</p>
          </header>

          <div className="flex gap-8 border-b border-sand-stone mb-8">
            <button
              type="button"
              onClick={() => {
                setTab('signin')
                setError(null)
              }}
              className={`pb-3 font-label-md text-label-md transition-colors ${
                tab === 'signin' ? 'text-savanna-green border-b-2 border-savanna-green' : 'text-on-surface-variant hover:text-savanna-green'
              }`}
            >
              {t('signIn.signInTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup')
                setError(null)
              }}
              className={`pb-3 font-label-md text-label-md transition-colors ${
                tab === 'signup' ? 'text-savanna-green border-b-2 border-savanna-green' : 'text-on-surface-variant hover:text-savanna-green'
              }`}
            >
              {t('signIn.createAccountTab')}
            </button>
          </div>

          {tab === 'signin' ? (
            <form className="space-y-6" onSubmit={handleSignInSubmit} noValidate>
              <div>
                <label htmlFor="signin-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                  {t('signIn.emailAddress')}
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder={t('signIn.emailPlaceholder')}
                  required
                  autoComplete="email"
                  className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="signin-password" className="block font-label-sm text-label-sm text-on-surface">
                    {t('signIn.password')}
                  </label>
                  <button type="button" className="font-label-sm text-label-sm text-terracotta hover:text-golden-sun transition-colors">
                    {t('signIn.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('signIn.hidePassword') : t('signIn.showPassword')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className="text-error font-label-sm text-label-sm -mt-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t('signIn.signingIn') : t('signIn.signInButton')}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSignUpSubmit} noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-first" className="block font-label-sm text-label-sm text-on-surface mb-2">
                    {t('signIn.firstName')}
                  </label>
                  <input
                    id="signup-first"
                    name="firstName"
                    type="text"
                    placeholder={t('signIn.firstNamePlaceholder')}
                    required
                    autoComplete="given-name"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
                <div>
                  <label htmlFor="signup-last" className="block font-label-sm text-label-sm text-on-surface mb-2">
                    {t('signIn.lastName')}
                  </label>
                  <input
                    id="signup-last"
                    name="lastName"
                    type="text"
                    placeholder={t('signIn.lastNamePlaceholder')}
                    required
                    autoComplete="family-name"
                    className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-email" className="block font-label-sm text-label-sm text-on-surface mb-2">
                  {t('signIn.emailAddress')}
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder={t('signIn.emailPlaceholder')}
                  required
                  autoComplete="email"
                  className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
                  {t('signIn.createPassword')}
                </label>
                <PasswordInput
                  id="signup-password"
                  name="password"
                  placeholder={t('signIn.createPasswordPlaceholder')}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="signup-password-confirm" className="block font-label-sm text-label-sm text-on-surface mb-2">
                  {t('signIn.confirmPassword')}
                </label>
                <PasswordInput
                  id="signup-password-confirm"
                  name="confirmPassword"
                  placeholder={t('signIn.confirmPasswordPlaceholder')}
                  required
                  autoComplete="new-password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  customValidity={signUpConfirmPassword !== signUpPassword ? t('signIn.passwordsDontMatch') : ''}
                  aria-invalid={signUpConfirmPassword !== '' && signUpConfirmPassword !== signUpPassword}
                  aria-describedby={
                    signUpConfirmPassword !== '' && signUpConfirmPassword !== signUpPassword
                      ? 'signup-password-confirm-error'
                      : undefined
                  }
                />
                {signUpConfirmPassword !== '' && signUpConfirmPassword !== signUpPassword && (
                  <p id="signup-password-confirm-error" role="alert" className="text-error font-label-sm text-label-sm mt-2">
                    {t('signIn.passwordsDontMatch')}
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="text-error font-label-sm text-label-sm">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[44px] bg-savanna-green text-on-primary font-label-md py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t('signIn.creatingAccount') : t('signIn.createAccountButton')}
              </button>
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
                {t('signIn.termsAgreement')}{' '}
                <span className="text-terracotta hover:underline cursor-pointer">{t('signIn.termsOfService')}</span> {t('signIn.and')}{' '}
                <span className="text-terracotta hover:underline cursor-pointer">{t('signIn.privacyPolicy')}</span>.
              </p>
            </form>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-sand-stone flex-1" />
            <span className="font-label-sm text-label-sm text-outline">{t('signIn.orContinueWith')}</span>
            <div className="h-px bg-sand-stone flex-1" />
          </div>

          <button
            type="button"
            disabled
            title={t('signIn.googleUnavailable')}
            className="w-full mt-8 min-h-[44px] border border-sand-stone bg-surface-container-lowest text-on-surface-variant font-label-md py-3 rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center gap-3"
          >
            <GoogleLogo size={20} />
            {t('signIn.continueWithGoogle')}
          </button>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="font-label-sm text-label-sm text-outline hover:text-savanna-green flex items-center justify-center gap-1"
            >
              <ArrowLeft size={16} /> {t('signIn.returnToHomepage')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
