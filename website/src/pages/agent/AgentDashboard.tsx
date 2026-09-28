import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowSquareOut, Compass, Copy, HandCoins, SignOut } from '@phosphor-icons/react'
import { generateReferralCode, getMyReferralCodes, type ReferralCode } from '../../api/referrals'
import { useFetch } from '../../lib/useFetch'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { DEFAULT_LOCALE } from '../../i18n/locales'

const STATUS_BADGE: Record<ReferralCode['status'], string> = {
  active: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
  used: 'bg-secondary-container/20 text-secondary border border-secondary-container/40',
  expired: 'bg-surface-dim text-on-surface-variant border border-outline-variant',
}

const COMMISSION_BADGE: Record<'pending' | 'paid', string> = {
  pending: 'bg-golden-sun/10 text-golden-sun border border-golden-sun/20',
  paid: 'bg-savanna-green/10 text-savanna-green border border-savanna-green/20',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AgentDashboard() {
  const { user, logout } = useAuth()
  const { data: codes, loading, error, refetch } = useFetch(getMyReferralCodes, [])
  const [contactName, setContactName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [justGenerated, setJustGenerated] = useState<ReferralCode | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGenerateError(null)
    setGenerating(true)
    try {
      const code = await generateReferralCode(contactName || undefined)
      setJustGenerated(code)
      setContactName('')
      setCopied(false)
      refetch()
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const list = codes ?? []
  const pendingCommission = list.reduce(
    (sum, c) => (c.redemption && c.redemption.commissionStatus === 'pending' ? sum + c.redemption.commissionAmount : sum),
    0,
  )
  const paidCommission = list.reduce(
    (sum, c) => (c.redemption && c.redemption.commissionStatus === 'paid' ? sum + c.redemption.commissionAmount : sum),
    0,
  )

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="bg-ivory-base border-b border-sand-stone px-5 md:px-margin-desktop py-5 flex items-center justify-between">
        <div>
          <span className="font-headline-md text-[20px] font-bold text-savanna-green">Pande Wilderness Safari</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant -mt-0.5">Referral Agent Portal</p>
        </div>
        <div className="flex items-center gap-5">
          {/* The same login is also a traveller account — trips live in the (localized)
              tourist area. The agent portal itself is unprefixed and English-only. */}
          <Link
            to={`/${DEFAULT_LOCALE}/account`}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
          >
            <Compass size={18} />
            My Trips
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-terracotta transition-colors font-label-md text-label-md"
          >
            <SignOut size={18} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 md:px-margin-desktop py-10 space-y-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
            Welcome, {user?.name || user?.email}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Generate a referral code for each contact you refer. They get a discount, you earn a commission when they
            book.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-ivory-base rounded-xl p-6 shadow-sm border border-sand-stone">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
              Pending Commission
            </p>
            <p className="font-headline-md text-[28px] text-golden-sun">${pendingCommission.toLocaleString()}</p>
          </div>
          <div className="bg-ivory-base rounded-xl p-6 shadow-sm border border-sand-stone">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
              Paid Out
            </p>
            <p className="font-headline-md text-[28px] text-savanna-green">${paidCommission.toLocaleString()}</p>
          </div>
        </div>

        <section className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h2 className="font-headline-md text-[20px] text-on-surface mb-4 flex items-center gap-2">
            <HandCoins size={22} className="text-savanna-green" />
            Generate a Referral Code
          </h2>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Who is this for? (optional)"
              className="flex-1 min-h-[44px] bg-ivory-base border border-sand-stone rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-savanna-green"
            />
            <button
              type="submit"
              disabled={generating}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-golden-sun text-on-primary px-6 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating…' : 'Generate Code'}
            </button>
          </form>
          {generateError && (
            <p role="alert" className="text-error font-label-sm text-label-sm mt-3">
              {generateError}
            </p>
          )}
          {justGenerated && (
            <div className="mt-5 flex items-center justify-between gap-4 bg-savanna-green/10 border border-savanna-green/20 rounded-lg px-5 py-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Share this code</p>
                <p className="font-headline-md text-[24px] tracking-widest text-savanna-green">{justGenerated.code}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Expires {formatDate(justGenerated.expiresAt)} — single use
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(justGenerated.code)}
                className="inline-flex items-center gap-2 text-savanna-green hover:opacity-80 transition-opacity font-label-md text-label-md"
              >
                <Copy size={18} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </section>

        <section className="bg-ivory-base rounded-xl p-6 md:p-8 shadow-sm border border-sand-stone">
          <h2 className="font-headline-md text-[20px] text-on-surface mb-5">Your Codes</h2>
          {loading && <p className="text-on-surface-variant text-sm">Loading…</p>}
          {error && (
            <p role="alert" className="text-error font-label-sm text-label-sm">
              {error}
            </p>
          )}
          {!loading && !error && list.length === 0 && (
            <p className="text-on-surface-variant text-sm">You haven't generated any referral codes yet.</p>
          )}
          {!loading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-sand-stone text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">For</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Booking</th>
                    <th className="py-2 pr-4">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-b border-sand-stone last:border-0">
                      <td className="py-3 pr-4 font-label-md tracking-wider">{c.code}</td>
                      <td className="py-3 pr-4 text-on-surface-variant">{c.contactName || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center py-1 px-2.5 rounded-md text-xs ${STATUS_BADGE[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-on-surface-variant">
                        {c.redemption ? (
                          <span className="inline-flex items-center gap-1">
                            #{c.redemption.bookingId} <ArrowSquareOut size={14} />
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {c.redemption ? (
                          <span className="inline-flex items-center gap-2">
                            ${c.redemption.commissionAmount.toLocaleString()}
                            <span
                              className={`inline-flex items-center py-0.5 px-2 rounded-md text-xs ${COMMISSION_BADGE[c.redemption.commissionStatus]}`}
                            >
                              {c.redemption.commissionStatus}
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
