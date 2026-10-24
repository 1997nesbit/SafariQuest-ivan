import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Currency } from './money'

const STORAGE_KEY = 'safariquest.currency'

interface CurrencyPreference {
  /** The currency catalog prices are shown in, and checkout starts in. */
  currency: Currency
  setCurrency: (currency: Currency) => void
}

const CurrencyContext = createContext<CurrencyPreference | null>(null)

/** A first visit's best guess: TZS for someone browsing from Tanzania — East Africa
 * time, or a browser locale for Tanzania (sw-TZ, en-TZ) — and USD for everyone else,
 * Swahili speakers in Kenya or Uganda included. Only a
 * starting point: the header toggle and the checkout choice both override it. */
function browserDefaultCurrency(): Currency {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zone === 'Africa/Dar_es_Salaam') return 'TZS'
  } catch {
    // no Intl time zone support: fall through to the locale
  }
  const locales = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  const tanzanian = locales.some((locale) => /-TZ$/i.test(locale ?? ''))
  return tanzanian ? 'TZS' : 'USD'
}

function storedCurrency(): Currency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'TZS' || saved === 'USD') return saved
  } catch {
    // storage blocked (private mode, sandboxed preview): guess every visit instead
  }
  return browserDefaultCurrency()
}

/** The visitor's currency, remembered between visits once they pick one. It sets the
 * catalog prices and the checkout's "Pay in" choice — choosing at checkout updates it
 * too, so the header toggle and the checkout never disagree. Each booking still
 * records the currency it was made in. */
export function CurrencyProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [currency, setCurrencyState] = useState<Currency>(storedCurrency)
  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not remembered — the choice still applies for this visit
    }
  }, [])
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency])
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the hook with its provider is intentional
export function useDisplayCurrency(): CurrencyPreference {
  const value = useContext(CurrencyContext)
  if (!value) throw new Error('useDisplayCurrency must be used inside CurrencyProvider')
  return value
}
