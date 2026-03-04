import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { AUTH0_CALLBACK_PATH } from '../config/authRoutes'

const AuthContext = createContext()
const AUTH0_AUTH_MODE = 'auth0'
const BACKEND_AUTH_MODE = 'backend'
const AUTO_AUTH_MODE = 'auto'
const RETRYABLE_AUTH_ERROR_CODE = 'retryable_network_error'
const RETRYABLE_AUTH_ERROR_MESSAGE = 'Authentication service unavailable. Please try again shortly.'
const BACKEND_AUTH_ROUTE_ERROR_CODE = 'backend_auth_route_error'
const BACKEND_AUTH_MALFORMED_RESPONSE_CODE = 'backend_auth_malformed_response'
const BACKEND_AUTH_UNKNOWN_ERROR_CODE = 'backend_auth_unknown_error'
const BACKEND_AUTH_ERROR_MESSAGE_MAX_LENGTH = 280
const AUTH0_AUTH_LOGIN_ERROR_MESSAGE = 'Auth0 is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID.'
const BACKEND_AUTH_ROUTE_ERROR_MESSAGE =
  'Unable to authenticate: /api/auth returned an HTML page. Verify API routing (for example VITE_API_URL) and ensure /api/auth resolves to your backend endpoint.'
const AUTH0_RESPONSE_TYPE = 'code'
const AUTH0_SCOPE = 'openid profile email'
const BACKEND_AUTH_SESSION_KEY = 'ailiteracy_backend_auth'
const AUTH0_CODE_VERIFIER_SESSION_KEY = 'ailiteracy_auth0_code_verifier'
const AUTH0_STATE_SESSION_KEY = 'ailiteracy_auth0_state'
const AUTH0_PKCE_VERIFIER_BYTES = 32
const BACKEND_JWT_SEGMENTS = 3
const GENERIC_BACKEND_REGISTRATION_ERRORS = new Set([
  'registration failed',
  'unable to complete registration right now.'
])

const getConfiguredApiBaseUrl = () => {
  return (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
}

const getBackendAuthEndpointLabel = (path = '/api/auth') => {
  const apiBase = getConfiguredApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return apiBase ? `${apiBase}${normalizedPath}` : `same-site${normalizedPath}`
}

const getConfiguredAuthMode = () => {
  const configuredMode = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase().trim()
  if (
    configuredMode === AUTH0_AUTH_MODE ||
    configuredMode === BACKEND_AUTH_MODE
  ) {
    return configuredMode
  }

  return AUTO_AUTH_MODE
}

const resolveAuthMode = () => {
  const configuredMode = getConfiguredAuthMode()
  if (configuredMode !== AUTO_AUTH_MODE) {
    return configuredMode
  }
  return BACKEND_AUTH_MODE
}

const isBackendSessionMode = () => {
  const mode = resolveAuthMode()
  return mode === BACKEND_AUTH_MODE || mode === AUTH0_AUTH_MODE
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

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const toBase64Url = (value) => {
  try {
    const raw = btoa(String.fromCharCode(...new Uint8Array(value)))
    return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    return ''
  }
}

const generateAuth0RandomValue = () => {
  if (
    typeof window === 'undefined' ||
    !window.crypto ||
    typeof window.crypto.getRandomValues !== 'function'
  ) {
    return ''
  }

  try {
    const randomValues = new Uint8Array(AUTH0_PKCE_VERIFIER_BYTES)
    window.crypto.getRandomValues(randomValues)
    return toBase64Url(randomValues)
  } catch {
    return ''
  }
}

const generateCodeVerifier = () => generateAuth0RandomValue()

const generateState = () => generateAuth0RandomValue()

const generateCodeChallenge = async (codeVerifier) => {
  if (
    typeof window === 'undefined' ||
    !window.crypto ||
    typeof window.crypto.subtle?.digest !== 'function'
  ) {
    return ''
  }

  try {
    const encoded = new TextEncoder().encode(String(codeVerifier || ''))
    const digest = await window.crypto.subtle.digest('SHA-256', encoded)
    return toBase64Url(digest)
  } catch {
    return ''
  }
}

const setAuth0PkceSessionData = ({ state = '', codeVerifier = '' } = {}) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  try {
    window.sessionStorage.setItem(AUTH0_CODE_VERIFIER_SESSION_KEY, String(codeVerifier || '').trim())
    window.sessionStorage.setItem(AUTH0_STATE_SESSION_KEY, String(state || '').trim())
    return true
  } catch (error) {
    console.warn('Failed to persist Auth0 PKCE state:', error)
    return false
  }
}

const clearAuth0PkceSessionData = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  try {
    window.sessionStorage.removeItem(AUTH0_CODE_VERIFIER_SESSION_KEY)
    window.sessionStorage.removeItem(AUTH0_STATE_SESSION_KEY)
    return true
  } catch (error) {
    console.warn('Failed to clear Auth0 PKCE state:', error)
    return false
  }
}

const buildAuth0AuthorizeUrl = async ({ provider = '', loginHint = '', screenHint = '' } = {}) => {
  const domain = getAuth0Domain()
  const clientId = getAuth0ClientId()
  const audience = getAuth0Audience()
  const redirectUri = getAuth0RedirectUri()
  const connection = buildAuth0ConnectionName(provider)
  const codeVerifier = generateCodeVerifier()
  const state = generateState()

  if (!domain || !clientId || !redirectUri) {
    return {
      success: false,
      message: AUTH0_AUTH_LOGIN_ERROR_MESSAGE
    }
  }

  if (!codeVerifier || !state) {
    return {
      success: false,
      message: 'Unable to initialize secure Auth0 login.'
    }
  }

  const authorizeHost = domain.includes('://') ? domain : `https://${domain}`
  if (!isValidHttpUrl(authorizeHost)) {
    return {
      success: false,
      message: 'Auth0 domain must be a valid URL.'
    }
  }

  try {
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    if (!codeChallenge) {
      return {
        success: false,
        message: 'Unable to prepare secure Auth0 login challenge.'
      }
    }

    const stored = setAuth0PkceSessionData({
      state,
      codeVerifier
    })
    if (!stored) {
      return {
        success: false,
        message: 'Unable to start login flow.'
      }
    }

    const authorizeUrl = new URL('/authorize', authorizeHost)
    authorizeUrl.searchParams.set('client_id', clientId)
    authorizeUrl.searchParams.set('redirect_uri', redirectUri)
    authorizeUrl.searchParams.set('response_type', AUTH0_RESPONSE_TYPE)
    authorizeUrl.searchParams.set('response_mode', 'query')
    authorizeUrl.searchParams.set('scope', AUTH0_SCOPE)
    authorizeUrl.searchParams.set('code_challenge', codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')
    authorizeUrl.searchParams.set('state', state)

    if (audience) {
      authorizeUrl.searchParams.set('audience', audience)
    }

    if (connection) {
      authorizeUrl.searchParams.set('connection', connection)
    }

    if (screenHint) {
      authorizeUrl.searchParams.set('screen_hint', screenHint)
    }

    if (loginHint) {
      authorizeUrl.searchParams.set('login_hint', loginHint)
    }

    return {
      success: true,
      url: authorizeUrl.toString()
    }
  } catch {
    return {
      success: false,
      message: 'Unable to construct the Auth0 authorization URL.'
    }
  }
}

const initiateAuth0Login = async (options = {}) => {
  const result = await buildAuth0AuthorizeUrl(options)
  if (!result.success) {
    return { success: false, error: result.message }
  }

  if (typeof window !== 'undefined') {
    window.location.assign(result.url)
  }
  return { success: true }
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

  if (status === 404 || status === 405) {
    return {
      code: BACKEND_AUTH_ROUTE_ERROR_CODE,
      message: `Unable to reach backend auth route at ${getBackendAuthEndpointLabel(route)}. Check VITE_API_URL and deployment routing.`
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const authMode = resolveAuthMode()
  const usesBackendSessionMode = isBackendSessionMode()
  const isAuth0Enabled = authMode === AUTH0_AUTH_MODE
  const isBackendAuthMode = authMode === BACKEND_AUTH_MODE

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

  const exchangeAuth0Token = async ({ accessToken, authCode, codeVerifier } = {}) => {
    const auth0AccessToken = typeof accessToken === 'string' ? accessToken.trim() : ''
    const auth0Code = typeof authCode === 'string' ? authCode.trim() : ''
    const auth0CodeVerifier = typeof codeVerifier === 'string' ? codeVerifier.trim() : ''

    if (!auth0AccessToken && !auth0Code) {
      return false
    }
    if (auth0Code && !auth0CodeVerifier) {
      console.warn('Auth0 code exchange missing PKCE verifier.')
      return false
    }

    try {
      const response = await axios.post('/api/auth/exchange', {
        ...(auth0AccessToken ? { access_token: auth0AccessToken } : {}),
        ...(auth0Code ? { code: auth0Code, code_verifier: auth0CodeVerifier } : {})
      })

      const normalized = normalizeBackendAuthPayload(response, {
        fallbackMessage: 'Unable to exchange Auth0 token.',
        requiresToken: true
      })
      if (!normalized.success) {
        console.warn('Auth0 token exchange returned malformed response:', normalized.message)
        return false
      }

      setBackendSession(normalized.token, normalized.user, true)
      return true
    } catch (error) {
      const normalized = getBackendAuthError(error, 'Unable to exchange Auth0 credentials.')
      console.warn('Auth0 token exchange failed:', normalized.message)

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearBackendSession()
      }
      return false
    }
  }

  useEffect(() => {
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
    if (isAuth0Enabled) {
      return initiateAuth0Login({
        loginHint: String(email || '').trim().toLowerCase()
      })
    }
    if (!usesBackendSessionMode) {
      return { success: false, error: 'Authentication mode is not configured.' }
    }

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

  const register = async (userData) => {
    if (isAuth0Enabled) {
      return initiateAuth0Login({
        loginHint: String(userData?.email || '').trim().toLowerCase(),
        screenHint: 'signup'
      })
    }

    if (!usesBackendSessionMode) {
      return { success: false, error: 'Authentication mode is not configured.' }
    }

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

  const logout = async () => {
    if (usesBackendSessionMode) {
      clearBackendSession()
      return
    }
    return { success: false, error: 'Authentication mode is not configured.' }
  }

  const updateProfile = async (profileData) => {
    if (usesBackendSessionMode) {
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
    return {
      success: false,
      error: 'Profile updates are not supported in this authentication mode.'
    }
  }

  const loginWithProvider = async (provider) => {
    if (isAuth0Enabled) {
      return initiateAuth0Login({
        provider
      })
    }
    return {
      success: false,
      error: 'Social provider login is only supported in Auth0 mode.'
    }
  }

  const requestPasswordReset = async (email) => {
    if (isAuth0Enabled) {
      return {
        success: false,
        error: 'Password reset is handled in Auth0.'
      }
    }

    if (isBackendAuthMode) {
      return {
        success: false,
        error: 'Password reset is not available in backend authentication mode.'
      }
    }
    return {
      success: false,
      error: 'Password reset is not available in this authentication mode.'
    }
  }

  const syncBackendAfterLogin = async ({
    auth0AccessToken = '',
    auth0Code = '',
    auth0CodeVerifier = ''
  } = {}) => {
    if (usesBackendSessionMode) {
      if (isAuth0Enabled && (auth0AccessToken || auth0Code)) {
        const exchanged = await exchangeAuth0Token({
          authCode: auth0Code,
          accessToken: auth0AccessToken,
          codeVerifier: auth0CodeVerifier
        })
        if (auth0Code || auth0AccessToken) {
          clearAuth0PkceSessionData()
        }
        return exchanged
      }

      const stored = getStoredBackendSession()
      if (!stored?.token) {
        clearBackendSession()
        return false
      }

      setBackendSession(stored.token, stored.user, true)
      try {
        const { data } = await axios.get('/api/auth/profile')
        const normalizedProfile = normalizeBackendAuthPayload(
          { data },
          {
            fallbackMessage: 'Unable to load backend auth profile.'
          }
        )

        if (!normalizedProfile.success || !normalizedProfile.user) {
          clearBackendSession()
          return false
        }

        setBackendSession(stored.token, normalizedProfile.user, true)
        return true
      } catch (error) {
        console.warn('Failed to finalize backend login sync:', error)
        return false
      }
    }

    return false
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
