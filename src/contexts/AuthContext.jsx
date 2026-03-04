import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import supabase from '../services/supabaseClient'

const AuthContext = createContext()
const RETRYABLE_AUTH_ERROR_CODE = 'retryable_network_error'
const RETRYABLE_AUTH_ERROR_MESSAGE = 'Authentication service unavailable. Please try again shortly.'
const BACKEND_AUTH_ROUTE_ERROR_CODE = 'backend_auth_route_error'
const BACKEND_AUTH_MALFORMED_RESPONSE_CODE = 'backend_auth_malformed_response'
const BACKEND_AUTH_UNKNOWN_ERROR_CODE = 'backend_auth_unknown_error'
const BACKEND_AUTH_ERROR_MESSAGE_MAX_LENGTH = 280
const BACKEND_AUTH_ROUTE_ERROR_MESSAGE =
  'Unable to authenticate: /api/auth returned an HTML page. Verify API routing (for example VITE_API_URL) and ensure /api/auth resolves to your backend endpoint.'
const BACKEND_AUTH_SESSION_KEY = 'ailiteracy_backend_auth'
const BACKEND_JWT_SEGMENTS = 3
const GENERIC_BACKEND_REGISTRATION_ERRORS = new Set([
  'registration failed',
  'unable to complete registration right now.'
])

const isForcedBackendAuth = () => {
  return (import.meta.env.VITE_AUTH_MODE || '').toLowerCase().trim() === 'backend'
}

const shouldUseBackendAuth = () => {
  return isForcedBackendAuth() || !supabase
}

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
    created_at: backendUser.created_at
  }
}

const getStoredBackendSession = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const raw = window.localStorage.getItem(BACKEND_AUTH_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    const token = typeof parsed?.token === 'string' ? parsed.token.trim() : ''
    if (!token || token.split('.').length !== BACKEND_JWT_SEGMENTS) {
      window.localStorage.removeItem(BACKEND_AUTH_SESSION_KEY)
      return null
    }

    const tokenExp = (() => {
      try {
        const tokenPayload = token.split('.')[1]
        const padded = tokenPayload + '='.repeat((4 - (tokenPayload.length % 4)) % 4)
        const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(decoded)
        const exp = payload?.exp
        return typeof exp === 'number' ? exp * 1000 : null
      } catch {
        return null
      }
    })()

    if (tokenExp && tokenExp <= Date.now()) {
      console.warn('Stored backend auth token expired; clearing session.')
      window.localStorage.removeItem(BACKEND_AUTH_SESSION_KEY)
      return null
    }

    if (!parsed || typeof parsed !== 'object') {
      window.localStorage.removeItem(BACKEND_AUTH_SESSION_KEY)
      return null
    }

    return {
      token,
      user: mapBackendUser(parsed.user || null)
    }
  } catch (error) {
    console.warn('Failed to read stored backend auth session:', error)
    try {
      window.localStorage.removeItem(BACKEND_AUTH_SESSION_KEY)
    } catch (storageError) {
      console.warn('Failed to clear stale backend auth session:', storageError)
    }
    return null
  }
}

const saveBackendSession = (token, user) => {
  if (!token || typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(
      BACKEND_AUTH_SESSION_KEY,
      JSON.stringify({
        token,
        user: mapBackendUser(user),
        updated_at: Date.now()
      })
    )
  } catch (error) {
    console.warn('Failed to persist backend auth session:', error)
  }
}

const clearBackendSessionStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.removeItem(BACKEND_AUTH_SESSION_KEY)
  } catch (error) {
    console.warn('Failed to clear backend auth session:', error)
  }
}

const normalizeAuthError = (error, fallbackMessage) => {
  const message = String(error?.message || error || '').trim()
  const lowered = message.toLowerCase()
  const isRetryable =
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ERR_INTERNET_DISCONNECTED' ||
    (error?.request && !error?.response) ||
    lowered === 'network error' ||
    lowered.includes('failed to fetch') ||
    lowered.includes('network request failed') ||
    lowered.includes('network disconnected')

  if (isRetryable) {
    return {
      code: RETRYABLE_AUTH_ERROR_CODE,
      message: RETRYABLE_AUTH_ERROR_MESSAGE
    }
  }

  if (message) {
    return {
      code: 'auth_error',
      message
    }
  }

  return {
    code: 'auth_error',
    message: fallbackMessage
  }
}

const isGenericRegistrationError = (message) => {
  if (typeof message !== 'string') {
    return false
  }

  return GENERIC_BACKEND_REGISTRATION_ERRORS.has(message.trim().toLowerCase())
}

const sanitizeBackendErrorMessage = (value, maxLength = BACKEND_AUTH_ERROR_MESSAGE_MAX_LENGTH) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return ''
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 3)}...`
}

const extractBackendErrorCode = (payload) => {
  if (!payload) {
    return ''
  }

  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    return ''
  }

  if (Array.isArray(payload)) {
    for (const candidate of payload) {
      const code = extractBackendErrorCode(candidate)
      if (code) {
        return code
      }
    }
    return ''
  }

  if (typeof payload !== 'object') {
    return ''
  }

  if (typeof payload.code === 'string' && payload.code.trim()) {
    return payload.code.trim()
  }

  if (typeof payload.error_code === 'string' && payload.error_code.trim()) {
    return payload.error_code.trim()
  }

  if (typeof payload.errorCode === 'string' && payload.errorCode.trim()) {
    return payload.errorCode.trim()
  }

  return (
    extractBackendErrorCode(payload.error) ||
    extractBackendErrorCode(payload.message) ||
    extractBackendErrorCode(payload.data) ||
    extractBackendErrorCode(payload.details) ||
    extractBackendErrorCode(payload.detail)
  )
}

const extractBackendErrorMessage = (payload, { preferRegistrationDetails = false } = {}) => {
  if (preferRegistrationDetails && payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const genericRegistrationError = isGenericRegistrationError(payload.error)
    if (genericRegistrationError) {
      const detailsMessage =
        extractBackendErrorMessage(payload.details) ||
        extractBackendErrorMessage(payload.detail) ||
        extractBackendErrorMessage(payload.message)

      if (detailsMessage && !isGenericRegistrationError(detailsMessage)) {
        return detailsMessage
      }
    }
  }

  const candidates = [
    payload?.error,
    payload?.message,
    payload?.details,
    payload?.detail
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const message = sanitizeBackendErrorMessage(candidate)
      if (message) {
        return message
      }
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === 'string') {
          const message = sanitizeBackendErrorMessage(item)
          if (message) {
            return message
          }
        }
      }
    }

    if (candidate && typeof candidate === 'object') {
      const nestedMessage = extractBackendErrorMessage(candidate, { preferRegistrationDetails })
      if (nestedMessage) {
        return nestedMessage
      }
    }
  }

  return ''
}

const isHtmlLikePayload = (payload) => {
  if (typeof payload !== 'string') {
    return false
  }

  const trimmed = payload.trim().toLowerCase()
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<html')
  )
}

const normalizeBackendAuthPayload = (response, { fallbackMessage, requiresToken = false } = {}) => {
  const raw = response?.data
  if (isHtmlLikePayload(raw)) {
    return {
      success: false,
      code: BACKEND_AUTH_ROUTE_ERROR_CODE,
      message: BACKEND_AUTH_ROUTE_ERROR_MESSAGE
    }
  }

  const body =
    raw && typeof raw === 'object' && !Array.isArray(raw) && raw.data ? raw.data : raw

  if (!body || typeof body !== 'object') {
    return {
      success: false,
      code: BACKEND_AUTH_MALFORMED_RESPONSE_CODE,
      message: fallbackMessage || 'Backend authentication response was malformed.'
    }
  }

  const user = mapBackendUser(body.user || body.data?.user)
  if (requiresToken) {
    const token =
      typeof body.access_token === 'string'
        ? body.access_token.trim()
        : typeof body.token === 'string'
          ? body.token.trim()
          : ''

    if (!token || token.split('.').length !== BACKEND_JWT_SEGMENTS || !user) {
      return {
        success: false,
        code: BACKEND_AUTH_MALFORMED_RESPONSE_CODE,
        message: fallbackMessage || 'Backend authentication response was missing required data.'
      }
    }

    return { success: true, token, user }
  }

  const backendMessage = extractBackendErrorMessage(body) || extractBackendErrorMessage(raw)
  if (backendMessage) {
    return {
      success: false,
      code: 'auth_error',
      message: backendMessage
    }
  }

  if (!user) {
    return {
      success: false,
      code: BACKEND_AUTH_MALFORMED_RESPONSE_CODE,
      message: fallbackMessage || 'Backend authentication response was missing required data.'
    }
  }

  return { success: true, user }
}

const getBackendAuthError = (error, fallbackMessage, { preferRegistrationDetails = false } = {}) => {
  const data = error?.response?.data
  if (isHtmlLikePayload(data)) {
    return {
      code: BACKEND_AUTH_ROUTE_ERROR_CODE,
      message: BACKEND_AUTH_ROUTE_ERROR_MESSAGE
    }
  }

  const hasBackendResponse = Boolean(error?.response)
  const bodyData = data && typeof data === 'object' && !Array.isArray(data) && data.data ? data.data : data
  const backendCode =
    extractBackendErrorCode(bodyData) ||
    extractBackendErrorCode(data) ||
    (hasBackendResponse ? BACKEND_AUTH_UNKNOWN_ERROR_CODE : '')
  const backendMessage = extractBackendErrorMessage(bodyData, { preferRegistrationDetails })
  const detailsMessage =
    extractBackendErrorMessage(bodyData?.details, { preferRegistrationDetails }) ||
    extractBackendErrorMessage(bodyData?.detail, { preferRegistrationDetails }) ||
    extractBackendErrorMessage(data?.details, { preferRegistrationDetails }) ||
    extractBackendErrorMessage(data?.detail, { preferRegistrationDetails })
  const hasGenericRegistrationMessage = isGenericRegistrationError(backendMessage)

  if (backendMessage) {
    const finalMessage =
      hasGenericRegistrationMessage && preferRegistrationDetails && detailsMessage && !isGenericRegistrationError(detailsMessage)
        ? detailsMessage
        : backendMessage

    return {
      code: backendCode,
      message: finalMessage,
      details: detailsMessage
    }
  }

  if (backendCode) {
    return {
      code: backendCode,
      message: fallbackMessage || 'Backend authentication failed.'
    }
  }

  return normalizeAuthError(error, fallbackMessage)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const isBackendAuthMode = shouldUseBackendAuth()

  const syncBackendProfile = async (profile) => {
    if (!supabase) {
      return
    }

    if (!profile) {
      return
    }

    try {
      await axios.post('/api/auth/sync', profile)
    } catch (err) {
      console.warn('Failed to sync profile with backend:', err?.response?.data || err)
    }
  }

  const clearBackendSession = () => {
    setSession(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    clearBackendSessionStorage()
  }

  const setBackendSession = (backendToken, backendUser, persist = true) => {
    setSession(backendToken ? { access_token: backendToken } : null)
    setUser(mapBackendUser(backendUser))

    if (backendToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`
      if (persist) {
        saveBackendSession(backendToken, backendUser)
      }
      return
    }

    clearBackendSessionStorage()
  }

  useEffect(() => {
    if (isBackendAuthMode) {
      let isMounted = true

      const initialize = async () => {
        try {
      const stored = getStoredBackendSession()
          if (!stored?.token) {
            if (isMounted) {
              clearBackendSession()
            }
            return
          }

          if (isMounted) {
            setBackendSession(stored.token, stored.user, true)
          }

          const { data } = await axios.get('/api/auth/profile')
          const normalizedProfile = normalizeBackendAuthPayload(
            { data },
            { fallbackMessage: 'Unable to load backend auth profile.' }
          )
          if (!normalizedProfile.success) {
            if (normalizedProfile.code === BACKEND_AUTH_ROUTE_ERROR_CODE) {
              console.error('Backend auth profile route is misconfigured:', normalizedProfile.message)
            }
            return
          }

          const mapped = normalizedProfile.user

          if (!mapped?.id || !isMounted) {
            if (isMounted) {
              clearBackendSession()
            }
            return
          }

          if (isMounted) {
            setBackendSession(stored.token, mapped, true)
          }
        } catch (error) {
          const status = error?.response?.status
          if (!isMounted) {
            return
          }

          if (status === 401 || status === 403 || status === 404) {
            clearBackendSession()
            return
          }

          console.warn(
            'Backend auth session restore failed; keeping local session for retry:',
            error?.response?.data || error
          )
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }

      initialize()

      return () => {
        isMounted = false
      }
    }

    if (!supabase) {
      console.error('Supabase client is not initialized. Check environment variables.')
      clearBackendSession()
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
          const mapped = mapSupabaseUser(data.session?.user)
          setUser(mapped)
          if (data.session?.user) {
            await syncBackendProfile({
              id: mapped?.id,
              email: mapped?.email,
              first_name: mapped?.first_name,
              last_name: mapped?.last_name,
              role: mapped?.role,
              organization: mapped?.organization
            })
          }
        }
      } catch (err) {
        console.error('Unexpected Supabase auth error:', err)
      } finally {
        setLoading(false)
      }
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      const mappedUser = mapSupabaseUser(newSession?.user)
      setUser(mappedUser)

      if (newSession?.user) {
        await syncBackendProfile({
          id: mappedUser?.id,
          email: mappedUser?.email,
          first_name: mappedUser?.first_name,
          last_name: mappedUser?.last_name,
          role: mappedUser?.role,
          organization: mappedUser?.organization
        })
      }
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

  const login = async (email, password) => {
    if (isBackendAuthMode) {
      try {
        const response = await axios.post('/api/auth/login', {
          email: String(email || '').trim().toLowerCase(),
          password
        })

        const normalized = normalizeBackendAuthPayload(response, {
          fallbackMessage: 'Backend authentication response was missing required data.',
          requiresToken: true
        })
        if (!normalized.success) {
          return {
            success: false,
            error: normalized.message,
            code: normalized.code
          }
        }

        setBackendSession(normalized.token, normalized.user, true)

        return { success: true, user: normalized.user }
      } catch (error) {
        const normalized = getBackendAuthError(error, 'Unable to sign in right now.')
        return { success: false, error: normalized.message, code: normalized.code }
      }
    }

    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const normalized = normalizeAuthError(error, 'Unable to sign in right now.')
        return { success: false, error: normalized.message, code: normalized.code }
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
    } catch (err) {
      const normalized = normalizeAuthError(err, 'Unable to sign in right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const register = async (userData) => {
    if (isBackendAuthMode) {
      try {
        const response = await axios.post('/api/auth/register', {
          email: String(userData.email || '').trim().toLowerCase(),
          password: userData.password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          organization: userData.organization
        })

        const normalized = normalizeBackendAuthPayload(response, {
          fallbackMessage: 'Backend registration response was missing required data.',
          requiresToken: true
        })
        if (!normalized.success) {
          return {
            success: false,
            error: normalized.message,
            code: normalized.code
          }
        }

        setBackendSession(normalized.token, normalized.user, true)

        return {
          success: true,
          user: normalized.user,
          requiresEmailConfirmation: false
        }
      } catch (error) {
        const normalized = getBackendAuthError(
          error,
          'Unable to complete registration right now.',
          { preferRegistrationDetails: true }
        )
        return {
          success: false,
          error: normalized.message,
          code: normalized.code,
          details: normalized.details
        }
      }
    }

    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
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
        const normalized = normalizeAuthError(error, 'Unable to complete registration right now.')
        return { success: false, error: normalized.message, code: normalized.code }
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
    } catch (err) {
      const normalized = normalizeAuthError(err, 'Unable to complete registration right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const logout = async () => {
    if (isBackendAuthMode) {
      clearBackendSession()
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
    if (isBackendAuthMode) {
      try {
        const response = await axios.put('/api/auth/profile', {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          role: profileData.role || '',
          organization: profileData.organization || ''
        })

        const normalized = normalizeBackendAuthPayload(response, {
          fallbackMessage: 'Failed to load updated profile.'
        })
        if (!normalized.success) {
          return { success: false, error: normalized.message, code: normalized.code }
        }

        setBackendSession(session?.access_token, normalized.user, true)
        return { success: true, user: normalized.user }
      } catch (error) {
        const normalized = getBackendAuthError(error, 'Unable to update profile right now.')
        return { success: false, error: normalized.message, code: normalized.code }
      }
    }

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

  const loginWithProvider = async (provider) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        const normalized = normalizeAuthError(error, 'Unable to start social sign-in right now.')
        return { success: false, error: normalized.message, code: normalized.code }
      }

      return { success: true, data }
    } catch (err) {
      const normalized = normalizeAuthError(err, 'Unable to start social sign-in right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const requestPasswordReset = async (email) => {
    if (isBackendAuthMode) {
      return {
        success: false,
        error: 'Password reset is not available in backend authentication mode.'
      }
    }

    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const normalizedEmail = (email || '').trim()
    if (!normalizedEmail) {
      return { success: false, error: 'Email is required' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/login`
      })

      if (error) {
        const normalized = normalizeAuthError(error, 'Unable to send password reset email right now.')
        return { success: false, error: normalized.message, code: normalized.code }
      }

      return { success: true }
    } catch (err) {
      const normalized = normalizeAuthError(err, 'Unable to send password reset email right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const syncBackendAfterLogin = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase.auth.getSession()
      const mapped = mapSupabaseUser(data.session?.user)
      if (!mapped) return
      await syncBackendProfile({
        id: mapped.id,
        email: mapped.email,
        first_name: mapped.first_name,
        last_name: mapped.last_name,
        role: mapped.role,
        organization: mapped.organization
      })
      setSession(data.session)
      setUser(mapped)
    } catch (err) {
      console.warn('Failed to finalize login sync:', err)
    }
  }

  const value = {
    user,
    token: session?.access_token || null,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithProvider,
    requestPasswordReset,
    syncBackendAfterLogin,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
