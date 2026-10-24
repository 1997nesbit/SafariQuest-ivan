import { CURRENCIES } from '../lib/money'
import { useDisplayCurrency } from '../lib/currencyPreference'

/** TZS / USD toggle beside the language switcher. Sets which currency catalog prices
 * show in; each booking still picks its own currency at checkout. */
export function CurrencySwitcher({ variant = 'desktop' }: Readonly<{ variant?: 'desktop' | 'mobile' }>) {
  const { currency, setCurrency } = useDisplayCurrency()

  if (variant === 'mobile') {
    return (
      <div className="border-t border-surface-variant mt-1 pt-4">
        <span className="font-label-md text-label-md text-on-surface-variant px-2 mb-2 block">Currency</span>
        <div role="group" aria-label="Currency" className="flex gap-2 px-2">
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              aria-pressed={code === currency}
              className={`font-label-md text-label-md min-h-[44px] px-4 rounded-lg ${
                code === currency
                  ? 'bg-surface-container-low text-savanna-green'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Same 36px height and round outline as the language button beside it.
  return (
    <div
      role="group"
      aria-label="Currency"
      title="Currency"
      className="flex items-center h-9 p-0.5 rounded-full border border-sand-stone shrink-0"
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={code === currency}
          className={`h-full px-2.5 rounded-full text-xs font-label-md tracking-wide transition-colors ${
            code === currency ? 'bg-savanna-green text-on-primary' : 'text-on-surface-variant hover:text-savanna-green'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
