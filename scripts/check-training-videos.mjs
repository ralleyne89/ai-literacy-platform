import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const DOTENV_PATH = path.join(ROOT, '.env')

export const PLACEHOLDER_VIDEO_MARKERS = [
  'media.w3.org',
  'interactive-examples.mdn.mozilla.net',
  'flower.mp4',
  'bunny',
  'sintel',
  'movie_300',
]

export const CURATED_TRAINING_VIDEOS = {
  'module-ai-fundamentals-intro': {
    video_url: 'https://www.youtube-nocookie.com/embed/qYNweeDHiyU',
    video_title: 'AI, Machine Learning, Deep Learning and Generative AI Explained',
    creator: 'IBM Technology',
    original_url: 'https://www.youtube.com/watch?v=qYNweeDHiyU',
  },
  'module-ai-sales': {
    video_url: 'https://www.youtube-nocookie.com/embed/R8CepUwdZis',
    video_title: '5 Ways Generative AI is Revolutionizing Sales Automation',
    creator: 'IBM',
    original_url: 'https://www.youtube.com/watch?v=R8CepUwdZis',
  },
  'module-ethical-hr': {
    video_url: 'https://www.youtube-nocookie.com/embed/og67qeTZPYs',
    video_title: 'Algorithmic Bias in AI: What It Is and How to Fix It',
    creator: 'IBM Technology',
    original_url: 'https://www.youtube.com/watch?v=og67qeTZPYs',
  },
  'module-marketing-ai': {
    video_url: 'https://www.youtube-nocookie.com/embed/c54qSfmTT5U',
    video_title: 'Putting AI to Work for Marketing',
    creator: 'IBM Technology',
    original_url: 'https://www.youtube.com/watch?v=c54qSfmTT5U',
  },
  'module-ops-ai': {
    video_url: 'https://www.youtube-nocookie.com/embed/4VCwKSaMOqY',
    video_title: 'Putting AI to work in IT Operations',
    creator: 'IBM Technology',
    original_url: 'https://www.youtube.com/watch?v=4VCwKSaMOqY',
  },
  'module-prompt-master': {
    video_url: 'https://www.youtube-nocookie.com/embed/T9aRN5JkmL8',
    video_title: 'AI prompt engineering: A deep dive',
    creator: 'Anthropic',
    original_url: 'https://www.youtube.com/watch?v=T9aRN5JkmL8',
  },
}

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

const hasPlaceholderMarker = (value) => {
  const searchable = typeof value === 'string' ? value : JSON.stringify(value || {})
  return PLACEHOLDER_VIDEO_MARKERS.find((marker) => searchable.includes(marker)) || ''
}

const isPositiveLessonCount = (value) => {
  const count = Number(value)
  return Number.isFinite(count) && count > 0
}

const isTrue = (value) => value === true || value === 'true'

export const validateTrainingVideos = (body) => {
  const failures = []
  if (!body || typeof body !== 'object' || !Array.isArray(body.modules)) {
    return ['training catalog: expected a JSON object with a modules array']
  }

  const modulesById = new Map(body.modules.map((module) => [module?.id, module]))

  for (const module of body.modules) {
    const marker = hasPlaceholderMarker(module?.content_url)
    if (marker) {
      failures.push(`${module?.id || 'unknown module'} still uses placeholder media (${marker})`)
    }
  }

  for (const [moduleId, expected] of Object.entries(CURATED_TRAINING_VIDEOS)) {
    const module = modulesById.get(moduleId)
    if (!module) {
      failures.push(`${moduleId} is missing from the training catalog`)
      continue
    }

    const metadata = module.metadata && typeof module.metadata === 'object' ? module.metadata : {}
    const marker = hasPlaceholderMarker(module)
    if (marker) {
      failures.push(`${moduleId} payload still includes placeholder media (${marker})`)
    }
    if (module.content_url !== expected.video_url) {
      failures.push(`${moduleId} content_url expected ${expected.video_url}, received ${module.content_url || 'empty'}`)
    }
    if (!isPositiveLessonCount(module.lesson_count)) {
      failures.push(`${moduleId} should expose at least one internal lesson`)
    }
    if (!isTrue(module.has_internal_lessons)) {
      failures.push(`${moduleId} should set has_internal_lessons=true`)
    }
    if (metadata.video_url && metadata.video_url !== expected.video_url) {
      failures.push(`${moduleId} metadata.video_url expected ${expected.video_url}, received ${metadata.video_url}`)
    }
    for (const field of ['video_title', 'creator', 'original_url', 'attribution', 'curation_note']) {
      if (!metadata[field]) {
        failures.push(`${moduleId} metadata.${field} is missing`)
      }
    }
    if (metadata.video_title && metadata.video_title !== expected.video_title) {
      failures.push(`${moduleId} metadata.video_title expected "${expected.video_title}", received "${metadata.video_title}"`)
    }
    if (metadata.creator && metadata.creator !== expected.creator) {
      failures.push(`${moduleId} metadata.creator expected "${expected.creator}", received "${metadata.creator}"`)
    }
    if (metadata.original_url && metadata.original_url !== expected.original_url) {
      failures.push(`${moduleId} metadata.original_url expected ${expected.original_url}, received ${metadata.original_url}`)
    }
  }

  return failures
}

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

const main = async () => {
  const apiBaseUrl = trimTrailingSlashes(getEnv('VITE_API_URL'))
  if (!apiBaseUrl) {
    console.error('[check-training-videos] VITE_API_URL is not set.')
    process.exit(1)
  }

  const response = await fetch(`${apiBaseUrl}/api/training/modules`, {
    headers: { Accept: 'application/json' },
  })
  const body = await parseJsonSafely(response)

  if (!response.ok) {
    const message = body?.message || body?.error || ''
    console.error(`[check-training-videos] Training catalog request failed: ${response.status} ${response.statusText}${message ? ` (${message})` : ''}`)
    process.exit(1)
  }

  const failures = validateTrainingVideos(body)
  if (failures.length) {
    console.error('[check-training-videos] Training video catalog check failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`[check-training-videos] Training video catalog check passed for ${apiBaseUrl}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[check-training-videos] ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
}
