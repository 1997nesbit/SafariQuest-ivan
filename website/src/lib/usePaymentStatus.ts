import { useEffect, useState } from 'react'
import { getPaymentStatus, type PaymentStatus } from '../api/bookings'

// Snippe's docs suggest polling every 2–3 seconds. After MAX_POLLS the page stops and
// says so; the payment still lands on the dashboard once Snippe's webhook arrives.
const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 40

/** Polls a payment the tourist has just come back from Snippe's checkout for, until it
 * settles. Pass nulls (no `?booking=&payment=` in the URL) and it does nothing. */
export function usePaymentStatus(bookingId: number | null, paymentId: number | null) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null)
  const [gaveUp, setGaveUp] = useState(false)

  useEffect(() => {
    if (bookingId === null || paymentId === null) return
    let cancelled = false
    let polls = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    async function poll() {
      polls += 1
      try {
        const result = await getPaymentStatus(bookingId!, paymentId!)
        if (cancelled) return
        setPayment(result)
        if (result.status !== 'pending') return
      } catch {
        // A transient error is just another pending poll.
      }
      if (cancelled) return
      if (polls >= MAX_POLLS) {
        setGaveUp(true)
        return
      }
      timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [bookingId, paymentId])

  return { payment, gaveUp }
}

/** Reads `?booking=&payment=` — the query Snippe's redirect brings the tourist back with. */
export function paymentReturnParams(search: string): { bookingId: number | null; paymentId: number | null } {
  const params = new URLSearchParams(search)
  const bookingId = Number(params.get('booking'))
  const paymentId = Number(params.get('payment'))
  return {
    bookingId: Number.isInteger(bookingId) && bookingId > 0 ? bookingId : null,
    paymentId: Number.isInteger(paymentId) && paymentId > 0 ? paymentId : null,
  }
}
