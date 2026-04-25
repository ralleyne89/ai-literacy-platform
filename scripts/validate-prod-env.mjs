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
const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
const legacyAuthPrefixes = ['VITE_AUTH0_', 'AUTH0_', 'VITE_SUPABASE_', 'SUPABASE_']
const placeholderValues = new Set(['pk_test_or_prod_replace_me'])

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
        `VITE_API_URL currently points to "${parsedApi.hostname}". Verify this is the intended backend host and keep the Render backend and Netlify frontend aligned.`
      )
    }
  }
}

const clerkPublishableKey = getEnv('VITE_CLERK_PUBLISHABLE_KEY')
if (!clerkPublishableKey) {
  addError('VITE_CLERK_PUBLISHABLE_KEY is required in production.')
} else if (placeholderValues.has(clerkPublishableKey)) {
  addError('VITE_CLERK_PUBLISHABLE_KEY is still set to a placeholder value.')
}

const authMode = getEnv('VITE_AUTH_MODE')
if (authMode && authMode.toLowerCase() !== 'clerk') {
  addError('VITE_AUTH_MODE is no longer supported for release builds. Remove legacy auth mode configuration and use Clerk only.')
}

for (const prefix of legacyAuthPrefixes) {
  const matches = Object.keys({ ...process.env, ...fileEnv }).filter((key) => key.startsWith(prefix))
  if (matches.length > 0) {
    addWarning(
      `Legacy auth variables are still present: ${matches.join(', ')}. They are not used by the Clerk release path and should be removed from production environments.`
    )
  }
}

if (errors.length > 0) {
  console.error('[validate-prod-env] Production environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }

  console.error('\nHow to fix:')
  console.error('- Ensure VITE_API_URL points at the Render backend host.')
  console.error('- Set VITE_CLERK_PUBLISHABLE_KEY for the Netlify build.')
  console.error('- Remove legacy Auth0/Supabase auth-mode variables from production configuration.')
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
