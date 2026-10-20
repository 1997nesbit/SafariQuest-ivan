/** YYYY-MM-DD for a Date, read in the browser's own timezone. (`toISOString` would give
 * the UTC date instead, which in Tanzania — UTC+3 — is the previous day until 3am.) */
function toLocalISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toLocalISODate(date)
}

/** Today as YYYY-MM-DD, for a date input's `min` so past days can't be picked. */
export function todayISO(): string {
  return toLocalISODate(new Date())
}
