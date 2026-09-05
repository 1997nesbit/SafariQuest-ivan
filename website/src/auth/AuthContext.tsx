import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setPassword as apiSetPassword,
  type Role,
} from '../api/auth'
import { ApiError } from '../lib/api'

interface AuthContextValue {
  role: Role | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<Role>
  logout: () => Promise<void>
  register: (email: string, name: string, password: string) => Promise<Role>
  setPassword: (uid: string, token: string, password: string) => Promise<Role>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((res) => {
        if (!cancelled) setRole(res.role)
      })
      .catch((err: unknown) => {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          // Unexpected error (network down, etc.) — still treat as signed out,
          // but don't hide it from the console.
          console.error('Failed to restore session', err)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string): Promise<Role> {
    const res = await apiLogin(email, password)
    setRole(res.role)
    return res.role
  }

  async function logout(): Promise<void> {
    setRole(null)
    try {
      await apiLogout()
    } catch (err) {
      console.error('Logout request failed (session cleared client-side regardless)', err)
    }
  }

  async function register(email: string, name: string, password: string): Promise<Role> {
    const res = await apiRegister({ email, name, password })
    setRole(res.role)
    return res.role
  }

  async function setPassword(uid: string, token: string, password: string): Promise<Role> {
    const res = await apiSetPassword(uid, token, password)
    setRole(res.role)
    return res.role
  }

  return (
    <AuthContext.Provider value={{ role, isLoading, login, logout, register, setPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
