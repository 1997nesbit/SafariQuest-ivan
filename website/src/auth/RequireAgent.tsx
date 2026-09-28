import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { DEFAULT_LOCALE } from '../i18n/locales'

/** Guards the agent dashboard. Referral agent is a profile on a tourist account, not a
 * role, so RequireRole can't express it. A signed-in tourist without the profile is sent
 * to the join page (one click to activate) rather than bounced to sign-in. */
export function RequireAgent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (!user) {
    return <Navigate to={`/${DEFAULT_LOCALE}/sign-in?next=/agent`} replace />
  }

  if (user.role !== 'tourist' || !user.isReferralAgent) {
    return <Navigate to={`/${DEFAULT_LOCALE}/become-agent`} replace />
  }

  return <Outlet />
}
