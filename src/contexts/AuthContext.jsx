import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import supabase from '../services/supabaseClient'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) {
    return null
  }

  const metadata = supabaseUser.user_metadata || {}

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    first_name: metadata.first_name || '',
    last_name: metadata.last_name || '',
    role: metadata.role || '',
    organization: metadata.organization || '',
    subscription_tier: metadata.subscription_tier || 'free',
    created_at: supabaseUser.created_at
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client is not initialized. Check environment variables.')
      setLoading(false)
      return
    }

    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to retrieve Supabase session:', error)
        } else {
          setSession(data.session)
          setUser(mapSupabaseUser(data.session?.user))
        }
      } catch (err) {
        console.error('Unexpected Supabase auth error:', err)
      } finally {
        setLoading(false)
      }
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(mapSupabaseUser(newSession?.user))
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const accessToken = session?.access_token
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [session])

  const syncBackendProfile = async (profile) => {
    if (!profile) {
      return
    }

    try {
      await axios.post('/api/auth/sync', profile)
    } catch (err) {
      console.warn('Failed to sync profile with backend:', err?.response?.data || err)
    }
  }

  const login = async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { success: false, error: error.message }
    }

    setSession(data.session)
    const mappedUser = mapSupabaseUser(data.user)
    setUser(mappedUser)

    await syncBackendProfile({
      id: mappedUser?.id,
      email: mappedUser?.email,
      first_name: mappedUser?.first_name,
      last_name: mappedUser?.last_name,
      role: mappedUser?.role,
      organization: mappedUser?.organization
    })

    return { success: true, user: mappedUser }
  }

  const register = async (userData) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          organization: userData.organization,
          subscription_tier: 'free'
        }
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const mappedUser = mapSupabaseUser(data.user)

    if (data.session) {
      setSession(data.session)
      setUser(mappedUser)

      await syncBackendProfile({
        id: mappedUser?.id,
        email: mappedUser?.email,
        first_name: mappedUser?.first_name,
        last_name: mappedUser?.last_name,
        role: mappedUser?.role,
        organization: mappedUser?.organization
      })
    }

    return {
      success: true,
      user: mappedUser,
      requiresEmailConfirmation: !data.session
    }
  }

  const logout = async () => {
    if (!supabase) {
      setSession(null)
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase logout failed:', error)
      return
    }

    setSession(null)
    setUser(null)
  }

  const updateProfile = async (profileData) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const metadata = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role: profileData.role || '',
      organization: profileData.organization || '',
      subscription_tier: user?.subscription_tier || 'free'
    }

    const { data, error } = await supabase.auth.updateUser({ data: metadata })

    if (error) {
      return { success: false, error: error.message }
    }

    const mappedUser = mapSupabaseUser(data.user)
    setUser(mappedUser)

    await syncBackendProfile({
      id: mappedUser?.id,
      email: mappedUser?.email,
      first_name: mappedUser?.first_name,
      last_name: mappedUser?.last_name,
      role: mappedUser?.role,
      organization: mappedUser?.organization
    })

    return { success: true, user: mappedUser }
  }

  const value = {
    user,
    token: session?.access_token || null,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
