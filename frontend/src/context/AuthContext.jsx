import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import { setRememberMe, supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/profile/me')
      setProfile(data)
      setProfileError(null)
    } catch (err) {
      setProfile(null)
      setProfileError(
        err?.response?.data?.detail ||
          'Could not load your account profile. The backend or database may not be fully set up yet.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    let lastLoadedSessionId = null

    const handleSession = async (newSession) => {
      if (!active) return
      setSession(newSession)
      if (newSession) {
        if (lastLoadedSessionId !== newSession.user.id) {
          lastLoadedSessionId = newSession.user.id
          await loadProfile()
        }
      } else {
        lastLoadedSessionId = null
        setProfile(null)
        setProfileError(null)
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session && !lastLoadedSessionId) {
        handleSession(data.session)
      } else if (!data.session) {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return
      if (event === 'SIGNED_OUT') {
        lastLoadedSessionId = null
        setSession(null)
        setProfile(null)
        setProfileError(null)
        setLoading(false)
      } else if (newSession) {
        handleSession(newSession)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email, password, remember = true) => {
    setRememberMe(remember)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadProfile()
    // Best-effort -- a failed last_login touch shouldn't block sign-in.
    api.post('/profile/me/touch-login').catch(() => {})
  }

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    profileError,
    role: profile?.role ?? null,
    loading,
    isAuthenticated: Boolean(session),
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    refreshProfile: loadProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
