import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  SquaresFour,
  EnvelopeSimple,
  Users,
  Receipt,
  Wallet,
  Money,
  IdentificationBadge,
  Warning,
  Newspaper,
  ChartLineUp,
  UsersThree,
  SignOut,
} from '@phosphor-icons/react'
import { useAuth } from '../../auth/AuthContext'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  sales: 'Sales Agent',
  operations: 'Operations',
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/admin/inquiries', label: 'Inquiries', icon: EnvelopeSimple, end: false },
  { to: '/admin/clients', label: 'Clients', icon: Users, end: false },
  { to: '/admin/invoices', label: 'Invoices', icon: Receipt, end: false },
  { to: '/admin/finance', label: 'Finance', icon: Wallet, end: false },
  { to: '/admin/pricing', label: 'Pricing', icon: Money, end: false },
  { to: '/admin/guides', label: 'Guides', icon: IdentificationBadge, end: false },
  { to: '/admin/complaints', label: 'Complaints', icon: Warning, end: false },
  { to: '/admin/content', label: 'Content', icon: Newspaper, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartLineUp, end: false },
  { to: '/admin/users', label: 'Users & Roles', icon: UsersThree, end: false },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate('/')
  }

  const displayName = user?.name || user?.email || 'Account'
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : ''

  return (
    <div className="min-h-screen bg-surface-container-low flex">
      <nav className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen bg-surface-container-lowest border-r border-sand-stone py-6 px-4 overflow-y-auto">
        <div className="px-2 mb-8">
          <h1 className="font-headline-md text-headline-md font-bold text-savanna-green" style={{ fontSize: 22 }}>
            Safari Ops
          </h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Admin Portal</p>
        </div>
        <ul className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                    isActive ? 'text-savanna-green bg-surface-container-low font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="pt-4 mt-4 border-t border-sand-stone px-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-sm font-label-md text-on-surface-variant shrink-0">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate">{displayName}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-label-md text-label-md text-error hover:bg-error/10 transition-colors"
          >
            <SignOut size={18} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-surface-container-lowest border-b border-sand-stone flex items-center px-5">
        <span className="font-headline-md text-savanna-green font-bold" style={{ fontSize: 18 }}>
          Safari Ops
        </span>
      </div>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
