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

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
if (!supabaseUrl) {
  errors.push('VITE_SUPABASE_URL is required for production builds.')
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
  errors.push('VITE_SUPABASE_ANON_KEY is required for production builds.')
}

if (errors.length > 0) {
  console.error('[validate-prod-env] Production environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('[validate-prod-env] Production environment validation passed.')
