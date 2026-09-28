import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink as PlainNavLink } from 'react-router-dom'
import { List, X, UserCircle, SignOut } from '@phosphor-icons/react'
import { useAuth } from '../auth/AuthContext'
import { NavLink } from '../i18n/routing'
import { useCurrentLocale, useLocalizedNavigate as useNavigate } from '../i18n/useLocale'
import { localizeHome } from '../i18n/localize'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const { t } = useTranslation('common')
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const locale = useCurrentLocale()
  // The server decides where each user lands (trips first, or the agent dashboard for
  // agents who've never booked); localizeHome only prefixes the tourist area.
  const dashboardHref = user ? localizeHome(locale, user.home) : null

  const NAV_LINKS = [
    { label: t('nav.destinations'), to: '/destinations' },
    { label: t('nav.safaris'), to: '/safaris' },
    { label: t('nav.about'), to: '/about' },
  ]

  async function handleSignOut() {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-label-md text-label-md whitespace-nowrap transition-colors ${
      isActive
        ? 'text-savanna-green border-b-2 border-savanna-green pb-1'
        : 'text-on-surface-variant hover:text-savanna-green'
    }`

  return (
    <header className="fixed top-0 w-full z-50 bg-ivory-base/80 backdrop-blur-md shadow-sm">
      <nav className="flex items-center px-5 md:px-8 lg:px-6 xl:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
        <NavLink
          to="/"
          className="flex items-center gap-2 lg:shrink-0 lg:whitespace-nowrap mr-6 xl:mr-10"
          onClick={() => setMenuOpen(false)}
        >
          <img src="/images/pande-safaris-logo.svg" alt="" className="h-10 w-10 shrink-0" />
          <span className="font-headline-md text-headline-md font-bold text-savanna-green">
            {t('brandName')}
          </span>
        </NavLink>

        <div className="hidden lg:flex items-center gap-4 xl:gap-8 shrink-0">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex-1" />

        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          <NavLink
            to="/plan"
            className="hidden lg:flex items-center bg-savanna-green text-on-primary font-label-md text-label-md px-4 xl:px-6 py-3 rounded hover:opacity-90 transition-opacity shrink-0 mr-1 xl:mr-2 whitespace-nowrap"
          >
            {t('planYourJourney')}
          </NavLink>
          {role && dashboardHref ? (
            <>
              <PlainNavLink
                to={dashboardHref}
                className="hidden lg:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md px-2 shrink-0 whitespace-nowrap"
              >
                <UserCircle size={18} />
                Dashboard
              </PlainNavLink>
              <button
                type="button"
                onClick={handleSignOut}
                title={t('signOut')}
                className="hidden lg:flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-savanna-green transition-colors shrink-0"
              >
                <SignOut size={18} />
              </button>
            </>
          ) : (
            <NavLink
              to="/sign-in"
              title={t('signIn')}
              className="hidden lg:flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-savanna-green transition-colors shrink-0"
            >
              <UserCircle size={20} />
            </NavLink>
          )}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-11 h-11 text-on-surface cursor-pointer"
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="lg:hidden bg-ivory-base border-t border-surface-variant px-5 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center ${
                  isActive ? 'text-savanna-green bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/plan"
            onClick={() => setMenuOpen(false)}
            className="bg-savanna-green text-on-primary font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center justify-center mt-1"
          >
            {t('planYourJourney')}
          </NavLink>
          {role && dashboardHref ? (
            <>
              <PlainNavLink
                to={dashboardHref}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 ${
                    isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`
                }
              >
                <UserCircle size={20} />
                Dashboard
              </PlainNavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 text-on-surface-variant hover:bg-surface-container-low"
              >
                <SignOut size={20} />
                {t('signOut')}
              </button>
            </>
          ) : (
            <NavLink
              to="/sign-in"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 ${
                  isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <UserCircle size={20} />
              {t('signIn')}
            </NavLink>
          )}
          <LanguageSwitcher variant="mobile" />
        </div>
      )}
    </header>
  )
}
