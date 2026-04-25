import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  AUTH_CALLBACK_PATH,
  clearStoredAuthReturnTo,
  getStoredAuthReturnTo,
} from '../config/authRoutes'
import { AUTH_ENDPOINTS } from '../config/apiEndpoints'
import {
  getSupabaseConfigError,
  isSupabaseConfigured,
  supabase,
} from '../services/supabaseClient'

const AuthContext = createContext()
const SUPABASE_AUTH_MODE = 'supabase'
const DEMO_AUTH_MODE = 'demo'
const INVALID_AUTH_MODE = '__invalid_auth_mode__'

const mapBackendUser = (backendUser) => {
  if (!backendUser) {
    return null
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    first_name: backendUser.first_name || '',
    last_name: backendUser.last_name || '',
    role: backendUser.role || '',
    organization: backendUser.organization || '',
    subscription_tier: backendUser.subscription_tier || 'free',
    created_at: backendUser.created_at || null,
  }
}

const normalizeBackendError = (error, fallbackMessage) => {
  const backendMessage =
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message

  return {
    code: error?.response?.data?.code || error?.code || 'auth_error',
    message: backendMessage || fallbackMessage,
  }
}

const normalizeProfileResponse = (response, fallbackMessage) => {
  const body = response?.data
  const user = mapBackendUser(body?.user)
  if (!user) {
    return {
      success: false,
      code: 'malformed_profile_response',
      message: fallbackMessage,
    }
  }

  return {
    success: true,
    user,
  }
}

const getConfiguredAuthMode = () => {
  const configured = String(import.meta.env.VITE_AUTH_MODE || '').trim().toLowerCase()
  if (!configured) {
    return SUPABASE_AUTH_MODE
  }

  if (configured === DEMO_AUTH_MODE) {
    return DEMO_AUTH_MODE
  }

  if (configured !== SUPABASE_AUTH_MODE) {
    console.error(`Unsupported VITE_AUTH_MODE="${configured}". Supported values: supabase, demo.`)
    return INVALID_AUTH_MODE
  }

  return SUPABASE_AUTH_MODE
}

const getDefaultAuthReturnTo = () => getStoredAuthReturnTo() || '/dashboard'

const buildAbsoluteReturnUrl = (path = '/dashboard') => {
  if (typeof window === 'undefined') {
    return path
  }

  const normalizedPath = String(path || '/dashboard').startsWith('/') ? path : '/dashboard'
  return `${window.location.origin}${normalizedPath}`
}

const getSessionAccessToken = (session) =>
  typeof session?.access_token === 'string' && session.access_token.trim()
    ? session.access_token.trim()
    : ''

const buildUnavailableAuthValue = (errorMessage = 'Authentication mode is not configured.') => ({
  user: null,
  token: null,
  loading: false,
  login: async () => ({ success: false, error: errorMessage }),
  register: async () => ({ success: false, error: errorMessage }),
  logout: async () => ({ success: false, error: errorMessage }),
  updateProfile: async () => ({ success: false, error: errorMessage }),
  loginWithProvider: async () => ({ success: false, error: errorMessage }),
  requestPasswordReset: async () => ({ success: false, error: errorMessage }),
  syncBackendAfterLogin: async () => ({ success: false, error: errorMessage }),
  exchangeOAuthCodeForSession: async () => ({ success: false, error: errorMessage }),
  isAuthenticated: false,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@example.com',
  first_name: 'Demo',
  last_name: 'User',
  role: 'learner',
  organization: '',
  subscription_tier: 'free',
  created_at: null,
}

const DemoAuthProvider = ({ children }) => {
  axios.defaults.headers.common.Authorization = 'Bearer demo'

  useEffect(() => {
    axios.defaults.headers.common.Authorization = 'Bearer demo'
    const interceptorId = axios.interceptors.request.use((config) => ({
      ...config,
      headers: {
        ...config.headers,
        Authorization: config.headers?.Authorization || 'Bearer demo',
      },
    }))

    return () => {
      axios.interceptors.request.eject(interceptorId)
    }
  }, [])

  const value = useMemo(() => ({
    user: DEMO_USER,
    token: null,
    loading: false,
    login: async () => ({ success: true, user: DEMO_USER }),
    register: async () => ({ success: true, user: DEMO_USER }),
    logout: async () => ({ success: true, redirected: false }),
    updateProfile: async () => ({ success: true, user: DEMO_USER }),
    loginWithProvider: async () => ({ success: false, error: 'Not supported in demo mode.' }),
    requestPasswordReset: async () => ({ success: false, error: 'Not supported in demo mode.' }),
    syncBackendAfterLogin: async () => ({ success: true, user: DEMO_USER }),
    exchangeOAuthCodeForSession: async () => ({ success: true, user: DEMO_USER }),
    isAuthenticated: true,
  }), [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const SupabaseSessionAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    delete axios.defaults.headers.common.Authorization
  }, [])

  const applySessionToken = useCallback((session) => {
    const accessToken = getSessionAccessToken(session)
    if (!accessToken) {
      clearSession()
      return ''
    }

    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    setToken(accessToken)
    return accessToken
  }, [clearSession])

  const syncBackendAfterLogin = useCallback(async (sessionOverride) => {
    try {
      let activeSession = sessionOverride

      if (!activeSession) {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          throw error
        }
        activeSession = data?.session
      }

      const accessToken = applySessionToken(activeSession)
      if (!accessToken) {
        return { success: false, error: 'Missing Supabase session token.' }
      }

      const response = await axios.get(AUTH_ENDPOINTS.profile)
      const normalized = normalizeProfileResponse(
        response,
        'Unable to load your profile from the backend.'
      )
      if (!normalized.success) {
        clearSession()
        return { success: false, error: normalized.message, code: normalized.code }
      }

      setUser(normalized.user)
      return { success: true, user: normalized.user }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to load your account right now.')
      clearSession()
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [applySessionToken, clearSession])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      if (isMounted) {
        setLoading(true)
      }

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          throw error
        }

        if (!data?.session) {
          clearSession()
          return
        }

        await syncBackendAfterLogin(data.session)
      } catch {
        clearSession()
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return
      }

      if (event === 'SIGNED_OUT') {
        clearSession()
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        applySessionToken(session)
        return
      }

      if (session) {
        setTimeout(() => {
          syncBackendAfterLogin(session)
        }, 0)
      }
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [applySessionToken, clearSession, syncBackendAfterLogin])

  const startOAuth = useCallback(async (provider = 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAbsoluteReturnUrl(AUTH_CALLBACK_PATH),
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to start Supabase sign-in.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [])

  const login = useCallback(async () => startOAuth('google'), [startOAuth])

  const register = useCallback(async () => startOAuth('google'), [startOAuth])

  const loginWithProvider = useCallback(async (provider = 'google') => startOAuth(provider), [startOAuth])

  const exchangeOAuthCodeForSession = useCallback(async (code) => {
    try {
      const authCode = String(code || '').trim()
      if (!authCode) {
        return { success: false, error: 'Missing Supabase auth code.', code: 'missing_auth_code' }
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
      if (error) {
        throw error
      }

      return syncBackendAfterLogin(data?.session)
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to complete Supabase sign-in.')
      clearSession()
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession, syncBackendAfterLogin])

  const logout = useCallback(async () => {
    clearSession()
    clearStoredAuthReturnTo()

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      return { success: true, redirected: false }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to sign out right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession])

  const updateProfile = useCallback(async (profileData) => {
    try {
      let activeToken = token
      if (!activeToken) {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          throw error
        }
        activeToken = applySessionToken(data?.session)
      }

      if (!activeToken) {
        return { success: false, error: 'Missing Supabase session token.' }
      }

      axios.defaults.headers.common.Authorization = `Bearer ${activeToken}`
      const response = await axios.put(AUTH_ENDPOINTS.profile, {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role || '',
        organization: profileData.organization || '',
      })

      const normalized = normalizeProfileResponse(
        response,
        'Failed to load updated profile.'
      )
      if (!normalized.success) {
        return { success: false, error: normalized.message, code: normalized.code }
      }

      setUser(normalized.user)
      return { success: true, user: normalized.user }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to update profile right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [applySessionToken, token])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithProvider,
    requestPasswordReset: async () => ({
      success: false,
      error: 'Password reset is not available for Google sign-in accounts.',
    }),
    syncBackendAfterLogin,
    exchangeOAuthCodeForSession,
    isAuthenticated: Boolean(user) && Boolean(token),
  }), [
    exchangeOAuthCodeForSession,
    loading,
    login,
    loginWithProvider,
    logout,
    register,
    syncBackendAfterLogin,
    token,
    updateProfile,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const AuthProvider = ({ children }) => {
  const authMode = getConfiguredAuthMode()

  if (authMode === DEMO_AUTH_MODE) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>
  }

  if (authMode !== SUPABASE_AUTH_MODE || !isSupabaseConfigured()) {
    return (
      <AuthContext.Provider value={buildUnavailableAuthValue(getSupabaseConfigError())}>
        {children}
      </AuthContext.Provider>
    )
  }

  return <SupabaseSessionAuthProvider>{children}</SupabaseSessionAuthProvider>
}
