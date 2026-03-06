import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  AUTH0_CALLBACK_PATH,
  clearStoredAuthReturnTo,
  getStoredAuthReturnTo
} from '../config/authRoutes'
import { AUTH_ENDPOINTS, API_BASE_URL } from '../config/apiEndpoints'

const AuthContext = createContext()
const AUTH0_AUTH_MODE = 'auth0'
const BACKEND_AUTH_MODE = 'backend'
const AUTO_AUTH_MODE = 'auto'
const SUPABASE_AUTH_MODE = 'supabase'
const INVALID_AUTH_MODE = '__invalid_auth_mode__'
const PRODUCTION_AUTH_MODES = new Set([AUTH0_AUTH_MODE, BACKEND_AUTH_MODE, SUPABASE_AUTH_MODE])
const KNOWN_AUTH_MODES = new Set([AUTO_AUTH_MODE, ...PRODUCTION_AUTH_MODES])
const RETRYABLE_AUTH_ERROR_CODE = 'retryable_network_error'
const RETRYABLE_AUTH_ERROR_MESSAGE = 'Authentication service unavailable. Please try again shortly.'
const BACKEND_AUTH_ROUTE_ERROR_CODE = 'backend_auth_route_error'
const BACKEND_AUTH_MALFORMED_RESPONSE_CODE = 'backend_auth_malformed_response'
const BACKEND_AUTH_UNKNOWN_ERROR_CODE = 'backend_auth_unknown_error'
const BACKEND_AUTH_ERROR_MESSAGE_MAX_LENGTH = 280
const AUTH0_AUTH_LOGIN_ERROR_MESSAGE = 'Auth0 is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID.'
const BACKEND_AUTH_ROUTE_ERROR_MESSAGE =
  'Unable to authenticate: /api/auth returned an HTML page. Verify API routing (for example VITE_API_URL) and ensure /api/auth resolves to your backend endpoint.'
const AUTH0_SCOPE = 'openid profile email'
const AUTH0_EXCHANGE_REQUEST_TIMEOUT_MS = 15000
const BACKEND_AUTH_SESSION_KEY = 'ailiteracy_backend_auth'
const BACKEND_JWT_SEGMENTS = 3
const GENERIC_BACKEND_REGISTRATION_ERRORS = new Set([
  'registration failed',
  'unable to complete registration right now.'
])

const getConfiguredAuthMode = () => {
  const configuredMode = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase().trim()

  if (!configuredMode) {
    if (import.meta.env.PROD) {
      console.error('VITE_AUTH_MODE is required in production builds.')
      return INVALID_AUTH_MODE
    }
    return AUTO_AUTH_MODE
  }

  if (!KNOWN_AUTH_MODES.has(configuredMode)) {
    console.error(`Unsupported VITE_AUTH_MODE="${configuredMode}". Supported values: auto, backend, supabase, auth0.`)
    return import.meta.env.PROD ? INVALID_AUTH_MODE : AUTO_AUTH_MODE
  }

  if (import.meta.env.PROD && configuredMode === AUTO_AUTH_MODE) {
    console.error('VITE_AUTH_MODE="auto" is not allowed in production. Set it explicitly to backend, supabase, or auth0.')
    return INVALID_AUTH_MODE
  }

  if (import.meta.env.PROD && !PRODUCTION_AUTH_MODES.has(configuredMode)) {
    console.error(`Unsupported production auth mode "${configuredMode}".`)
    return INVALID_AUTH_MODE
  }

  return configuredMode
}

const getBackendAuthEndpoint = (requestPath = '/api/auth') => {
  let resolvedPath = String(requestPath || '').trim()
  if (!resolvedPath) {
    return AUTH_ENDPOINTS.base
  }

  if (/^https?:\/\//i.test(resolvedPath)) {
    try {
      resolvedPath = new URL(resolvedPath).pathname
    } catch {
      // Keep original value if URL parsing fails.
    }
  }

  const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`
  const pathWithoutQuery = normalizedPath.split('?')[0].replace(/\/+$/, '')

  switch (pathWithoutQuery) {
    case '/api/auth':
      return AUTH_ENDPOINTS.base
    case '/api/auth/login':
      return AUTH_ENDPOINTS.login
    case '/api/auth/register':
      return AUTH_ENDPOINTS.register
    case '/api/auth/exchange':
      return AUTH_ENDPOINTS.exchange
    case '/api/auth/profile':
      return AUTH_ENDPOINTS.profile
    default:
      return AUTH_ENDPOINTS.base
  }
}

const getDebugAuthMode = () => {
  const configuredMode = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase().trim()
  if (!configuredMode) {
    return import.meta.env.PROD ? '(missing)' : AUTO_AUTH_MODE
  }
  return configuredMode
}

if (import.meta.env.PROD) {
  console.info('[AuthContext] configured auth mode:', getDebugAuthMode())
  if (API_BASE_URL) {
    console.info('[AuthContext] configured API base:', API_BASE_URL)
  }
} else {
  console.info('[AuthContext] configured auth mode:', getDebugAuthMode())
}

const resolveAuthMode = () => {
  const configuredMode = getConfiguredAuthMode()
  if (configuredMode === INVALID_AUTH_MODE) {
    return configuredMode
  }

  if (configuredMode !== AUTO_AUTH_MODE) {
    return configuredMode
  }
  return BACKEND_AUTH_MODE
}

const buildAuth0ConnectionName = (provider) => {
  const normalized = String(provider || '').toLowerCase().trim()
  if (!normalized) {
    return ''
  }
  if (normalized === 'google') {
    return 'google-oauth2'
  }
  if (normalized === 'facebook') {
    return 'facebook'
  }
  return normalized
}

const getAuth0Domain = () => String(import.meta.env.VITE_AUTH0_DOMAIN || '').trim().replace(/\/+$/, '')

const getAuth0ClientId = () => String(import.meta.env.VITE_AUTH0_CLIENT_ID || '').trim()

const getAuth0Audience = () => String(import.meta.env.VITE_AUTH0_AUDIENCE || '').trim()

const getAuth0RedirectUri = () => {
  const configured = String(import.meta.env.VITE_AUTH0_REDIRECT_URI || '').trim()
  if (configured) {
    return configured
  }
  if (typeof window === 'undefined') {
    return ''
  }
  return `${window.location.origin}${AUTH0_CALLBACK_PATH}`
}

const normalizeAuth0DomainForSdk = () => {
  const rawDomain = getAuth0Domain()
  if (!rawDomain) {
    return ''
  }

  try {
    const parsed = new URL(rawDomain.includes('://') ? rawDomain : `https://${rawDomain}`)
    return parsed.hostname
  } catch {
    return rawDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  }
}

const isAuth0ClientConfigured = () =>
  Boolean(normalizeAuth0DomainForSdk() && getAuth0ClientId() && getAuth0RedirectUri())

const getDefaultAuthReturnTo = () => getStoredAuthReturnTo() || '/dashboard'

const getAuth0AuthorizationParams = () => {
  const params = {
    redirect_uri: getAuth0RedirectUri(),
    scope: AUTH0_SCOPE
  }
  const audience = getAuth0Audience()

  if (audience) {
    params.audience = audience
  }

  return params
}

const buildAuth0RedirectOptions = ({ provider = '', loginHint = '', screenHint = '' } = {}) => {
  if (!isAuth0ClientConfigured()) {
    return null
  }

  const authorizationParams = {
    ...getAuth0AuthorizationParams()
  }
  const connection = buildAuth0ConnectionName(provider)

  if (connection) {
    authorizationParams.connection = connection
  }

  if (screenHint) {
    authorizationParams.screen_hint = screenHint
  }

  if (loginHint) {
    authorizationParams.login_hint = loginHint
  }

  return {
    appState: {
      returnTo: getDefaultAuthReturnTo()
    },
    authorizationParams
  }
}

const getAuth0AccessTokenOptions = () => {
  const audience = getAuth0Audience()
  if (!audience) {
    return undefined
  }

  return {
    authorizationParams: {
      audience,
      scope: AUTH0_SCOPE
    }
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
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
  const status = error?.response?.status
  const requestPath = error?.response?.config?.url
  const route = requestPath ? requestPath.split('?')[0] : '/api/auth'
  const endpoint = getBackendAuthEndpoint(route)

  if (status === 404 || status === 405) {
    return {
      code: BACKEND_AUTH_ROUTE_ERROR_CODE,
      message: `Unable to reach backend auth route at ${endpoint}. Check VITE_API_URL and deployment routing.`
    }
  }

  const contentType = error?.response?.headers?.['content-type'] || error?.response?.headers?.get?.('content-type')
  if (typeof contentType === 'string' && contentType.toLowerCase().includes('text/html')) {
    return {
      code: BACKEND_AUTH_ROUTE_ERROR_CODE,
      message: BACKEND_AUTH_ROUTE_ERROR_MESSAGE
    }
  }

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

const buildUnavailableAuthValue = (errorMessage = 'Authentication mode is not configured.') => ({
  user: null,
  token: null,
  loading: false,
  login: async () => ({ success: false, error: errorMessage }),
  register: async () => ({ success: false, error: errorMessage }),
  logout: async () => ({ success: false, error: errorMessage }),
  updateProfile: async () => ({
    success: false,
    error: 'Profile updates are not supported in this authentication mode.'
  }),
  loginWithProvider: async () => ({
    success: false,
    error: 'Social provider login is only supported in Auth0 mode.'
  }),
  requestPasswordReset: async () => ({
    success: false,
    error: 'Password reset is not available in this authentication mode.'
  }),
  syncBackendAfterLogin: async () => false,
  isAuthenticated: false
})

const useBackendSessionStore = () => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)

  const clearBackendSession = useCallback(() => {
    setSession(null)
    setUser(null)
    delete axios.defaults.headers.common.Authorization
    clearBackendSessionStorage()
  }, [])

  const setBackendSession = useCallback((backendToken, backendUser, persist = true) => {
    setSession(backendToken ? { access_token: backendToken } : null)
    setUser(mapBackendUser(backendUser))

    if (backendToken) {
      axios.defaults.headers.common.Authorization = `Bearer ${backendToken}`
      if (persist) {
        saveBackendSession(backendToken, backendUser)
      }
      return
    }

    clearBackendSessionStorage()
  }, [])

  return {
    user,
    session,
    clearBackendSession,
    setBackendSession
  }
}

const restoreStoredBackendSession = async ({ setBackendSession, clearBackendSession }) => {
  const stored = getStoredBackendSession()
  if (!stored?.token) {
    clearBackendSession()
    return false
  }

  setBackendSession(stored.token, stored.user, true)

  try {
    const { data } = await axios.get(AUTH_ENDPOINTS.profile)
    const normalizedProfile = normalizeBackendAuthPayload(
      { data },
      { fallbackMessage: 'Unable to load backend auth profile.' }
    )

    if (!normalizedProfile.success || !normalizedProfile.user) {
      clearBackendSession()
      return false
    }

    setBackendSession(stored.token, normalizedProfile.user, true)
    return {
      success: true,
      token: stored.token,
      user: normalizedProfile.user
    }
  } catch (error) {
    const status = error?.response?.status
    if (status === 401 || status === 403 || status === 404) {
      clearBackendSession()
      return false
    }

    console.warn(
      'Backend auth session restore failed; keeping local session for retry:',
      error?.response?.data || error
    )
    return {
      success: true,
      token: stored.token,
      user: stored.user
    }
  }
}

const Auth0SdkProvider = ({ children }) => {
  const navigate = useNavigate()

  const handleRedirectCallback = useCallback((appState) => {
    navigate(AUTH0_CALLBACK_PATH, {
      replace: true,
      state: {
        returnTo: appState?.returnTo || getDefaultAuthReturnTo()
      }
    })
  }, [navigate])

  return (
    <Auth0Provider
      domain={normalizeAuth0DomainForSdk()}
      clientId={getAuth0ClientId()}
      authorizationParams={getAuth0AuthorizationParams()}
      onRedirectCallback={handleRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}

const BackendSessionAuthProvider = ({ children }) => {
  const { user, session, clearBackendSession, setBackendSession } = useBackendSessionStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      const restored = await restoreStoredBackendSession({
        setBackendSession,
        clearBackendSession
      })

      if (!isMounted) {
        return
      }

      if (!restored) {
        clearBackendSession()
      }
      setLoading(false)
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [clearBackendSession, setBackendSession])

  const login = async (email, password) => {
    try {
      const response = await axios.post(AUTH_ENDPOINTS.login, {
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

  const register = async (userData) => {
    try {
      const response = await axios.post(AUTH_ENDPOINTS.register, {
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

  const logout = async () => {
    clearBackendSession()
    clearStoredAuthReturnTo()
    return { success: true }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(AUTH_ENDPOINTS.profile, {
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

  const value = {
    user,
    token: session?.access_token || null,
    loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithProvider: async () => ({
      success: false,
      error: 'Social provider login is only supported in Auth0 mode.'
    }),
    requestPasswordReset: async () => ({
      success: false,
      error: 'Password reset is not available in backend authentication mode.'
    }),
    syncBackendAfterLogin: async () => {
      const restored = await restoreStoredBackendSession({
        setBackendSession,
        clearBackendSession
      })
      return restored || false
    },
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const Auth0SessionAuthProvider = ({ children }) => {
  const { user, session, clearBackendSession, setBackendSession } = useBackendSessionStore()
  const [loading, setLoading] = useState(true)
  const {
    error: auth0Error,
    getAccessTokenSilently,
    isAuthenticated: hasAuth0Session,
    isLoading: isAuth0Loading,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0()

  const exchangeAuth0Token = useCallback(async ({
    accessToken = '',
    authCode = '',
    codeVerifier = '',
    redirectUri = ''
  } = {}) => {
    const auth0AccessToken = typeof accessToken === 'string' ? accessToken.trim() : ''
    const auth0Code = typeof authCode === 'string' ? authCode.trim() : ''
    const auth0CodeVerifier = typeof codeVerifier === 'string' ? codeVerifier.trim() : ''
    const auth0RedirectUri = typeof redirectUri === 'string' ? redirectUri.trim() : ''

    if (!auth0AccessToken && !auth0Code) {
      return {
        success: false,
        code: 'auth0_missing_credentials',
        error: 'Auth0 session did not provide an access token or authorization code.'
      }
    }

    if (auth0Code && !auth0CodeVerifier) {
      return {
        success: false,
        code: 'auth0_pkce_verifier_missing',
        error: 'Missing PKCE verifier for Auth0 code exchange.'
      }
    }

    if (auth0Code && !auth0RedirectUri) {
      return {
        success: false,
        code: 'auth0_redirect_uri_missing',
        error: 'Missing redirect URI for Auth0 code exchange.'
      }
    }

    const exchangePayload = auth0AccessToken
      ? { access_token: auth0AccessToken }
      : {
          code: auth0Code,
          code_verifier: auth0CodeVerifier,
          redirect_uri: auth0RedirectUri || getAuth0RedirectUri()
        }

    try {
      const response = await axios.post(
        AUTH_ENDPOINTS.exchange,
        exchangePayload,
        { timeout: AUTH0_EXCHANGE_REQUEST_TIMEOUT_MS }
      )

      const normalized = normalizeBackendAuthPayload(response, {
        fallbackMessage: 'Unable to exchange Auth0 token.',
        requiresToken: true
      })
      if (!normalized.success) {
        return {
          success: false,
          code: normalized.code,
          error: normalized.message
        }
      }

      setBackendSession(normalized.token, normalized.user, true)
      return {
        success: true,
        user: normalized.user,
        code: 'auth0_exchange_success'
      }
    } catch (error) {
      const normalized = getBackendAuthError(error, 'Unable to exchange Auth0 credentials.')
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearBackendSession()
      }

      return {
        success: false,
        code: normalized.code || BACKEND_AUTH_UNKNOWN_ERROR_CODE,
        error: normalized.message,
        details: normalized.details,
        status: error?.response?.status
      }
    }
  }, [clearBackendSession, setBackendSession])

  const syncBackendAfterLogin = useCallback(async ({
    auth0AccessToken = '',
    auth0Code = '',
    auth0CodeVerifier = '',
    auth0RedirectUri = ''
  } = {}) => {
    if (auth0Error) {
      return {
        success: false,
        code: 'auth0_sdk_error',
        error: auth0Error.message || 'Unable to restore the Auth0 session.'
      }
    }

    if (!hasAuth0Session && !auth0AccessToken && !auth0Code) {
      clearBackendSession()
      return false
    }

    if (auth0AccessToken || auth0Code) {
      return exchangeAuth0Token({
        accessToken: auth0AccessToken,
        authCode: auth0Code,
        codeVerifier: auth0CodeVerifier,
        redirectUri: auth0RedirectUri || getAuth0RedirectUri()
      })
    }

    try {
      const accessToken = await getAccessTokenSilently(getAuth0AccessTokenOptions())
      return exchangeAuth0Token({ accessToken })
    } catch (error) {
      const normalized = normalizeAuthError(error, 'Unable to refresh the Auth0 session.')
      clearBackendSession()
      return {
        success: false,
        code: normalized.code,
        error: normalized.message
      }
    }
  }, [
    auth0Error,
    clearBackendSession,
    exchangeAuth0Token,
    getAccessTokenSilently,
    hasAuth0Session
  ])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      if (isAuth0Loading) {
        return
      }

      if (!hasAuth0Session) {
        if (isMounted) {
          clearBackendSession()
          setLoading(false)
        }
        return
      }

      if (isMounted) {
        setLoading(true)
      }

      const restored = await restoreStoredBackendSession({
        setBackendSession,
        clearBackendSession
      })
      if (restored) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      const exchangeResult = await syncBackendAfterLogin()
      if (!exchangeResult?.success) {
        clearBackendSession()
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [
    clearBackendSession,
    hasAuth0Session,
    isAuth0Loading,
    setBackendSession,
    syncBackendAfterLogin
  ])

  const startAuth0Redirect = async (options = {}) => {
    if (!isAuth0ClientConfigured()) {
      return {
        success: false,
        error: AUTH0_AUTH_LOGIN_ERROR_MESSAGE
      }
    }

    try {
      await loginWithRedirect(options)
      return { success: true }
    } catch (error) {
      const normalized = normalizeAuthError(error, 'Unable to start Auth0 sign-in.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const login = async (email) =>
    startAuth0Redirect(
      buildAuth0RedirectOptions({
        loginHint: String(email || '').trim().toLowerCase()
      }) || {}
    )

  const register = async (userData) =>
    startAuth0Redirect(
      buildAuth0RedirectOptions({
        loginHint: String(userData?.email || '').trim().toLowerCase(),
        screenHint: 'signup'
      }) || {}
    )

  const logout = async () => {
    clearBackendSession()
    clearStoredAuthReturnTo()

    try {
      await auth0Logout({
        logoutParams: {
          returnTo: typeof window === 'undefined' ? undefined : window.location.origin
        }
      })
      return { success: true, redirected: true }
    } catch (error) {
      const normalized = normalizeAuthError(error, 'Unable to sign out right now.')
      return { success: false, error: normalized.message, code: normalized.code }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(AUTH_ENDPOINTS.profile, {
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

  const loginWithProvider = async (provider) =>
    startAuth0Redirect(
      buildAuth0RedirectOptions({
        provider
      }) || {}
    )

  const value = {
    user,
    token: session?.access_token || null,
    loading: loading || isAuth0Loading,
    login,
    register,
    logout,
    updateProfile,
    loginWithProvider,
    requestPasswordReset: async () => ({
      success: false,
      error: 'Password reset is handled in Auth0.'
    }),
    syncBackendAfterLogin,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const AuthProvider = ({ children }) => {
  const authMode = resolveAuthMode()

  if (authMode === AUTH0_AUTH_MODE) {
    if (!isAuth0ClientConfigured()) {
      return (
        <AuthContext.Provider value={buildUnavailableAuthValue(AUTH0_AUTH_LOGIN_ERROR_MESSAGE)}>
          {children}
        </AuthContext.Provider>
      )
    }

    return (
      <Auth0SdkProvider>
        <Auth0SessionAuthProvider>{children}</Auth0SessionAuthProvider>
      </Auth0SdkProvider>
    )
  }

  if (authMode === BACKEND_AUTH_MODE) {
    return <BackendSessionAuthProvider>{children}</BackendSessionAuthProvider>
  }

  return (
    <AuthContext.Provider value={buildUnavailableAuthValue()}>
      {children}
    </AuthContext.Provider>
  )
}
