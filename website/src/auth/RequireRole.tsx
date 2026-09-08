import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from '../api/auth'

export function RequireRole({ allow }: { allow: Role[] }) {
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading…</div>
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
