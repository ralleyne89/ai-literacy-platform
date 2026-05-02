import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DOTENV_PATH = path.join(ROOT, '.env')

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        return values
      }

      const index = trimmed.indexOf('=')
      values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
      return values
    }, {})
}

const fileEnv = parseEnvFile(DOTENV_PATH)
const getEnv = (key) => (process.env[key] ?? fileEnv[key] ?? '').trim()
const trimTrailingSlashes = (value) => String(value || '').trim().replace(/\/+$/, '')

const routes = [
  ['/api/health', 'health'],
  ['/api/training/modules', 'training catalog'],
  ['/api/certification/available', 'certification catalog'],
  ['/api/billing/config', 'billing config'],
]

const parseJsonSafely = async (response) => {
  const text = await response.text()
  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text.slice(0, 240)
  }
}

const formatBodyHint = (body) => {
  if (!body) {
    return ''
  }
  if (typeof body === 'string') {
    return ` Body: ${body}`
  }
  const message = body.message || body.error || body.code || body.msg
  return message ? ` Body: ${message}` : ''
}

const main = async () => {
  const apiBaseUrl = trimTrailingSlashes(getEnv('VITE_API_URL'))
  if (!apiBaseUrl) {
    console.error('[check-platform-api] VITE_API_URL is not set.')
    process.exit(1)
  }

  let parsedBase
  try {
    parsedBase = new URL(apiBaseUrl)
  } catch {
    console.error(`[check-platform-api] VITE_API_URL is not a valid URL: ${apiBaseUrl}`)
    process.exit(1)
  }

  if (
    parsedBase.hostname.endsWith('.supabase.co') &&
    !parsedBase.pathname.replace(/\/+$/, '').endsWith('/functions/v1/platform-api')
  ) {
    console.error('[check-platform-api] Supabase API base must end with /functions/v1/platform-api.')
    process.exit(1)
  }

  const failures = []

  for (const [route, label] of routes) {
    const url = `${apiBaseUrl}${route}`
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })
      const body = await parseJsonSafely(response)

      if (!response.ok) {
        failures.push(`${label}: ${response.status} ${response.statusText}.${formatBodyHint(body)}`)
        continue
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        failures.push(`${label}: expected JSON object response.${formatBodyHint(body)}`)
      }
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (failures.length) {
    console.error('[check-platform-api] Platform API smoke check failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`[check-platform-api] Platform API smoke check passed for ${apiBaseUrl}.`)
}

main()
