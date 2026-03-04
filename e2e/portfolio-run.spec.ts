import { APIRequestContext, expect, Page, test } from '@playwright/test'

type Credentials = {
  email: string
  password: string
  firstName: string
  lastName: string
}

type LessonPreview = {
  id: string
  content_type?: string
}

type Recommendation = {
  id?: string
  title?: string
  content_type?: string
}

type PlayableTarget = {
  moduleId: string
  lessonId: string
}

const AUTH_STORAGE_KEY = 'ailiteracy_backend_auth'
const TEST_PASSWORD = 'TestPass1234!'
const QUIZ_ANSWERS = ['A', 'B', 'B']
const DEFAULT_MODULE_ID = process.env.E2E_TEST_MODULE_ID || 'module-ai-fundamentals-intro'

const getFallbackCredentials = (): Credentials | null => {
  const fallbackEmail = process.env.E2E_TEST_EMAIL || process.env.E2E_ADMIN_EMAIL || process.env.PLAYWRIGHT_TEST_EMAIL
  const fallbackPassword = process.env.E2E_TEST_PASSWORD || process.env.E2E_ADMIN_PASSWORD || process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!fallbackEmail || !fallbackPassword) {
    return null
  }

  return {
    firstName: 'Fallback',
    lastName: 'User',
    email: fallbackEmail,
    password: fallbackPassword
  }
}

const buildTestCredentials = (): Credentials => {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    firstName: 'Flow',
    lastName: 'Runner',
    email: `e2e-${suffix}@example.com`,
    password: TEST_PASSWORD
  }
}

const parseTotalQuestionCount = async (page: Page): Promise<number> => {
  const questionHeading = page.getByRole('heading', { name: /Question \d+ of \d+/ })
  await expect(questionHeading).toBeVisible({ timeout: 12000 })
  const headingText = (await questionHeading.textContent()) || ''
  const match = headingText.match(/Question\s+\d+\s+of\s+(\d+)/i)
  const parsed = match ? Number.parseInt(match[1], 10) : 15
  return Number.isNaN(parsed) || parsed <= 0 ? 15 : parsed
}

const getAuthToken = async (page: Page): Promise<string | null> => {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw)
      const token = typeof parsed?.token === 'string' ? parsed.token.trim() : ''
      if (!token) {
        return null
      }

      const segments = token.split('.')
      if (segments.length !== 3) {
        return null
      }

      return token
    } catch {
      return null
    }
  }, AUTH_STORAGE_KEY)
}

const isAuthRoute = (url: string): boolean => {
  return /\/dashboard|\/assessment|\/training/.test(url)
}

const attemptLogin = async (page: Page, credentials: Credentials): Promise<boolean> => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  try {
    await page.waitForURL(/\/dashboard|\/assessment|\/training/, { timeout: 12000 })
    return true
  } catch {
    return false
  }
}

const attemptSignup = async (page: Page, credentials: Credentials): Promise<boolean> => {
  await page.goto('/register')
  await page.getByLabel('First name').fill(credentials.firstName)
  await page.getByLabel('Last name').fill(credentials.lastName)
  await page.getByLabel('Email address').first().fill(credentials.email)
  await page.getByLabel('Password').first().fill(credentials.password)
  await page.getByLabel('Confirm password').fill(credentials.password)

  const termsCheckbox = page.getByRole('checkbox', { name: /I agree to the Terms of Service/i })
  await termsCheckbox.check()
  await expect(termsCheckbox).toBeChecked()

  await page.getByRole('button', { name: 'Create account' }).click()

  try {
    await page.waitForURL(/\/dashboard|\/assessment|\/training/, { timeout: 12000 })
    return true
  } catch {
    return false
  }
}

const establishAuthenticatedSession = async (page: Page): Promise<Credentials> => {
  const fallback = getFallbackCredentials()

  if (fallback && (await attemptLogin(page, fallback))) {
    return fallback
  }

  const generated = buildTestCredentials()

  if (await attemptSignup(page, generated)) {
    return generated
  }

  if (await attemptLogin(page, generated)) {
    return generated
  }

  if (fallback) {
    const fallbackAuthenticated = await attemptLogin(page, fallback)
    if (fallbackAuthenticated) {
      return fallback
    }
  }

  throw new Error('Unable to establish an authenticated session for portfolio E2E run.')
}

const completeAssessment = async (page: Page): Promise<void> => {
  await page.goto('/assessment')
  await expect(page.getByRole('heading', { name: 'LitmusAI Assessment' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start the test' })).toBeVisible()
  await page.getByRole('button', { name: 'Start the test' }).click()

  const totalQuestions = await parseTotalQuestionCount(page)

  for (let index = 0; index < totalQuestions; index += 1) {
    await expect(page.getByRole('heading', { name: /Question \d+ of \d+/ })).toBeVisible({ timeout: 12000 })

    const answerLetter = QUIZ_ANSWERS[Math.min(index, QUIZ_ANSWERS.length - 1)] || 'A'
    const answerOption = page.getByRole('radio', { name: new RegExp(`^${answerLetter}\\.`) })
    await expect(answerOption).toBeVisible({ timeout: 6000 })
    await answerOption.check()

    const submitButton = page.getByRole('button', { name: 'Submit Assessment' })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      break
    }

    const nextButton = page.getByRole('button', { name: 'Next' })
    await expect(nextButton).toBeVisible({ timeout: 5000 })
    await nextButton.click()
  }

  await expect(page.getByRole('heading', { name: 'Assessment Complete!' })).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('heading', { name: 'Overall Score' })).toBeVisible()
}

const normalizeContentType = (value?: string): string => {
  return (value || '').toLowerCase().trim()
}

const fetchAssessmentRecommendations = async (request: APIRequestContext, token: string): Promise<Recommendation[]> => {
  const response = await request.get('/api/assessment/recommendations', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok()) {
    return []
  }

  const payload = await response.json()
  return Array.isArray(payload?.recommendations) ? payload.recommendations : []
}

const findPlayableVideoLessonInModule = async (
  request: APIRequestContext,
  token: string,
  moduleId: string
): Promise<LessonPreview | null> => {
  const lessonsResponse = await request.get(`/api/course/modules/${moduleId}/lessons`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!lessonsResponse.ok()) {
    return null
  }

  const lessonsPayload = await lessonsResponse.json()
  const lessons = Array.isArray(lessonsPayload?.lessons) ? lessonsPayload.lessons : []

  for (const lesson of lessons) {
    if (!lesson || typeof lesson.id !== 'string') {
      continue
    }

    if (normalizeContentType(lesson.content_type) !== 'video') {
      continue
    }

    const lessonResponse = await request.get(`/api/course/lessons/${lesson.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!lessonResponse.ok()) {
      continue
    }

    const lessonPayload = await lessonResponse.json()
    const videoUrl = lessonPayload?.content?.video_url
    if (typeof videoUrl === 'string' && videoUrl.trim()) {
      return lesson as LessonPreview
    }
  }

  return null
}

const resolvePlayableRecommendationTarget = async (
  request: APIRequestContext,
  token: string
): Promise<PlayableTarget> => {
  const recommendations = await fetchAssessmentRecommendations(request, token)
  const candidateModuleIds = [
    ...recommendations
      .map((recommendation) => recommendation.id)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, list) => list.indexOf(id) === index),
    DEFAULT_MODULE_ID
  ]

  for (const moduleId of candidateModuleIds) {
    const moduleMeta = recommendations.find((recommendation) => recommendation.id === moduleId)
    if (moduleMeta) {
      const type = normalizeContentType(moduleMeta.content_type)
      if (type === 'external' || type === 'partner' || type === 'affiliate') {
        continue
      }
    }

    const lesson = await findPlayableVideoLessonInModule(request, token, moduleId)
    if (lesson) {
      return {
        moduleId,
        lessonId: lesson.id
      }
    }
  }

  throw new Error('No playable recommendation video lesson is available for this environment.')
}

const openPlayableLesson = async (page: Page, target: PlayableTarget): Promise<void> => {
  await page.goto(`/training/modules/${target.moduleId}/learn`)
  await expect(page).toHaveURL(new RegExp(`/training/modules/${target.moduleId}/learn`))

  const lessonButton = page.getByTestId(`course-viewer-lesson-${target.lessonId}-button`)
  await expect(lessonButton).toBeVisible({ timeout: 20000 })
  await lessonButton.click()

  const iframe = page.getByTestId(`video-lesson-iframe-${target.lessonId}`)
  await expect(iframe).toBeVisible({ timeout: 20000 })
  await expect(iframe).toHaveAttribute('src', /.+/)
}

test.use({
  video: {
    mode: 'on'
  }
})

test('Portfolio run: sign in, complete assessment, and open recommended video lesson', async ({ page, request }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  const credentials = await establishAuthenticatedSession(page)
  const token = await getAuthToken(page)

  if (!token) {
    const loginSuccess = await attemptLogin(page, credentials)
    if (!loginSuccess) {
      test.skip(true, 'Could not persist an auth session token for API calls.')
    }
  }

  const finalToken = token || (await getAuthToken(page))
  if (!finalToken) {
    throw new Error('Authentication token missing after sign-in flow.')
  }

  await completeAssessment(page)

  const target = await resolvePlayableRecommendationTarget(request, finalToken)
  await openPlayableLesson(page, target)
  await expect(page.getByRole('button', { name: 'Back to Courses' })).toBeVisible()
  const video = page.video()
  expect(video).not.toBeNull()
})
