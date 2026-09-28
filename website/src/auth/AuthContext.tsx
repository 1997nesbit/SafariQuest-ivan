import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setPassword as apiSetPassword,
  type MeResponse,
  type Role,
} from '../api/auth'
import { ApiError, setUnauthorizedHandler } from '../lib/api'

interface AuthContextValue {
  role: Role | null
  user: MeResponse | null
  isLoading: boolean
  /** Each of these resolves to the user's landing path (AuthResult.home). */
  login: (email: string, password: string) => Promise<string>
  logout: () => Promise<void>
  register: (email: string, name: string, password: string) => Promise<string>
  setPassword: (uid: string, token: string, password: string) => Promise<string>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((res) => {
        if (!cancelled) setUser(res)
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

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string> => {
    await apiLogin(email, password)
    const me = await fetchMe()
    setUser(me)
    return me.home
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setUser(null)
    try {
      await apiLogout()
    } catch (err) {
      console.error('Logout request failed (session cleared client-side regardless)', err)
    }
  }, [])

  const register = useCallback(async (email: string, name: string, password: string): Promise<string> => {
    await apiRegister({ email, name, password })
    const me = await fetchMe()
    setUser(me)
    return me.home
  }, [])

  const setPassword = useCallback(async (uid: string, token: string, password: string): Promise<string> => {
    await apiSetPassword(uid, token, password)
    const me = await fetchMe()
    setUser(me)
    return me.home
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    const me = await fetchMe()
    setUser(me)
  }, [])

  // Without this, every AuthProvider render (any time `user`/`isLoading` changes) handed
  // every useAuth() consumer a brand-new object, forcing them all to re-render regardless
  // of whether the values they actually read had changed.
  const value = useMemo<AuthContextValue>(
    () => ({ role: user?.role ?? null, user, isLoading, login, logout, register, setPassword, refreshUser }),
    [user, isLoading, login, logout, register, setPassword, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the hook with its provider is intentional
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
