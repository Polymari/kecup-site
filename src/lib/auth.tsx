import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { isConfigured, supabase } from './supabase'

const DEMO_SESSION_KEY = 'kecup.portal.session'

export interface PortalUser {
  email: string
  outletSlug: string
  demo: boolean
}

interface AuthContextValue {
  user: PortalUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readDemoSession(): PortalUser | null {
  try {
    const raw = globalThis.localStorage?.getItem(DEMO_SESSION_KEY)
    return raw ? (JSON.parse(raw) as PortalUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(() =>
    isConfigured ? null : readDemoSession(),
  )
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured || !supabase) return
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const email = data.session?.user.email
      setUser(email ? { email, outletSlug: 'anggrek', demo: false } : null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email
      setUser(email ? { email, outletSlug: 'anggrek', demo: false } : null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) return 'missing'
    if (isConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? 'invalid' : null
    }
    const demoUser: PortalUser = { email, outletSlug: 'anggrek', demo: true }
    setUser(demoUser)
    try {
      globalThis.localStorage?.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser))
    } catch {
      // storage unavailable — session stays in memory
    }
    return null
  }, [])

  const signOut = useCallback(async () => {
    if (isConfigured && supabase) await supabase.auth.signOut()
    setUser(null)
    try {
      globalThis.localStorage?.removeItem(DEMO_SESSION_KEY)
    } catch {
      // storage unavailable
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="p-10 text-center">…</div>
  }
  if (!user) {
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
