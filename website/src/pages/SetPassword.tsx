import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from '@phosphor-icons/react'
import { Link } from '../i18n/routing'
import { useHomeNavigate } from '../i18n/useLocale'
import { useAuth } from '../auth/AuthContext'
import { PasswordInput } from '../components/PasswordInput'
import { ApiError } from '../lib/api'

export function SetPassword() {
  const { t } = useTranslation('auth')
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigateHome = useHomeNavigate()
  const { setPassword } = useAuth()

  const linkLooksValid = uid.length > 0 && token.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    if (password !== String(form.get('confirmPassword') ?? '')) {
      setError(t('setPassword.passwordsDontMatch'))
      return
    }
    setSubmitting(true)
    try {
      navigateHome(await setPassword(uid, token, password))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('setPassword.somethingWentWrong'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-16 bg-surface-container-low">
      <div className="w-full max-w-md bg-ivory-base rounded-2xl p-8 md:p-10 shadow-[0_10px_30px_-10px_rgba(45,45,45,0.15)]">
        <h1 className="font-headline-md text-headline-md text-savanna-green mb-2">{t('setPassword.heading')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">
          {t('setPassword.subtitle')}
        </p>

        {!linkLooksValid ? (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {t('setPassword.invalidLink')}
          </p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="new-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
                {t('setPassword.newPassword')}
              </label>
              <PasswordInput id="new-password" name="password" required autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block font-label-sm text-label-sm text-on-surface mb-2">
                {t('setPassword.confirmPassword')}
              </label>
              <PasswordInput id="confirm-password" name="confirmPassword" required autoComplete="new-password" />
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
              {submitting ? t('setPassword.saving') : t('setPassword.submit')}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/sign-in" className="font-label-sm text-label-sm text-outline hover:text-savanna-green">
            {t('setPassword.backToSignIn')}
          </Link>
        </div>
      </div>
    </section>
  )
}
