import { useTranslation } from 'react-i18next'
import { DeviceMobile } from '@phosphor-icons/react'
import { NETWORK_LABELS, isValidMobileNumber, networkFor } from '../../lib/mobileNumbers'

/** The mobile money number a direct payment's prompt goes to, with the network shown as
 * soon as the number is complete. Only a hint — the server checks the number again and
 * knows about outages. */
export function PhoneNumberField({
  id,
  value,
  onChange,
  disabled,
}: Readonly<{ id: string; value: string; onChange: (value: string) => void; disabled?: boolean }>) {
  const { t } = useTranslation('booking')
  const network = networkFor(value)
  const complete = isValidMobileNumber(value)

  let hint = t('mobilePay.phoneHint')
  let hintClass = 'text-on-surface-variant'
  if (network) {
    hint = t('mobilePay.networkDetected', { network: NETWORK_LABELS[network] })
    hintClass = 'text-savanna-green'
  } else if (complete) {
    hint = t('mobilePay.unsupportedNetwork')
    hintClass = 'text-error'
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-label-md text-label-sm text-on-surface-variant">
        {t('mobilePay.phoneLabel')}
      </label>
      <div className="relative">
        <DeviceMobile size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          disabled={disabled}
          placeholder={t('mobilePay.phonePlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={`${id}-hint`}
          className="w-full min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green disabled:opacity-60"
        />
      </div>
      <p id={`${id}-hint`} className={`text-sm ${hintClass}`}>
        {hint}
      </p>
    </div>
  )
}
