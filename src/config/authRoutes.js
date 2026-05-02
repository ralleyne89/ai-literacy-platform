import { AUTH_CALLBACK_PATH } from './apiEndpoints'

export { AUTH_CALLBACK_PATH }
export const AUTH_RETURN_TO_SESSION_KEY = 'ailiteracy_auth_return_to'
export const GOOGLE_OAUTH_CONFIG_ERROR_CODE = 'google_oauth_provider_misconfigured'

const OAUTH_PROVIDER_CONFIG_PATTERNS = [
  /\bgoogle\b.*\b(client|secret|provider|oauth|credential).*\b(missing|invalid|not configured|not enabled|disabled)\b/i,
  /\b(provider|oauth)\b.*\b(not configured|not enabled|disabled|unsupported|missing)\b/i,
  /\b(client|secret|credential)\b.*\b(missing|invalid|not configured)\b/i,
  /\bunsupported provider\b/i,
  /\bprovider is not enabled\b/i,
]

const readErrorText = (error) => {
  if (typeof error === 'string') {
    return error.trim()
  }

  return String(
    error?.response?.data?.error_description ||
      error?.response?.data?.error ||
      error?.response?.data?.details ||
      error?.error_description ||
      error?.description ||
      error?.message ||
      ''
  ).trim()
}

const readErrorCode = (error) => {
  if (typeof error === 'string') {
    return ''
  }

  return String(
    error?.response?.data?.code ||
      error?.response?.data?.error_code ||
      error?.code ||
      error?.error_code ||
      ''
  ).trim()
}

const formatProviderLabel = (provider) => {
  const normalized = String(provider || 'google').trim().toLowerCase()
  return normalized === 'google' ? 'Google' : normalized
}

const formatProviderCode = (provider) =>
  String(provider || 'google').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'provider'

export const isOAuthProviderConfigError = (error) => {
  const searchable = `${readErrorCode(error)} ${readErrorText(error)}`.trim()
  return OAUTH_PROVIDER_CONFIG_PATTERNS.some((pattern) => pattern.test(searchable))
}

export const normalizeOAuthProviderError = (
  error,
  fallbackMessage = 'Unable to start Google sign-in.',
  provider = 'google'
) => {
  const rawMessage = readErrorText(error)
  const rawCode = readErrorCode(error)

  if (isOAuthProviderConfigError(error)) {
    const providerCode = formatProviderCode(provider)
    return {
      code: providerCode === 'google' ? GOOGLE_OAUTH_CONFIG_ERROR_CODE : `${providerCode}_oauth_provider_misconfigured`,
      error: `${formatProviderLabel(provider)} sign-in is not configured correctly for this Supabase project. Try email and password, or contact support.`,
    }
  }

  return {
    code: rawCode || 'supabase_oauth_error',
    error: rawMessage || fallbackMessage,
  }
}

export const getStoredAuthReturnTo = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return ''
  }

  try {
    return String(window.sessionStorage.getItem(AUTH_RETURN_TO_SESSION_KEY) || '').trim()
  } catch {
    return ''
  }
}

export const setStoredAuthReturnTo = (value) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  const normalized = String(value || '').trim()
  if (!normalized.startsWith('/')) {
    return false
  }

  try {
    window.sessionStorage.setItem(AUTH_RETURN_TO_SESSION_KEY, normalized)
    return true
  } catch {
    return false
  }
}

export const clearStoredAuthReturnTo = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  try {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_SESSION_KEY)
    return true
  } catch {
    return false
  }
}
