import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeSlash } from '@phosphor-icons/react'

/** Password field with a show/hide toggle, so people can check what they typed —
 * especially when creating a password, where a typo locks them out of the new account.
 * `customValidity` (e.g. "passwords don't match") feeds native form validation, so a
 * non-empty message blocks submit without the parent page wiring anything up. */
export function PasswordInput({
  className = '',
  customValidity = '',
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { customValidity?: string }) {
  const { t } = useTranslation('auth')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.setCustomValidity(customValidity)
  }, [customValidity])

  return (
    <div className="relative">
      <input
        {...inputProps}
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        className={`w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 pr-11 focus:outline-none focus:ring-1 focus:ring-savanna-green ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('signIn.hidePassword') : t('signIn.showPassword')}
        aria-pressed={visible}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
      >
        {visible ? <Eye size={20} /> : <EyeSlash size={20} />}
      </button>
    </div>
  )
}
