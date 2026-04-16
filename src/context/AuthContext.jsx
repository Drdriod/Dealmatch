import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, getProfile, updateProfile } from '@/lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await getProfile(userId)
    if (data) setProfile(data)
    return data
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const updateUserProfile = async (updates) => {
    if (!user) return { error: new Error('Not authenticated') }
    const { data, error } = await updateProfile(user.id, updates)
    if (data) setProfile(data)
    return { data, error }
  }

  const isAuthenticated        = !!user
  const hasCompletedOnboarding = !!profile?.onboarding_completed

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated,
      hasCompletedOnboarding,
      refreshProfile,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
