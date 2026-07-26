import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import type { UserRole } from '@/types'
import { api, setTokens, clearTokens } from '@/api/client'

interface AuthUser {
  id: string
  email: string
  role: UserRole
  label: string
  invoiceId?: string
}

interface AppContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (accessToken: string, refreshToken: string, userData: AuthUser) => void
  logout: () => void
  setInvoiceId: (invoiceId: string) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const USER_KEY = 'sav-ia:user'

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sav-ia:access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        const stored = localStorage.getItem(USER_KEY)
        const parsed = stored ? JSON.parse(stored) : null
        const merged: AuthUser = { ...parsed, ...res.data }
        setUserState(merged)
        localStorage.setItem(USER_KEY, JSON.stringify(merged))
      })
      .catch(() => {
        clearTokens()
        localStorage.removeItem(USER_KEY)
        setUserState(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = (accessToken: string, refreshToken: string, userData: AuthUser) => {
    setTokens(accessToken, refreshToken)
    setUserState(userData)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  const logout = () => {
    clearTokens()
    localStorage.removeItem(USER_KEY)
    setUserState(null)
  }

  const setInvoiceId = (invoiceId: string) => {
    if (!user) return
    const updated = { ...user, invoiceId }
    setUserState(updated)
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
  }

  const value = useMemo(
    () => ({ user, isLoading, login, logout, setInvoiceId }),
    [user, isLoading]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider')
  return ctx
}
