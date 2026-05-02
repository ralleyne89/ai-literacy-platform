import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  AUTH_CALLBACK_PATH,
  clearStoredAuthReturnTo,
  getStoredAuthReturnTo,
  normalizeOAuthProviderError,
} from '../config/authRoutes'
import { AUTH_ENDPOINTS, getApiRoutingIssue } from '../config/apiEndpoints'
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

const getBackendErrorMessage = (error) =>
  String(
    error?.response?.data?.error ||
      error?.response?.data?.details ||
      error?.message ||
      ''
  ).trim()

const getBackendErrorCode = (error) =>
  String(error?.response?.data?.code || error?.code || '').trim()

const isInvalidCredentialError = (error) => {
  const searchable = `${getBackendErrorCode(error)} ${getBackendErrorMessage(error)}`.toLowerCase()
  return searchable.includes('invalid_credentials') ||
    searchable.includes('invalid login credentials') ||
    searchable.includes('invalid credentials')
}

const isEmailConfirmationError = (error) => {
  const searchable = `${getBackendErrorCode(error)} ${getBackendErrorMessage(error)}`.toLowerCase()
  return searchable.includes('email_not_confirmed') ||
    searchable.includes('email not confirmed') ||
    searchable.includes('confirm your email')
}

const isAuthRouteUnavailableError = (error) => {
  const status = Number(error?.response?.status)
  return status === 404 || status === 405
}

const isApiNetworkError = (error) =>
  error?.code === 'ERR_NETWORK' || (!error?.response && Boolean(error?.request))

const normalizeBackendError = (error, fallbackMessage, options = {}) => {
  if (options.authRoute) {
    const apiRoutingIssue = getApiRoutingIssue()
    if (apiRoutingIssue) {
      return {
        code: apiRoutingIssue.code,
        message: apiRoutingIssue.message,
      }
    }
  }

  if (isInvalidCredentialError(error)) {
    return {
      code: 'invalid_credentials',
      message: 'The email or password is incorrect.',
    }
  }

  if (isEmailConfirmationError(error)) {
    return {
      code: 'email_not_confirmed',
      message: 'Confirm your email address before signing in.',
    }
  }

  if (options.authRoute && isAuthRouteUnavailableError(error)) {
    return {
      code: 'backend_auth_route_unavailable',
      message: 'The auth API route is unavailable. Check that VITE_API_URL points to the platform-api Edge Function, not Supabase REST.',
    }
  }

  if (options.authRoute && isApiNetworkError(error)) {
    return {
      code: 'backend_api_unreachable',
      message: 'The backend API could not be reached. Check VITE_API_URL and the platform-api deployment.',
    }
  }

  const backendMessage = getBackendErrorMessage(error)

  return {
    code: getBackendErrorCode(error) || 'auth_error',
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

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const normalizePassword = (password) => String(password || '')

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
  loginWithPassword: async () => ({ success: false, error: errorMessage }),
  registerWithPassword: async () => ({ success: false, error: errorMessage }),
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
    loginWithPassword: async () => ({ success: true, user: DEMO_USER }),
    registerWithPassword: async () => ({ success: true, user: DEMO_USER }),
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

      const apiRoutingIssue = getApiRoutingIssue()
      if (apiRoutingIssue) {
        clearSession()
        return { success: false, error: apiRoutingIssue.message, code: apiRoutingIssue.code }
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
      const normalized = normalizeBackendError(error, 'Unable to load your account right now.', {
        authRoute: true,
      })
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
      const normalized = normalizeOAuthProviderError(
        error,
        provider === 'google' ? 'Unable to start Google sign-in.' : 'Unable to start provider sign-in.',
        provider
      )
      return { success: false, error: normalized.error, code: normalized.code }
    }
  }, [])

  const login = useCallback(async () => startOAuth('google'), [startOAuth])

  const register = useCallback(async () => startOAuth('google'), [startOAuth])

  const loginWithProvider = useCallback(async (provider = 'google') => startOAuth(provider), [startOAuth])

  const loginWithPassword = useCallback(async ({ email, password }) => {
    try {
      const normalizedEmail = normalizeEmail(email)
      const normalizedPassword = normalizePassword(password)

      if (!normalizedEmail || !normalizedPassword) {
        return { success: false, error: 'Email and password are required.', code: 'missing_credentials' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      })

      if (error) {
        throw error
      }

      return syncBackendAfterLogin(data?.session)
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to sign in with email and password.')
      clearSession()
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession, syncBackendAfterLogin])

  const registerWithPassword = useCallback(async ({ email, password }) => {
    try {
      const normalizedEmail = normalizeEmail(email)
      const normalizedPassword = normalizePassword(password)

      if (!normalizedEmail || !normalizedPassword) {
        return { success: false, error: 'Email and password are required.', code: 'missing_credentials' }
      }

      if (normalizedPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.', code: 'weak_password' }
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          emailRedirectTo: buildAbsoluteReturnUrl(AUTH_CALLBACK_PATH),
        },
      })

      if (error) {
        throw error
      }

      if (data?.session) {
        return syncBackendAfterLogin(data.session)
      }

      return {
        success: true,
        pendingConfirmation: true,
        email: normalizedEmail,
      }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to create an account with email and password.')
      clearSession()
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession, syncBackendAfterLogin])

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
      const normalized = normalizeOAuthProviderError(
        error,
        'Unable to complete Google sign-in.',
        'google'
      )
      clearSession()
      return { success: false, error: normalized.error, code: normalized.code }
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

      const apiRoutingIssue = getApiRoutingIssue()
      if (apiRoutingIssue) {
        return { success: false, error: apiRoutingIssue.message, code: apiRoutingIssue.code }
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
      const normalized = normalizeBackendError(error, 'Unable to update profile right now.', {
        authRoute: true,
      })
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [applySessionToken, token])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    loginWithPassword,
    registerWithPassword,
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
    loginWithPassword,
    loginWithProvider,
    logout,
    register,
    registerWithPassword,
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
