import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, Compass, CreditCard, TrendUp, Warning, User, SignOut } from '@phosphor-icons/react'
import { useAuth } from '../../auth/AuthContext'

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const NAV_ITEMS = [
  { to: '/account', label: 'My Trips', icon: Compass, end: true },
  { to: '/account/invoices', label: 'Invoices & Payments', icon: CreditCard, end: false },
  { to: '/account/trips', label: 'Trip Progress', icon: TrendUp, end: false },
  { to: '/account/complaints', label: 'Complaints', icon: Warning, end: false },
  { to: '/account/profile', label: 'Profile', icon: User, end: false },
]

export function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  const displayName = user?.name || user?.email || 'Account'

  return (
    <div className="min-h-screen bg-surface-bright flex">
      <nav className="hidden md:flex flex-col w-72 fixed left-0 top-0 h-screen bg-surface-container-low py-8 px-4 gap-4 shrink-0">
        <div className="px-4 mb-4">
          <h1 className="font-headline-md text-headline-md font-bold text-savanna-green" style={{ fontSize: 22 }}>
            Pande Wilderness
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">Safari Portal</p>
        </div>
        <ul className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-lg font-label-md text-label-md transition-colors ${
                    isActive
                      ? 'text-savanna-green font-bold border-r-4 border-savanna-green bg-surface-container-high'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-savanna-green'
                  }`
                }
              >
                <Icon size={20} weight={undefined} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="px-2 flex flex-col gap-3">
          <Link
            to="/plan"
            className="w-full min-h-[44px] flex items-center justify-center bg-savanna-green text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm"
          >
            Book New Safari
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-label-md text-label-md text-error hover:bg-error/10 transition-colors"
          >
            <SignOut size={18} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex-1 md:ml-72 min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-5 md:px-margin-desktop backdrop-blur-xl bg-surface/80 shadow-sm shrink-0">
          <span className="font-headline-md text-headline-md text-savanna-green" style={{ fontSize: 22 }}>
            Customer Portal
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full"
              aria-label="Notifications"
            >
              <Bell size={22} />
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-label-md text-on-surface-variant border-2 border-surface-container-high shrink-0">
              {initials(displayName)}
            </div>
          </div>
        </header>
        <main className="flex-1 px-5 md:px-margin-desktop py-10 md:py-14">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
