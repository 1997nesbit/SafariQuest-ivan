/** The site's one currency. Prices, invoices and Snippe charges are all whole Tanzanian
 * shillings — the backend stores plain integers and charges them as TZS
 * (backend SNIPPE_CURRENCY), so this is the only place the currency is named. */
export const CURRENCY = 'TZS'

/** "TZS 2,000" — grouped for the reader's locale, no decimals (shillings have none in use). */
export function formatMoney(amount: number, locale?: string): string {
  return `${CURRENCY} ${Math.round(amount).toLocaleString(locale)}`
}
