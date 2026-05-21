import { loadEnv } from 'vite'

const ROOT = process.cwd()
const VITE_MODE = process.env.VITE_MODE || process.env.VITE_BUILD_MODE || 'production'
const fileEnv = loadEnv(VITE_MODE, ROOT, '')
const effectiveEnv = { ...fileEnv, ...process.env }
const getEnv = (key) => String(effectiveEnv[key] ?? '').trim()

const isProductionBuild = (() => {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase()
  const appEnv = (process.env.APP_ENV || '').toLowerCase()
  const netlifyContext = (process.env.CONTEXT || '').toLowerCase()
  const explicit = process.env.ENFORCE_PROD_ENV === '1'

  if (explicit) return true
  if (nodeEnv === 'production' || appEnv === 'production' || appEnv === 'prod') return true
  if (process.env.NETLIFY === 'true' && netlifyContext === 'production') return true
  return false
})()
const isNetlifyProduction =
  process.env.NETLIFY === 'true' && (process.env.CONTEXT || '').toLowerCase() === 'production'

if (!isProductionBuild) {
  console.log('[validate-prod-env] Skipping strict checks (non-production build context).')
  process.exit(0)
}

const errors = []
const warnings = []
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const legacyAuthPrefixes = ['VITE_AUTH0_', 'AUTH0_', 'VITE_CLERK_', 'CLERK_']
const supabasePlatformApiPath = '/functions/v1/platform-api'
const supabasePlatformApiExample = `https://<project-ref>.supabase.co${supabasePlatformApiPath}`
const proxyBackendEnvKeys = ['BACKEND_API_URL', 'SUPABASE_PLATFORM_API_URL', 'VITE_PLATFORM_API_URL']
const placeholderValues = new Set([
  'stripe-publishable-key-placeholder',
  'https://your-project.supabase.co',
  'sb_publishable_your-supabase-publishable-key',
  'your-supabase-anon-or-publishable-key',
])

const isValidHttpUrl = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return false
  }
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const parseUrl = (value) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const addError = (message) => {
  errors.push(message)
}

const addWarning = (message) => {
  warnings.push(message)
}

const normalizePath = (value) => {
  const normalized = String(value || '').replace(/\/+$/, '')
  return normalized && normalized !== '/' ? normalized : '/'
}

const isSupabaseHost = (url) => Boolean(url?.hostname?.toLowerCase().endsWith('.supabase.co'))

const isSupabasePlatformApiUrl = (url) =>
  Boolean(url && isSupabaseHost(url) && normalizePath(url.pathname) === supabasePlatformApiPath)

const getProxyBackendApiUrl = () => {
  for (const key of proxyBackendEnvKeys) {
    const value = getEnv(key)
    if (value) {
      return { key, value, parsed: parseUrl(value) }
    }
  }

  return { key: '', value: '', parsed: null }
}

const apiUrl = getEnv('VITE_API_URL')
let parsedApi = null
if (!apiUrl) {
  addError('VITE_API_URL is required and must be an absolute URL in production.')
} else {
  parsedApi = parseUrl(apiUrl)
  if (!parsedApi || !['http:', 'https:'].includes(parsedApi.protocol)) {
    addError('VITE_API_URL must be an absolute HTTP(S) URL. In Netlify production, use the frontend origin, for example https://litmusai.netlify.app.')
  } else {
    if (localHostnames.has(parsedApi.hostname.toLowerCase())) {
      addError('VITE_API_URL cannot point to localhost in production.')
    }
  }
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
let parsedSupabaseUrl = null
if (!supabaseUrl) {
  addError('VITE_SUPABASE_URL is required in production.')
} else if (!isValidHttpUrl(supabaseUrl)) {
  addError('VITE_SUPABASE_URL must be an absolute HTTP(S) Supabase project URL.')
} else if (placeholderValues.has(supabaseUrl)) {
  addError('VITE_SUPABASE_URL is still set to a placeholder value.')
} else {
  parsedSupabaseUrl = parseUrl(supabaseUrl)
}

const supabasePublishableKey = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
if (!supabasePublishableKey) {
  addError('VITE_SUPABASE_PUBLISHABLE_KEY is required in production.')
} else if (placeholderValues.has(supabasePublishableKey)) {
  addError('VITE_SUPABASE_PUBLISHABLE_KEY is still set to a placeholder value.')
}

const authMode = getEnv('VITE_AUTH_MODE')
if (authMode && authMode.toLowerCase() !== 'supabase') {
  addError('VITE_AUTH_MODE must be "supabase" for release builds.')
}

const frontendUrl = getEnv('FRONTEND_URL') || getEnv('URL') || getEnv('DEPLOY_PRIME_URL')
const parsedFrontendUrl = frontendUrl ? parseUrl(frontendUrl) : null
const proxyBackendApi = getProxyBackendApiUrl()
let parsedProxyBackendApi = proxyBackendApi.parsed

if (proxyBackendApi.value && (!parsedProxyBackendApi || !['http:', 'https:'].includes(parsedProxyBackendApi.protocol))) {
  addError(`${proxyBackendApi.key} must be an absolute HTTP(S) URL when VITE_API_URL uses the Netlify same-origin proxy.`)
  parsedProxyBackendApi = null
}

if (parsedApi && isSupabaseHost(parsedApi)) {
  const normalizedApiPath = normalizePath(parsedApi.pathname)
  if (normalizedApiPath === '/rest/v1' || normalizedApiPath.startsWith('/rest/v1/')) {
    addError(`VITE_API_URL points at Supabase REST (/rest/v1). Use the Edge Function URL instead: ${supabasePlatformApiExample}.`)
  } else if (normalizedApiPath !== supabasePlatformApiPath) {
    addError(`Supabase VITE_API_URL must be the Edge Function URL ${supabasePlatformApiExample}, not only the project origin.`)
  } else if (isNetlifyProduction) {
    addError(
      `Netlify production VITE_API_URL must be the frontend origin, not the cross-origin Supabase Edge Function. Set BACKEND_API_URL to ${supabasePlatformApiExample}.`
    )
  }
} else if (parsedApi) {
  const normalizedApiPath = normalizePath(parsedApi.pathname)
  const isSameOriginProxy =
    parsedFrontendUrl &&
    parsedApi.origin === parsedFrontendUrl.origin &&
    normalizedApiPath === '/'

  if (!isSameOriginProxy) {
    addError(
      `VITE_API_URL must either be the Supabase Edge Function URL (${supabasePlatformApiExample}) or the same-origin Netlify frontend URL with BACKEND_API_URL pointing to that Edge Function.`
    )
  } else if (!isSupabasePlatformApiUrl(parsedProxyBackendApi)) {
    addError(
      `Same-origin VITE_API_URL requires ${proxyBackendEnvKeys.join(' or ')} to point to the Supabase Edge Function URL: ${supabasePlatformApiExample}.`
    )
  }
}

const authTokenReceiver = isSupabaseHost(parsedApi) ? parsedApi : parsedProxyBackendApi

if (authTokenReceiver && parsedSupabaseUrl && authTokenReceiver.origin !== parsedSupabaseUrl.origin) {
  addError('VITE_API_URL and VITE_SUPABASE_URL must use the same Supabase project origin so auth tokens validate against the platform-api deployment.')
}

for (const prefix of legacyAuthPrefixes) {
  const matches = Object.keys(effectiveEnv).filter((key) => key.startsWith(prefix))
  if (matches.length > 0) {
    addWarning(
      `Legacy auth variables are still present: ${matches.join(', ')}. They are not used by the Supabase release path and should be removed from production environments.`
    )
  }
}

if (errors.length > 0) {
  console.error('[validate-prod-env] Production environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }

  console.error('\nHow to fix:')
  console.error(`- For direct API mode, set VITE_API_URL to the Supabase Edge Function URL: ${supabasePlatformApiExample}`)
  console.error('- For Netlify proxy mode, set VITE_API_URL to the frontend origin and BACKEND_API_URL to the Supabase Edge Function URL.')
  console.error('- Do not use the Supabase REST endpoint (/rest/v1) for frontend API routing.')
  console.error('- Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for the Netlify build.')
  console.error('- Remove legacy Clerk/Auth0 auth-mode variables from production configuration.')
  console.error('- Re-run the build after fixing values.')
  process.exit(1)
}

if (warnings.length > 0) {
  console.warn('[validate-prod-env] Production warnings:')
  for (const warning of warnings) {
    console.warn(`- ${warning}`)
  }
}

console.log('[validate-prod-env] Production environment validation passed.')
