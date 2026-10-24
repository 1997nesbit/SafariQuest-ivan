/** Tanzanian mobile numbers, for the phone field's live hint. Mirrors the backend's
 * bookings/mobile_numbers.py, which is what actually decides — change one, change both. */

export type MobileNetwork = 'mpesa' | 'airtel' | 'mixx' | 'halotel'

export const NETWORK_LABELS: Record<MobileNetwork, string> = {
  mpesa: 'M-Pesa',
  airtel: 'Airtel Money',
  mixx: 'Mixx by Yas',
  halotel: 'Halotel',
}

// By the two digits after the leading 0. TTCL's 073 (T-Pesa) isn't offered by Snippe.
const PREFIX_NETWORKS: Record<string, MobileNetwork> = {
  '61': 'halotel',
  '62': 'halotel',
  '65': 'mixx',
  '67': 'mixx',
  '71': 'mixx',
  '77': 'mixx',
  '68': 'airtel',
  '69': 'airtel',
  '78': 'airtel',
  '74': 'mpesa',
  '75': 'mpesa',
  '76': 'mpesa',
}

/** The nine digits after 255 / 0, or null if this isn't a complete Tanzanian mobile number. */
function subscriberDigits(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('255')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.length === 9 && /^[67]/.test(digits) ? digits : null
}

export function isValidMobileNumber(raw: string): boolean {
  return subscriberDigits(raw) !== null
}

/** The network a complete number is on, or null (incomplete, or a network Snippe doesn't take). */
export function networkFor(raw: string): MobileNetwork | null {
  const digits = subscriberDigits(raw)
  return digits ? (PREFIX_NETWORKS[digits.slice(0, 2)] ?? null) : null
}

/** Whether a direct payment's prompt can be sent to this number. */
export function canPayWith(raw: string): boolean {
  return networkFor(raw) !== null
}
