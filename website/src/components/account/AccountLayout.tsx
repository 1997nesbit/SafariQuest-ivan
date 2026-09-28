import { useEffect, useState } from 'react'
import { Outlet, Link as PlainLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Compass, CreditCard, TrendUp, Warning, User, SignOut, List, X, HandCoins } from '@phosphor-icons/react'
import { Link, NavLink } from '../../i18n/routing'
import { useHomeNavigate, useLocalizedNavigate as useNavigate } from '../../i18n/useLocale'
import { useAuth } from '../../auth/AuthContext'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const NAV_ITEM_KEYS = [
  { to: '/account', key: 'myTrips', icon: Compass, end: true },
  { to: '/account/invoices', key: 'invoicesPayments', icon: CreditCard, end: false },
  { to: '/account/trips', key: 'tripProgress', icon: TrendUp, end: false },
  { to: '/account/complaints', key: 'complaints', icon: Warning, end: false },
  { to: '/account/profile', key: 'profile', icon: User, end: false },
] as const

export function AccountLayout() {
  const { t } = useTranslation('account')
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const navigateHome = useHomeNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useBodyScrollLock(mobileMenuOpen)

  // This area is tourist-only (bookings/invoices scoped to `customer=request.user`) — a
  // signed-in guide/admin landing here (e.g. a stale bookmark) would otherwise just see
  // empty panels with no explanation. Bounce them to their own dashboard instead.
  // (Referral agents are tourists, so they belong here too.)
  const home = user?.home
  useEffect(() => {
    if (role && role !== 'tourist' && home) {
      navigateHome(home)
    }
  }, [role, home, navigateHome])

  async function handleSignOut() {
    await logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  if (role && role !== 'tourist') {
    return null
  }

  const displayName = user?.name || user?.email || 'Account'

  // Shared between the md: sidebar and the mobile drawer.
  function renderNavItems(onNavigate?: () => void) {
    return (
      <ul className="flex-1 flex flex-col gap-1">
        {NAV_ITEM_KEYS.map(({ to, key, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-label-md transition-colors min-h-[44px] ${
                  isActive
                    ? 'text-savanna-green font-bold border-r-4 border-savanna-green bg-surface-container-high'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-savanna-green'
                }`
              }
            >
              <Icon size={20} weight={undefined} />
              {t(`layout.${key}`)}
            </NavLink>
          </li>
        ))}
        {/* Same login, separate data: the agent dashboard lives at the unprefixed /agent
            portal, so it needs the plain router Link rather than the locale-aware one. */}
        <li>
          {user?.isReferralAgent ? (
            <PlainLink
              to="/agent"
              onClick={onNavigate}
              className="flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-label-md transition-colors min-h-[44px] text-terracotta hover:bg-terracotta/10"
            >
              <HandCoins size={20} />
              {t('layout.agentDashboard')}
            </PlainLink>
          ) : (
            <Link
              to="/become-agent"
              onClick={onNavigate}
              className="flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-label-md transition-colors min-h-[44px] text-terracotta hover:bg-terracotta/10"
            >
              <HandCoins size={20} />
              {t('layout.referAndEarn')}
            </Link>
          )}
        </li>
      </ul>
    )
  }

  return (
    <div className="min-h-screen bg-surface-bright flex">
      <nav className="hidden md:flex flex-col w-72 fixed left-0 top-0 h-screen bg-surface-container-low py-8 px-4 gap-4 shrink-0">
        <div className="px-4 mb-4">
          <h1 className="font-headline-md text-headline-md font-bold text-savanna-green" style={{ fontSize: 22 }}>
            {t('layout.brandName')}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">{t('layout.safariPortal')}</p>
        </div>
        {renderNavItems()}
        <div className="px-2 flex flex-col gap-3">
          <Link
            to="/plan"
            className="w-full min-h-[44px] flex items-center justify-center bg-savanna-green text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm"
          >
            {t('layout.bookNewSafari')}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-label-md text-label-md text-error hover:bg-error/10 transition-colors min-h-[44px]"
          >
            <SignOut size={18} />
            {t('layout.signOut')}
          </button>
        </div>
      </nav>

      {/* min-w-0: flex item of the sidebar+content row above. Without it, a
          row-direction flex item refuses to shrink below a non-shrinking
          descendant's natural width — a wide <table> (AccountInvoices),
          even correctly wrapped in its own overflow-x-auto, could otherwise
          drag this whole wrapper wider than the viewport. */}
      <div className="flex-1 md:ml-72 min-h-screen flex flex-col min-w-0">
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-5 md:px-margin-desktop backdrop-blur-xl bg-surface/80 shadow-sm shrink-0">
          <span className="font-headline-md text-headline-md text-savanna-green" style={{ fontSize: 22 }}>
            {t('layout.customerPortal')}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full"
              aria-label={t('layout.notifications')}
            >
              <Bell size={22} />
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-label-md text-on-surface-variant border-2 border-surface-container-high shrink-0">
              {initials(displayName)}
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="account-mobile-menu"
              className="md:hidden flex items-center justify-center w-11 h-11 text-on-surface -mr-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div
            id="account-mobile-menu"
            className="md:hidden fixed inset-0 top-20 z-30 bg-surface-container-low flex flex-col px-4 py-4 overflow-y-auto"
          >
            {renderNavItems(() => setMobileMenuOpen(false))}
            <div className="px-2 flex flex-col gap-3 pt-4 mt-4 border-t border-sand-stone">
              <Link
                to="/plan"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center bg-savanna-green text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm"
              >
                {t('layout.bookNewSafari')}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-label-md text-label-md text-error hover:bg-error/10 transition-colors min-h-[44px]"
              >
                <SignOut size={18} />
                {t('layout.signOut')}
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-5 md:px-margin-desktop py-10 md:py-14">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
