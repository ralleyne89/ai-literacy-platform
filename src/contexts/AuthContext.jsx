import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react'
import axios from 'axios'
import {
  clearStoredAuthReturnTo,
  getStoredAuthReturnTo,
} from '../config/authRoutes'
import { AUTH_ENDPOINTS } from '../config/apiEndpoints'

const AuthContext = createContext()
const CLERK_AUTH_MODE = 'clerk'
const DEMO_AUTH_MODE = 'demo'
const INVALID_AUTH_MODE = '__invalid_auth_mode__'
const CLERK_AUTH_ERROR_MESSAGE = 'Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY.'


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
    code: error?.response?.data?.code || 'auth_error',
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
    return CLERK_AUTH_MODE
  }

  if (configured === DEMO_AUTH_MODE) {
    return DEMO_AUTH_MODE
  }

  if (configured !== CLERK_AUTH_MODE) {
    console.error(`Unsupported VITE_AUTH_MODE="${configured}". Supported values: clerk, demo.`)
    return INVALID_AUTH_MODE
  }

  return CLERK_AUTH_MODE
}

const getClerkPublishableKey = () => String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim()

const isClerkConfigured = () => Boolean(getClerkPublishableKey())

const getDefaultAuthReturnTo = () => getStoredAuthReturnTo() || '/dashboard'

const buildAbsoluteReturnUrl = (path = '/dashboard') => {
  if (typeof window === 'undefined') {
    return path
  }

  const normalizedPath = String(path || '/dashboard').startsWith('/') ? path : '/dashboard'
  return `${window.location.origin}${normalizedPath}`
}

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
    return () => {
      delete axios.defaults.headers.common.Authorization
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
    isAuthenticated: true,
  }), [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const ClerkSessionAuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const clerk = useClerk()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    delete axios.defaults.headers.common.Authorization
  }, [])

  const syncBackendAfterLogin = useCallback(async () => {
    try {
      const clerkToken = await getToken()
      if (!clerkToken) {
        clearSession()
        return { success: false, error: 'Missing Clerk session token.' }
      }

      axios.defaults.headers.common.Authorization = `Bearer ${clerkToken}`
      const response = await axios.get(AUTH_ENDPOINTS.profile)
      const normalized = normalizeProfileResponse(
        response,
        'Unable to load your profile from the backend.'
      )
      if (!normalized.success) {
        clearSession()
        return { success: false, error: normalized.message, code: normalized.code }
      }

      setToken(clerkToken)
      setUser(normalized.user)
      return { success: true, user: normalized.user }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to load your account right now.')
      clearSession()
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession, getToken])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      if (!isLoaded) {
        return
      }

      if (!isSignedIn) {
        clearSession()
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      if (isMounted) {
        setLoading(true)
      }

      const result = await syncBackendAfterLogin()
      if (!result.success) {
        clearSession()
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [clearSession, isLoaded, isSignedIn, syncBackendAfterLogin])

  const login = useCallback(async () => {
    try {
      const returnTo = buildAbsoluteReturnUrl(getDefaultAuthReturnTo())
      await clerk.redirectToSignIn({
        fallbackRedirectUrl: returnTo,
        forceRedirectUrl: returnTo,
        signUpFallbackRedirectUrl: returnTo,
        signUpForceRedirectUrl: returnTo,
      })
      return { success: true }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to start Clerk sign-in.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clerk])

  const register = useCallback(async () => {
    try {
      const returnTo = buildAbsoluteReturnUrl(getDefaultAuthReturnTo())
      await clerk.redirectToSignUp({
        fallbackRedirectUrl: returnTo,
        forceRedirectUrl: returnTo,
        signInFallbackRedirectUrl: returnTo,
        signInForceRedirectUrl: returnTo,
      })
      return { success: true }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to start Clerk sign-up.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clerk])

  const logout = useCallback(async () => {
    clearSession()
    clearStoredAuthReturnTo()

    try {
      await clerk.signOut({ redirectUrl: typeof window === 'undefined' ? '/' : window.location.origin })
      return { success: true, redirected: true }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to sign out right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [clearSession, clerk])

  const updateProfile = useCallback(async (profileData) => {
    try {
      const activeToken = token || await getToken()
      if (!activeToken) {
        return { success: false, error: 'Missing Clerk session token.' }
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

      setToken(activeToken)
      setUser(normalized.user)
      return { success: true, user: normalized.user }
    } catch (error) {
      const normalized = normalizeBackendError(error, 'Unable to update profile right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }, [getToken, token])

  const value = useMemo(() => ({
    user,
    token,
    loading: !isLoaded || loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithProvider: async () => ({
      success: false,
      error: 'Social sign-in is managed directly by Clerk on the hosted auth pages.',
    }),
    requestPasswordReset: async () => ({
      success: false,
      error: 'Password reset is managed by Clerk.',
    }),
    syncBackendAfterLogin,
    isAuthenticated: Boolean(user) && Boolean(isSignedIn),
  }), [
    isLoaded,
    isSignedIn,
    loading,
    login,
    logout,
    register,
    syncBackendAfterLogin,
    token,
    updateProfile,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const ClerkAuthProvider = ({ children }) => (
  <ClerkProvider publishableKey={getClerkPublishableKey()}>
    <ClerkSessionAuthProvider>{children}</ClerkSessionAuthProvider>
  </ClerkProvider>
)

export const AuthProvider = ({ children }) => {
  const authMode = getConfiguredAuthMode()

  if (authMode === DEMO_AUTH_MODE) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>
  }

  if (authMode !== CLERK_AUTH_MODE || !isClerkConfigured()) {
    return (
      <AuthContext.Provider value={buildUnavailableAuthValue(CLERK_AUTH_ERROR_MESSAGE)}>
        {children}
      </AuthContext.Provider>
    )
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>
}
