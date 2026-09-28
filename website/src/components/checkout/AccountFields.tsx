import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserCircle } from '@phosphor-icons/react'
import { PasswordInput } from '../PasswordInput'

export type AccountMode = 'register' | 'signin'

/** New-account vs sign-in fields shared by every "must have an account before you can
 * pay" checkout flow (direct safari checkout, Trip Curator). The register/login calls
 * themselves stay in the page — this only owns the form fields. */
export function AccountFields({
  accountMode,
  onAccountModeChange,
  email,
  password,
  onPasswordChange,
  signInEmail,
  onSignInEmailChange,
  onEditDetails,
}: {
  accountMode: AccountMode
  onAccountModeChange: (mode: AccountMode) => void
  email: string
  password: string
  onPasswordChange: (value: string) => void
  signInEmail: string
  onSignInEmailChange: (value: string) => void
  onEditDetails: () => void
}) {
  const { t } = useTranslation('booking')
  // Confirmation only matters for this form's validity, so it stays local — the pages
  // only ever need the one password. The custom validity message blocks native form submit.
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordsMismatch = confirmPassword !== '' && confirmPassword !== password
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-6 p-1 bg-surface-container-low rounded-lg w-full sm:w-fit">
        <button
          type="button"
          onClick={() => onAccountModeChange('register')}
          className={`px-4 py-2.5 sm:py-2 rounded-md font-label-md text-label-sm transition-colors min-h-[44px] sm:min-h-0 ${
            accountMode === 'register' ? 'bg-surface-container-lowest shadow-sm text-savanna-green' : 'text-on-surface-variant'
          }`}
        >
          {t('account.newCustomer')}
        </button>
        <button
          type="button"
          onClick={() => onAccountModeChange('signin')}
          className={`px-4 py-2.5 sm:py-2 rounded-md font-label-md text-label-sm transition-colors min-h-[44px] sm:min-h-0 ${
            accountMode === 'signin' ? 'bg-surface-container-lowest shadow-sm text-savanna-green' : 'text-on-surface-variant'
          }`}
        >
          {t('account.alreadyHaveAccount')}
        </button>
      </div>

      {accountMode === 'register' ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-lg">
            <UserCircle size={20} className="text-savanna-green shrink-0 mt-0.5" />
            <p className="font-body-md text-[13px] text-on-surface-variant">
              {t('account.creatingAccountFor')} <strong className="text-on-surface">{email || t('account.yourEmail')}</strong>. {t('account.notYou')}{' '}
              <button type="button" onClick={onEditDetails} className="text-savanna-green underline">{t('account.editYourDetails')}</button>.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="account-password" className="font-label-md text-label-sm text-on-surface-variant">
              {t('account.choosePassword')}
            </label>
            <PasswordInput
              id="account-password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={t('account.passwordPlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="account-password-confirm" className="font-label-md text-label-sm text-on-surface-variant">
              {t('account.confirmPassword')}
            </label>
            <PasswordInput
              id="account-password-confirm"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              customValidity={confirmPassword !== password ? t('account.passwordsDontMatch') : ''}
              aria-invalid={passwordsMismatch}
              aria-describedby={passwordsMismatch ? 'account-password-confirm-error' : undefined}
            />
            {passwordsMismatch && (
              <p id="account-password-confirm-error" role="alert" className="text-error font-label-sm text-label-sm">
                {t('account.passwordsDontMatch')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="account-signin-email" className="font-label-md text-label-sm text-on-surface-variant">
              {t('account.emailAddress')}
            </label>
            <input
              id="account-signin-email"
              required
              type="email"
              value={signInEmail}
              onChange={(e) => onSignInEmailChange(e.target.value)}
              placeholder={t('account.emailPlaceholder')}
              className="min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="account-signin-password" className="font-label-md text-label-sm text-on-surface-variant">
              {t('account.password')}
            </label>
            <PasswordInput
              id="account-signin-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
