import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DOTENV_PATH = path.join(ROOT, '.env')

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const result = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const rawValue = trimmed.slice(idx + 1).trim()
    result[key] = rawValue
  }

  return result
}

const fileEnv = parseEnvFile(DOTENV_PATH)
const getEnv = (key) => (process.env[key] ?? fileEnv[key] ?? '').trim()

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

if (!isProductionBuild) {
  console.log('[validate-prod-env] Skipping strict checks (non-production build context).')
  process.exit(0)
}

const errors = []

const SUPPORTED_AUTH_MODES = new Set(['auto', 'backend', 'supabase', 'auth0'])
const parseAuthMode = () => {
  const configured = (getEnv('VITE_AUTH_MODE') || '').toLowerCase()
  if (!configured) {
    return 'auto'
  }
  if (SUPPORTED_AUTH_MODES.has(configured)) {
    return configured
  }
  return `unsupported:${configured}`
}

const authMode = parseAuthMode()
if (authMode.startsWith('unsupported:')) {
  const badValue = authMode.split(':', 2)[1]
  errors.push(`Unsupported VITE_AUTH_MODE="${badValue}". Supported values: auto, backend, supabase, auth0.`)
}

const resolvedAuthMode = authMode.startsWith('unsupported:') ? 'auto' : authMode
const requiresSupabase = ['auto', 'supabase'].includes(resolvedAuthMode)
const requiresAuth0 = resolvedAuthMode === 'auth0'
const requiresBackendJwtSecret = ['backend', 'auth0'].includes(resolvedAuthMode)
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

const apiUrl = getEnv('VITE_API_URL')
if (!apiUrl) {
  errors.push('VITE_API_URL is required for production builds.')
} else {
  let parsedApi
  try {
    parsedApi = new URL(apiUrl)
  } catch {
    parsedApi = null
  }

  if (!parsedApi || !['http:', 'https:'].includes(parsedApi.protocol)) {
    errors.push('VITE_API_URL must be a valid absolute http(s) URL.')
  } else if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedApi.hostname.toLowerCase())) {
    errors.push('VITE_API_URL cannot point to localhost in production.')
  }
}

if (requiresSupabase) {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL')
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required for production builds when VITE_AUTH_MODE is auto or supabase.')
  } else {
    let parsedSupabase
    try {
      parsedSupabase = new URL(supabaseUrl)
    } catch {
      parsedSupabase = null
    }

    if (!parsedSupabase || parsedSupabase.protocol !== 'https:') {
      errors.push('VITE_SUPABASE_URL must be a valid https URL.')
    } else if (!parsedSupabase.hostname.endsWith('.supabase.co')) {
      errors.push('VITE_SUPABASE_URL must point to a *.supabase.co host.')
    }
  }

  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY')
  if (!anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required for production builds when VITE_AUTH_MODE is auto or supabase.')
  }

  const supabaseJwtSecret = getEnv('SUPABASE_JWT_SECRET')
  if (!supabaseJwtSecret) {
    errors.push('SUPABASE_JWT_SECRET is required for production builds when VITE_AUTH_MODE is auto or supabase.')
  }
}

if (requiresAuth0) {
  const auth0Domain = getEnv('VITE_AUTH0_DOMAIN')
  const auth0ClientId = getEnv('VITE_AUTH0_CLIENT_ID')
  const auth0Audience = getEnv('VITE_AUTH0_AUDIENCE')
  const auth0RedirectUri = getEnv('VITE_AUTH0_REDIRECT_URI')

  if (!auth0Domain) {
    errors.push('VITE_AUTH0_DOMAIN is required for production builds when VITE_AUTH_MODE=auth0.')
  }
  if (auth0Domain.includes('://') && !isValidHttpUrl(auth0Domain)) {
    errors.push('VITE_AUTH0_DOMAIN must be a valid URL when it includes a protocol.')
  }

  if (!auth0ClientId) {
    errors.push('VITE_AUTH0_CLIENT_ID is required for production builds when VITE_AUTH_MODE=auth0.')
  }
  if (!auth0Audience) {
    errors.push('VITE_AUTH0_AUDIENCE is required for production builds when VITE_AUTH_MODE=auth0.')
  }
  if (!auth0RedirectUri) {
    errors.push('VITE_AUTH0_REDIRECT_URI is required for production builds when VITE_AUTH_MODE=auth0.')
  } else if (!isValidHttpUrl(auth0RedirectUri)) {
    errors.push('VITE_AUTH0_REDIRECT_URI must be a valid absolute http(s) URL.')
  }
}

if (requiresBackendJwtSecret) {
  const supabaseJwtSecret = getEnv('SUPABASE_JWT_SECRET')
  const jwtSecret = getEnv('JWT_SECRET_KEY')
  if (!supabaseJwtSecret && !jwtSecret) {
    errors.push('One of SUPABASE_JWT_SECRET or JWT_SECRET_KEY is required for backend/auth0 token handling in production.')
  }
}

if (errors.length > 0) {
  console.error('[validate-prod-env] Production environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('[validate-prod-env] Production environment validation passed.')
