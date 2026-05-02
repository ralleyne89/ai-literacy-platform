const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const SUPABASE_PROJECT_HOST_SUFFIX = '.supabase.co'
const isProductionBuild = import.meta.env?.PROD === true

export const AUTH_CALLBACK_PATH = '/auth/callback'
export const SUPABASE_EDGE_FUNCTION_PATH = '/functions/v1/platform-api'
export const SUPABASE_EDGE_FUNCTION_URL_EXAMPLE = `https://<project-ref>.supabase.co${SUPABASE_EDGE_FUNCTION_PATH}`

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

const normalizeUrlPath = (value) => {
  const normalized = trimTrailingSlashes(value)
  return normalized && normalized !== '/' ? normalized : '/'
}

const isSupabaseProjectHost = (hostname) =>
  String(hostname || '').toLowerCase().endsWith(SUPABASE_PROJECT_HOST_SUFFIX)

const getApiRoutingIssueFromParsedUrl = (parsed) => {
  if (!parsed || !isSupabaseProjectHost(parsed.hostname)) {
    return null
  }

  const normalizedPath = normalizeUrlPath(parsed.pathname)
  if (normalizedPath === '/rest/v1' || normalizedPath.startsWith('/rest/v1/')) {
    return {
      code: 'supabase_rest_api_misroute',
      message: `VITE_API_URL points at Supabase REST (/rest/v1). Use ${SUPABASE_EDGE_FUNCTION_URL_EXAMPLE} so frontend /api/* routes reach the platform-api Edge Function.`,
    }
  }

  if (normalizedPath !== SUPABASE_EDGE_FUNCTION_PATH) {
    return {
      code: 'supabase_edge_function_url_required',
      message: `VITE_API_URL for Supabase must be ${SUPABASE_EDGE_FUNCTION_URL_EXAMPLE}, including ${SUPABASE_EDGE_FUNCTION_PATH}.`,
    }
  }

  return null
}

const getApiRoutingIssueForUrl = (value) => {
  const parsed = parseAbsoluteUrl(value)
  if (!parsed) {
    return null
  }

  return getApiRoutingIssueFromParsedUrl(parsed)
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

  const normalizedPath = trimTrailingSlashes(parsed.pathname)
  const routingIssue = getApiRoutingIssueFromParsedUrl(parsed)
  if (routingIssue) {
    console.error(routingIssue.message)
  }

  return `${parsed.origin}${normalizedPath === '/' ? '' : normalizedPath}`
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
export const getApiRoutingIssue = (apiBaseUrl = API_BASE_URL) =>
  getApiRoutingIssueForUrl(apiBaseUrl)

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
