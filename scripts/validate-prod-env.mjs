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
const warnings = []
const requiredHost = 'ai-literacy-platform.onrender.com'
const supportedAuthModes = new Set(['backend', 'supabase', 'auth0'])
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

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

const authMode = (() => {
  const rawMode = (getEnv('VITE_AUTH_MODE') || '').toLowerCase().trim()
  if (!rawMode) {
    addError(
      'VITE_AUTH_MODE is required in production. Set it explicitly to one of: auth0 (recommended), backend, or supabase.'
    )
    return ''
  }
  if (!supportedAuthModes.has(rawMode)) {
    addError(`Unsupported VITE_AUTH_MODE="${rawMode}". Use auth0, backend, or supabase.`)
    return rawMode
  }
  return rawMode
})()

const apiUrl = getEnv('VITE_API_URL')
if (!apiUrl) {
  addError('VITE_API_URL is required and must be an absolute URL in production.')
} else {
  const parsedApi = parseUrl(apiUrl)
  if (!parsedApi || !['http:', 'https:'].includes(parsedApi.protocol)) {
    addError('VITE_API_URL must be an absolute HTTP(S) URL (example: https://ai-literacy-platform.onrender.com).')
  } else {
    if (localHostnames.has(parsedApi.hostname.toLowerCase())) {
      addError('VITE_API_URL cannot point to localhost in production.')
    } else if (
      parsedApi.hostname.toLowerCase() !== requiredHost &&
      !parsedApi.hostname.toLowerCase().endsWith(`.${requiredHost}`)
    ) {
      addWarning(
        `VITE_API_URL currently points to "${parsedApi.hostname}". Verify this is the intended backend host and keep Auth callbacks and CORS aligned.`
      )
    }
  }
}

if (authMode === 'backend' || authMode === 'auth0') {
  const hasTokenSecret = Boolean(getEnv('SUPABASE_JWT_SECRET')) || Boolean(getEnv('JWT_SECRET_KEY'))
  if (!hasTokenSecret) {
    addError('One of SUPABASE_JWT_SECRET or JWT_SECRET_KEY is required for backend token signing/verification.')
  }
}

if (authMode === 'supabase') {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL')
  if (!supabaseUrl) {
    addError('VITE_SUPABASE_URL is required when VITE_AUTH_MODE=supabase.')
  } else {
    const parsedSupabase = parseUrl(supabaseUrl)
    if (!parsedSupabase || parsedSupabase.protocol !== 'https:') {
      addError('VITE_SUPABASE_URL must be a valid https URL.')
    } else if (!parsedSupabase.hostname.endsWith('.supabase.co')) {
      addError('VITE_SUPABASE_URL should point to a *.supabase.co host.')
    }
  }

  if (!getEnv('VITE_SUPABASE_ANON_KEY')) {
    addError('VITE_SUPABASE_ANON_KEY is required when VITE_AUTH_MODE=supabase.')
  }

  if (!getEnv('SUPABASE_JWT_SECRET')) {
    addError('SUPABASE_JWT_SECRET is required when VITE_AUTH_MODE=supabase.')
  }
}

if (authMode === 'auth0') {
  const auth0Domain = getEnv('VITE_AUTH0_DOMAIN')
  const auth0ClientId = getEnv('VITE_AUTH0_CLIENT_ID')
  const auth0Audience = getEnv('VITE_AUTH0_AUDIENCE')
  const auth0RedirectUri = getEnv('VITE_AUTH0_REDIRECT_URI')

  if (!auth0Domain) {
    addError('VITE_AUTH0_DOMAIN is required when VITE_AUTH_MODE=auth0.')
  } else if (auth0Domain.includes('://') && !isValidHttpUrl(auth0Domain)) {
    addError('VITE_AUTH0_DOMAIN must be a valid HTTP(S) URL when including a protocol (for example https://your-domain.auth0.com).')
  }

  if (!auth0ClientId) {
    addError('VITE_AUTH0_CLIENT_ID is required when VITE_AUTH_MODE=auth0.')
  }

  if (!auth0Audience) {
    addError('VITE_AUTH0_AUDIENCE is required when VITE_AUTH_MODE=auth0.')
  }

  if (!auth0RedirectUri) {
    addError('VITE_AUTH0_REDIRECT_URI is required when VITE_AUTH_MODE=auth0.')
  } else if (!isValidHttpUrl(auth0RedirectUri)) {
    addError('VITE_AUTH0_REDIRECT_URI must be a valid absolute HTTP(S) URL.')
  } else {
    const redirectPath = parseUrl(auth0RedirectUri)?.pathname
    if (redirectPath !== '/auth/callback') {
      addError(`VITE_AUTH0_REDIRECT_URI must use /auth/callback. Current path: ${redirectPath || '(missing)'}.`)
    }
  }

  const backendRedirect = getEnv('AUTH0_REDIRECT_URI')
  if (backendRedirect) {
    const parsedRedirect = parseUrl(backendRedirect)
    const backendPath = parsedRedirect?.pathname
    if (!isValidHttpUrl(backendRedirect)) {
      addError('AUTH0_REDIRECT_URI must be a valid absolute HTTP(S) URL when set.')
    } else if (backendPath && backendPath !== '/auth/callback') {
      addError(`AUTH0_REDIRECT_URI must use /auth/callback when set. Current path: ${backendPath}.`)
    }
  }
}

if (errors.length > 0) {
  console.error('[validate-prod-env] Production environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }

  console.error('\nHow to fix:')
  console.error('- Ensure all required variables are set for your selected VITE_AUTH_MODE.')
  console.error('- Keep VITE_API_URL aligned with the single backend host (https://ai-literacy-platform.onrender.com by default).')
  console.error('- Set VITE_AUTH_MODE explicitly; fallback/auto heuristics are disabled in production.')
  console.error('- For auth0 mode, confirm VITE_AUTH0_REDIRECT_URI equals https://<site>/auth/callback.')
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
