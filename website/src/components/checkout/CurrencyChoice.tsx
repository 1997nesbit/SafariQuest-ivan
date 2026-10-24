import { useTranslation } from 'react-i18next'
import type { Currency } from '../../lib/money'
import { UsdComingSoonNotice } from './UsdComingSoonNotice'

/** "Pay in TZS / USD" on the checkout pages. The choice prices the whole booking and
 * decides the provider: TZS is mobile money through Snippe, USD is card through
 * Senjaropay. USD is offered only when the trip has a USD price. */
export function CurrencyChoice({
  name,
  value,
  onChange,
  usdPriced,
  usdPayable,
}: Readonly<{
  name: string
  value: Currency
  onChange: (currency: Currency) => void
  /** Whether this trip has a USD price at all. */
  usdPriced: boolean
  /** Whether USD can be paid online yet (Senjaropay connected). */
  usdPayable: boolean
}>) {
  const { t } = useTranslation('booking')
  const options: { code: Currency; label: string; hint: string; disabled: boolean }[] = [
    { code: 'TZS', label: t('currencyChoice.tzs'), hint: t('currencyChoice.tzsHint'), disabled: false },
    {
      code: 'USD',
      label: t('currencyChoice.usd'),
      hint: usdPayable ? t('currencyChoice.usdHint') : t('currencyChoice.usdHintSoon'),
      disabled: !usdPriced,
    },
  ]
  return (
    <fieldset className="space-y-2">
      <legend className="font-label-md text-label-sm text-on-surface-variant mb-2">{t('currencyChoice.label')}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <label
            key={option.code}
            className={`flex items-start gap-3 rounded-lg border p-3 min-h-[44px] ${
              value === option.code ? 'border-savanna-green bg-savanna-green/5' : 'border-sand-stone'
            } ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name={name}
              value={option.code}
              checked={value === option.code}
              disabled={option.disabled}
              onChange={() => onChange(option.code)}
              className="mt-1 accent-savanna-green"
            />
            <span>
              <span className="block font-label-md text-on-surface">{option.label}</span>
              <span className="block text-sm text-on-surface-variant">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
      {!usdPriced && <p className="text-sm text-on-surface-variant">{t('currencyChoice.usdNoPrice')}</p>}
      {/* Said as soon as USD is picked, not only at the last step after signing in. */}
      {value === 'USD' && !usdPayable && (
        <div className="pt-2">
          <UsdComingSoonNotice onSwitchToTzs={() => onChange('TZS')} />
        </div>
      )}
    </fieldset>
  )
}
