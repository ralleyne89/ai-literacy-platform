import fs from 'node:fs'
import path from 'node:path'
import { validateTrainingVideos } from './check-training-videos.mjs'

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

const DOMAINS = [
  'AI Fundamentals',
  'Practical Usage',
  'Ethics & Critical Thinking',
  'AI Impact & Applications',
  'Strategic Understanding',
]

const validateAssessmentQuestions = (body) => {
  if (!Array.isArray(body?.questions) || body.questions.length !== 15) {
    return 'expected exactly 15 questions'
  }
  if (!Array.isArray(body.selected_question_ids) || body.selected_question_ids.length !== 15) {
    return 'expected selected_question_ids with 15 entries'
  }
  if (body.assessment_level !== 'beginner') {
    return 'expected assessment_level=beginner'
  }
  if (typeof body.generation_source !== 'string' || !body.generation_source) {
    return 'expected generation_source'
  }
  if (body.generation_source !== 'curated_fallback' && typeof body.question_set_token !== 'string') {
    return 'expected question_set_token for generated question sets'
  }

  const counts = Object.fromEntries(DOMAINS.map((domain) => [domain, 0]))
  for (const question of body.questions) {
    if (!question || typeof question !== 'object' || Array.isArray(question)) {
      return 'expected question objects'
    }
    if ('correct_answer' in question || 'explanation' in question) {
      return 'question payload exposes grading-only fields'
    }
    if (!DOMAINS.includes(question.domain)) {
      return `unexpected question domain: ${question.domain}`
    }
    for (const field of ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d']) {
      if (typeof question[field] !== 'string' || !question[field].trim()) {
        return `question is missing ${field}`
      }
    }
    counts[question.domain] += 1
  }

  const badDomain = DOMAINS.find((domain) => counts[domain] !== 3)
  if (badDomain) {
    return `expected 3 questions for ${badDomain}, received ${counts[badDomain]}`
  }

  return ''
}

const routes = [
  { route: '/api/health', label: 'health' },
  { route: '/api/training/modules', label: 'training catalog', validate: (body) => validateTrainingVideos(body).join('; ') },
  { route: '/api/certification/available', label: 'certification catalog' },
  { route: '/api/billing/config', label: 'billing config' },
  {
    route: '/api/assessment/questions?level=beginner',
    label: 'assessment questions',
    validate: validateAssessmentQuestions,
  },
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

  for (const { route, label, validate } of routes) {
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
        continue
      }

      if (validate) {
        const validationError = validate(body)
        if (validationError) {
          failures.push(`${label}: ${validationError}.${formatBodyHint(body)}`)
        }
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
