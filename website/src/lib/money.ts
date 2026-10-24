/** The site's two currencies (backend bookings/currency.py). A booking is priced and paid
 * in one of them — TZS by mobile money through Snippe, USD by card through Senjaropay —
 * and amounts in different currencies are never added together. */
export type Currency = 'TZS' | 'USD'

export const CURRENCIES: readonly Currency[] = ['TZS', 'USD']

/** "TZS 2,000" / "USD 3,400" — grouped for the reader's locale, whole units only. */
export function formatMoney(amount: number, locale?: string, currency: Currency = 'TZS'): string {
  return `${currency} ${Math.round(amount).toLocaleString(locale)}`
}

/** An amount per currency, for totals that span bookings in both. */
export type MoneyTotals = Record<Currency, number>

export function emptyTotals(): MoneyTotals {
  return { TZS: 0, USD: 0 }
}

/** Adds each item's amount into its own currency's total. */
export function sumByCurrency<T>(items: readonly T[], amount: (item: T) => number, currency: (item: T) => Currency): MoneyTotals {
  const totals = emptyTotals()
  for (const item of items) totals[currency(item)] += amount(item)
  return totals
}

/** "TZS 1,200,000 · USD 4,500" — only the currencies with something in them; "TZS 0"
 * when neither has. */
export function formatTotals(totals: MoneyTotals, locale?: string): string {
  const parts = CURRENCIES.filter((c) => totals[c] !== 0).map((c) => formatMoney(totals[c], locale, c))
  return parts.length > 0 ? parts.join(' · ') : formatMoney(0, locale, 'TZS')
}

interface Priced {
  price: number
  priceUsd: number | null
}

/** A product's per-adult price in `currency`, or null when it has none (USD is optional). */
export function productPrice(product: Priced, currency: Currency): number | null {
  return currency === 'TZS' ? product.price : product.priceUsd
}

/** A product's price for display in the visitor's preferred currency — in TZS instead
 * when it has no USD price, since every product has a TZS one. */
export function formatProductPrice(product: Priced, currency: Currency, locale?: string): string {
  const amount = productPrice(product, currency)
  return amount === null ? formatMoney(product.price, locale, 'TZS') : formatMoney(amount, locale, currency)
}
