const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const isProductionBuild = import.meta.env?.PROD === true

export const AUTH_CALLBACK_PATH = '/auth/callback'

const trimTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '')

const parseAbsoluteUrl = (value) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const normalizeApiBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlashes(import.meta.env.VITE_API_URL)
  if (!configuredBaseUrl) {
    if (isProductionBuild) {
      console.error('VITE_API_URL is required for production builds and must be set to an absolute HTTP(S) URL.')
    }
    return ''
  }

  const parsed = parseAbsoluteUrl(configuredBaseUrl)
  if (!parsed) {
    console.error('VITE_API_URL is not a valid absolute HTTP(S) URL.')
    return ''
  }

  return parsed.origin
}

const normalizePath = (value) => {
  if (!value) {
    return ''
  }
  return value.startsWith('/') ? value : `/${value}`
}

const buildApiPath = (path) => {
  const normalizedPath = normalizePath(path)
  if (!normalizedPath) {
    return ''
  }
  if (!API_BASE_URL) {
    return normalizedPath
  }

  return `${API_BASE_URL}${normalizedPath}`
}

export const API_BASE_URL = normalizeApiBaseUrl()
export const resolveApiBaseUrl = () => API_BASE_URL

export const isConfiguredApiLocalhost = () => {
  if (!API_BASE_URL) {
    return false
  }

  try {
    const parsed = new URL(API_BASE_URL)
    return LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export const AUTH_ENDPOINTS = {
  base: buildApiPath('/api/auth'),
  login: buildApiPath('/api/auth/login'),
  register: buildApiPath('/api/auth/register'),
  exchange: buildApiPath('/api/auth/exchange'),
  profile: buildApiPath('/api/auth/profile')
}

export const BILLING_ENDPOINTS = {
  config: buildApiPath('/api/billing/config'),
  subscription: buildApiPath('/api/billing/subscription'),
  checkoutSession: buildApiPath('/api/billing/checkout-session'),
  checkoutComplete: buildApiPath('/api/billing/checkout-session/complete'),
  customerPortal: buildApiPath('/api/billing/customer-portal')
}
