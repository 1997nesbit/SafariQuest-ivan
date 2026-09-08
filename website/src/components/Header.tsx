import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { List, X, UserCircle, ShieldCheck, Binoculars } from '@phosphor-icons/react'
import { useAuth } from '../auth/AuthContext'

const NAV_LINKS = [
  { label: 'Destinations', to: '/destinations' },
  { label: 'Safaris', to: '/safaris' },
  { label: 'About Us', to: '/about' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { role, logout } = useAuth()
  const navigate = useNavigate()

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
          className="font-headline-md text-headline-md font-bold text-savanna-green lg:shrink-0 lg:whitespace-nowrap mr-6 xl:mr-10"
          onClick={() => setMenuOpen(false)}
        >
          Pande Wilderness Safari
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
            Plan Your Journey
          </NavLink>
          {role && ['admin', 'sales', 'operations'].includes(role) && (
            <NavLink
              to="/admin"
              title="Admin"
              className="hidden lg:flex items-center justify-center w-9 h-9 border border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors rounded-full shrink-0"
            >
              <ShieldCheck size={16} />
            </NavLink>
          )}
          {role === 'guide' && (
            <NavLink
              to="/guide"
              title="Guide"
              className="hidden lg:flex items-center justify-center w-9 h-9 border border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors rounded-full shrink-0"
            >
              <Binoculars size={16} />
            </NavLink>
          )}
          {role ? (
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="hidden lg:flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-savanna-green transition-colors shrink-0"
            >
              <UserCircle size={20} />
            </button>
          ) : (
            <NavLink
              to="/sign-in"
              title="Sign In"
              className="hidden lg:flex items-center justify-center w-9 h-9 text-on-surface-variant hover:text-savanna-green transition-colors shrink-0"
            >
              <UserCircle size={20} />
            </NavLink>
          )}
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-11 h-11 text-on-surface cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
            Plan Your Journey
          </NavLink>
          {role ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 border-t border-surface-variant mt-1 pt-4 text-on-surface-variant hover:bg-surface-container-low"
            >
              <UserCircle size={20} />
              Sign Out
            </button>
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
              Sign In
            </NavLink>
          )}
          {role && ['admin', 'sales', 'operations'].includes(role) && (
            <NavLink
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 ${
                  isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <ShieldCheck size={20} />
              Admin
            </NavLink>
          )}
          {role === 'guide' && (
            <NavLink
              to="/guide"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 px-2 rounded-lg min-h-[44px] flex items-center gap-1.5 ${
                  isActive ? 'text-savanna-green' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <Binoculars size={20} />
              Guide
            </NavLink>
          )}
        </div>
      )}
    </header>
  )
}
