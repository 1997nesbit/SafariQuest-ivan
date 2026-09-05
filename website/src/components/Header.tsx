import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { List, X, UserCircle, ShieldCheck, Binoculars } from '@phosphor-icons/react'
import { useAuth } from '../auth/AuthContext'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Safaris', to: '/safaris' },
  { label: 'Destinations', to: '/destinations' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'About Us', to: '/about' },
  { label: 'FAQs', to: '/faqs' },
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
    `font-label-md text-label-md transition-colors ${
      isActive
        ? 'text-savanna-green border-b-2 border-savanna-green pb-1'
        : 'text-on-surface-variant hover:text-savanna-green'
    }`

  return (
    <header className="fixed top-0 w-full z-50 bg-ivory-base/80 backdrop-blur-md shadow-sm">
      <nav className="flex justify-between items-center px-5 md:px-margin-desktop py-4 w-full max-w-container-max mx-auto">
        <NavLink
          to="/"
          className="font-headline-md text-headline-md font-bold text-savanna-green"
          onClick={() => setMenuOpen(false)}
        >
          Pande Wilderness Safari
        </NavLink>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/admin"
            className="hidden md:flex items-center gap-1.5 border border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors font-label-md text-label-sm px-3 py-1.5 rounded-full"
          >
            <ShieldCheck size={16} />
            Admin
          </NavLink>
          <NavLink
            to="/guide"
            className="hidden md:flex items-center gap-1.5 border border-sand-stone text-on-surface-variant hover:border-savanna-green hover:text-savanna-green transition-colors font-label-md text-label-sm px-3 py-1.5 rounded-full"
          >
            <Binoculars size={16} />
            Guide
          </NavLink>
          {role ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
            >
              <UserCircle size={20} />
              Sign Out
            </button>
          ) : (
            <NavLink
              to="/sign-in"
              className="hidden md:flex items-center gap-1.5 text-on-surface-variant hover:text-savanna-green transition-colors font-label-md text-label-md"
            >
              <UserCircle size={20} />
              Sign In
            </NavLink>
          )}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-11 h-11 text-on-surface cursor-pointer"
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
        <div id="mobile-menu" className="md:hidden bg-ivory-base border-t border-surface-variant px-5 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
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
        </div>
      )}
    </header>
  )
}
