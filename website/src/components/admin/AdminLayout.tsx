import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Compass,
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
  CheckCircle,
  SignOut,
  Plus,
  MagnifyingGlass,
  Bell,
  Gear,
  Question,
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
      <nav className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen bg-surface-container-lowest border-r border-sand-stone py-6 px-4">
        <div className="px-2 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-savanna-green/10 flex items-center justify-center text-savanna-green shrink-0">
            <Compass size={22} weight="fill" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-savanna-green" style={{ fontSize: 20 }}>
              Safari Ops
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Enterprise Portal</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/inquiries')}
          className="w-full bg-savanna-green text-on-primary font-label-md text-label-md py-3 rounded-lg mb-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={18} weight="bold" />
          New Inquiry
        </button>

        <ul className="flex flex-col gap-1 flex-1 overflow-y-auto">
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

        <div className="pt-4 mt-4 border-t border-sand-stone px-2 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-sm font-label-md text-on-surface-variant shrink-0">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate">{displayName}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{roleLabel}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant">
              <CheckCircle size={18} className="text-savanna-green" />
              System Status
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-label-md text-label-md text-error hover:bg-error/10 transition-colors"
            >
              <SignOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-surface-container-lowest border-b border-sand-stone flex items-center px-5">
        <span className="font-headline-md text-savanna-green font-bold" style={{ fontSize: 18 }}>
          Safari Ops
        </span>
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pt-14 lg:pt-0">
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between px-8 bg-surface/80 backdrop-blur-md border-b border-sand-stone shrink-0">
          <div className="relative w-full max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search inquiries, clients..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-highest border border-sand-stone rounded-lg focus:outline-none focus:border-savanna-green focus:ring-1 focus:ring-savanna-green transition-all text-on-surface placeholder:text-outline-variant"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              title="Notifications"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Bell size={20} />
            </button>
            <button
              type="button"
              title="Settings"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Gear size={20} />
            </button>
            <button
              type="button"
              title="Help"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Question size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-sm font-label-md text-on-surface-variant ml-1 shrink-0">
              {initials(displayName)}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="p-5 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-sand-stone bg-surface-container-lowest px-5 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <span className="font-label-sm text-label-sm text-savanna-green font-bold">Safari Ops</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 Safari Tanzania Enterprise. All rights reserved.
          </span>
          <div className="flex gap-4">
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Status</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">API Docs</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Privacy Policy</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
