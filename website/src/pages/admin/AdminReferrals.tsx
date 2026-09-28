import { useState, type FormEvent } from 'react'
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react'
import {
  getReferralRedemptions,
  getReferralSettings,
  markCommissionPaid,
  updateReferralSettings,
  type ReferralRedemption,
} from '../../api/referrals'
import { useFetch } from '../../lib/useFetch'
import { ApiError } from '../../lib/api'

const COMMISSION_BADGE: Record<'pending' | 'paid', string> = {
  pending: 'bg-golden-sun/10 text-golden-sun border border-golden-sun/20',
  paid: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
}

function SettingsCard() {
  const { data: settings, loading, refetch } = useFetch(getReferralSettings, [])
  const [discount, setDiscount] = useState('')
  const [commission, setCommission] = useState('')
  const [expiryDays, setExpiryDays] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (loading || !settings) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone mb-8">
        <p className="text-on-surface-variant text-sm">Loading settings…</p>
      </section>
    )
  }

  const discountValue = discount === '' ? settings.discountPercent : Number(discount)
  const commissionValue = commission === '' ? settings.commissionPercent : Number(commission)
  const expiryDaysValue = expiryDays === '' ? settings.codeExpiryDays : Number(expiryDays)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await updateReferralSettings({
        discountPercent: discountValue,
        commissionPercent: commissionValue,
        codeExpiryDays: expiryDaysValue,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone mb-8">
      <h2 className="font-headline-md text-[20px] text-on-surface mb-5">Referral Settings</h2>
      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="discount-percent" className="block font-label-sm text-label-sm text-on-surface mb-2">
            Tourist Discount (%)
          </label>
          <input
            id="discount-percent"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={discountValue}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-32 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <div>
          <label htmlFor="commission-percent" className="block font-label-sm text-label-sm text-on-surface mb-2">
            Agent Commission (%)
          </label>
          <input
            id="commission-percent"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={commissionValue}
            onChange={(e) => setCommission(e.target.value)}
            className="w-32 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <div>
          <label htmlFor="code-expiry-days" className="block font-label-sm text-label-sm text-on-surface mb-2">
            Code Valid For (days)
          </label>
          <input
            id="code-expiry-days"
            type="number"
            min={1}
            max={730}
            step={1}
            value={expiryDaysValue}
            onChange={(e) => setExpiryDays(e.target.value)}
            className="w-32 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-6 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saved ? <CheckCircle size={18} /> : <FloppyDisk size={18} />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-error font-label-sm text-label-sm mt-3">
          {error}
        </p>
      )}
      <p className="text-on-surface-variant text-xs mt-3">
        Code validity applies to newly generated codes; existing codes keep the expiry they were created with.
      </p>
    </section>
  )
}

export function AdminReferrals() {
  const { data: redemptions, loading, error, refetch } = useFetch(getReferralRedemptions, [])
  const [markingId, setMarkingId] = useState<number | null>(null)

  async function handleMarkPaid(redemption: ReferralRedemption) {
    setMarkingId(redemption.id)
    try {
      await markCommissionPaid(redemption.id)
      refetch()
    } finally {
      setMarkingId(null)
    }
  }

  const list = redemptions ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
          Referrals
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Agent commissions owed and the discount/commission rates applied at checkout.
        </p>
      </div>

      <SettingsCard />

      <section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
        <h2 className="font-headline-md text-[20px] text-on-surface mb-5">Redemptions</h2>
        {loading && <p className="text-on-surface-variant text-sm">Loading…</p>}
        {error && (
          <p role="alert" className="text-error font-label-sm text-label-sm">
            {error}
          </p>
        )}
        {!loading && !error && list.length === 0 && (
          <p className="text-on-surface-variant text-sm">No referral codes have been redeemed yet.</p>
        )}
        {!loading && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-sand-stone text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Booking</th>
                  <th className="py-2 pr-4">Commission</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-sand-stone last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-label-md text-on-surface">{r.agentName || r.agentEmail}</p>
                      <p className="text-on-surface-variant text-xs">{r.agentEmail}</p>
                    </td>
                    <td className="py-3 pr-4 tracking-wider">{r.code}</td>
                    <td className="py-3 pr-4">
                      <p className="font-label-md text-on-surface">{r.customerName || r.customerEmail}</p>
                      <p className="text-on-surface-variant text-xs">{r.customerEmail}</p>
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">#{r.bookingId}</td>
                    <td className="py-3 pr-4">${r.commissionAmount.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center py-1 px-2.5 rounded-md text-xs ${COMMISSION_BADGE[r.commissionStatus]}`}
                      >
                        {r.commissionStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {r.commissionStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(r)}
                          disabled={markingId === r.id}
                          className="text-savanna-green hover:opacity-80 transition-opacity font-label-md text-label-sm disabled:opacity-60"
                        >
                          {markingId === r.id ? 'Marking…' : 'Mark Paid'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
