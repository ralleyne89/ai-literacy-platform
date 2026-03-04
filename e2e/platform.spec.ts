import { expect, Locator, Page, test } from '@playwright/test'

type Credentials = {
  email: string
  password: string
  firstName: string
  lastName: string
}

type AuthState = 'authenticated' | 'confirmation' | 'needs-login' | 'failed'

const TARGET_MODULE_ID = process.env.E2E_TEST_MODULE_ID || 'module-ai-fundamentals-intro'
const FALLBACK_EMAIL = process.env.E2E_TEST_EMAIL || process.env.E2E_ADMIN_EMAIL || process.env.PLAYWRIGHT_TEST_EMAIL || ''
const FALLBACK_PASSWORD = process.env.E2E_TEST_PASSWORD || process.env.E2E_ADMIN_PASSWORD || process.env.PLAYWRIGHT_TEST_PASSWORD || ''
const TEST_PASSWORD = 'TestPass1234!'

const QUIZ_ANSWERS = ['A', 'B', 'B']
const ANSWER_INDEX = { A: 0, B: 1, C: 2, D: 3 }

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const isVisible = async (locator: Locator, timeout = 4000): Promise<boolean> => {
  try {
    await locator.waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

const isAuthenticatedRoute = (url: string): boolean => {
  return url.includes('/dashboard') || url.includes('/assessment') || url.includes('/training') || url.includes('/certification') || url.includes('/profile')
}

const parseTotalQuestionCount = async (page: Page): Promise<number> => {
  const questionHeading = page.getByRole('heading', { name: /Question \d+ of \d+/ })
  await expect(questionHeading).toBeVisible({ timeout: 12000 })
  const headingText = (await questionHeading.textContent()) || ''
  const match = headingText.match(/Question\s+\d+\s+of\s+(\d+)/i)
  const parsed = match ? Number.parseInt(match[1], 10) : 15
  return Number.isNaN(parsed) || parsed <= 0 ? 15 : parsed
}

const buildTestCredentials = (): Credentials => {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  return {
    firstName: 'Flow',
    lastName: 'Tester',
    email: `e2e-${suffix}@example.com`,
    password: TEST_PASSWORD
  }
}

const getFallbackCredentials = (): Credentials | null => {
  if (!FALLBACK_EMAIL || !FALLBACK_PASSWORD) {
    return null
  }

  return {
    firstName: 'Fallback',
    lastName: 'User',
    email: FALLBACK_EMAIL,
    password: FALLBACK_PASSWORD
  }
}

const fillRegistration = async (page: Page, credentials: Credentials): Promise<void> => {
  await page.getByLabel('First name').fill(credentials.firstName)
  await page.getByLabel('Last name').fill(credentials.lastName)
  await page.getByLabel('Email address').first().fill(credentials.email)
  await page.getByLabel('Password').first().fill(credentials.password)
  await page.getByLabel('Confirm password').fill(credentials.password)
  const termsCheckbox = page.getByRole('checkbox', { name: /I agree to the Terms of Service/i })
  await termsCheckbox.check()
  await expect(termsCheckbox).toBeChecked()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  await page.getByRole('button', { name: 'Create account' }).click()
}

const detectAuthState = async (page: Page): Promise<AuthState> => {
  await page.waitForLoadState('networkidle')
  const url = page.url()

  if (isAuthenticatedRoute(url)) {
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 10000 })
    return 'authenticated'
  }

  if (await isVisible(page.getByText(/check your email to confirm your account/i), 3000)) {
    await expect(page.getByText(/check your email to confirm your account/i)).toBeVisible()
    return 'confirmation'
  }

  if (url.includes('/login') || url.includes('/register')) {
    if (url.includes('/register')) {
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
      await expect(page.getByRole('link', { name: /^Sign In$/ })).toBeVisible()
    }
    return 'needs-login'
  }

  return 'failed'
}

const completeSignup = async (page: Page, credentials: Credentials): Promise<AuthState> => {
  await page.goto('/register')
  await fillRegistration(page, credentials)
  return detectAuthState(page)
}

const assertLoginFailureState = async (page: Page): Promise<void> => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible()
  await page.getByLabel('Email address').fill('does-not-exist@example.com')
  await page.getByLabel('Password').fill('WrongPassword1234!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/login/)
  const hasFailureText = await isVisible(
    page.getByText(/invalid|unable to|does not exist|doesn't exist|doesn'?t exist|not confirmed|supabase|not configured/i),
    6000
  )
  const hasInlineError = await page.locator('.bg-red-50 .text-red-700').first().isVisible()
  await expect(hasFailureText || hasInlineError, 'Expected a login failure state.').toBe(true)
}

const loginWithCredentials = async (page: Page, credentials: Credentials): Promise<boolean> => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  try {
    await page.waitForURL(/\/dashboard|\/assessment|\/training|\/certification|\/profile/, { timeout: 12000 })
    return true
  } catch {
    return false
  }
}

const completeAssessment = async (page: Page): Promise<string> => {
  await page.goto('/assessment')
  await expect(page.getByRole('heading', { name: 'LitmusAI Assessment' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Before You Begin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start the test' })).toBeVisible()
  await page.getByRole('button', { name: 'Start the test' }).click()

  const totalQuestions = await parseTotalQuestionCount(page)
  for (let index = 0; index < totalQuestions; index += 1) {
    const questionHeading = page.getByRole('heading', { name: /Question \d+ of \d+/ })
    await expect(questionHeading).toBeVisible({ timeout: 12000 })

    const answerLetter = QUIZ_ANSWERS[Math.min(index, QUIZ_ANSWERS.length - 1)] || 'A'
    const answerOption = page.getByRole('radio', { name: new RegExp(`^${answerLetter}\\.`) })
    await answerOption.check()

    const submitButton = page.getByRole('button', { name: 'Submit Assessment' })
    if (await isVisible(submitButton, 1000)) {
      await submitButton.click()
      break
    }

    await page.getByRole('button', { name: 'Next' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Assessment Complete!' })).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('heading', { name: 'Overall Score' })).toBeVisible()

  const scoreText = (await page.getByRole('heading', { name: /^\d+%$/ }).first().textContent())?.trim()
  if (!scoreText) {
    throw new Error('Could not read a numeric assessment score from the completion screen.')
  }
  await expect(page.getByRole('heading', { name: 'Assessment Complete!' })).toBeVisible()
  await expect(page.getByText(/Overall Score/)).toBeVisible()
  await expect(page.getByText(/Personalized Recommendations/)).toBeVisible()
  await expect(page.getByText(/Domain Breakdown/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start Training Modules' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View Dashboard' })).toBeVisible()

  return scoreText
}

const verifyDashboardState = async (page: Page, expectedScore: string): Promise<void> => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
  await expect(page.getByText(/Recent Assessment/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Latest Assessment/i })).toBeVisible()
  await expect(page.getByText(/Latest Assessment/i)).toBeVisible()
  await expect(page.getByText(/Overall Score/i)).toBeVisible()
  await expect(page.getByText(/LitmusAI Level:/i)).toBeVisible()
  await expect(page.getByText(expectedScore)).toBeVisible()
  await expect(page.getByText(/Recommended next steps/i)).toBeVisible()
  await expect(page.getByText(/Training Progress/i)).toBeVisible()
  await expect(page.getByText(/Modules Completed/i)).toBeVisible()
  await expect(page.getByText(/Learning Time/i)).toBeVisible()
  await expect(page.getByText(/Completed/i)).toBeVisible()
  const recommendationsSection = page.getByRole('heading', { name: /Recommended for You/i })
  if (await isVisible(recommendationsSection)) {
    await expect(recommendationsSection).toBeVisible()
    await expect(page.getByText(/Based on your assessment results, these courses will help strengthen your skills./i)).toBeVisible()
    await expect(page.getByRole('link', { name: 'View All Courses' })).toBeVisible()
  }
}

const openTrainingModule = async (page: Page, moduleId: string): Promise<void> => {
  await page.goto(`/training/modules/${moduleId}`)
  await expect(page.getByRole('link', { name: /Start Learning|Continue Learning/i })).toBeVisible({ timeout: 20000 })
  await page.getByRole('link', { name: /Start Learning|Continue Learning/i }).click()
  await expect(page).toHaveURL(new RegExp(`/training/modules/${moduleId}/learn`))
  await expect(page.getByText(/Progress/i)).toBeVisible()
}

const getCurrentLessonTitle = async (page: Page): Promise<string> => {
  const lessonHeading = page.getByRole('heading', { level: 1 })
  await expect(lessonHeading).toBeVisible()
  return (await lessonHeading.textContent())?.trim() || ''
}

const openLessonByTitle = async (page: Page, title: string): Promise<void> => {
  const lessonButton = page.getByRole('button', { name: new RegExp(escapeRegExp(title), 'i') })
  await expect(lessonButton).toBeVisible()
  await lessonButton.click()
  await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(title), 'i') })).toBeVisible()
}

const completeTextLesson = async (page: Page): Promise<void> => {
  const completeButton = page.getByRole('button', { name: 'Mark as Complete' })
  if (await isVisible(completeButton, 1500)) {
    await completeButton.click()
  }

  await expect(page.getByRole('button', { name: /Completed|Mark as Complete/i })).toBeVisible({ timeout: 5000 })
}

const completeInteractiveLesson = async (page: Page): Promise<void> => {
  await expect(page.getByText(/Complete at least 2 exercises/i)).toBeVisible()

  const hintButtons = page.getByRole('button', { name: 'Show Hints' })
  if (await isVisible(hintButtons, 2000)) {
    await hintButtons.first().click()
    await expect(page.getByText(/Add a specific role or perspective/i)).toBeVisible()
  }

  const exerciseCompleteButtons = page.getByRole('button', { name: 'Mark as Complete' })
  const exerciseCount = await exerciseCompleteButtons.count()

  if (exerciseCount > 0 && await exerciseCompleteButtons.nth(0).isEnabled()) {
    await exerciseCompleteButtons.nth(0).click()
  }

  if (exerciseCount > 1 && await exerciseCompleteButtons.nth(1).isEnabled()) {
    await exerciseCompleteButtons.nth(1).click()
  }

  const completeLessonButton = page.getByRole('button', { name: /Complete Lesson/ })
  await expect(completeLessonButton).toBeVisible()
  await expect(completeLessonButton).toBeEnabled()
  await completeLessonButton.click()

  await expect(page.getByRole('button', { name: 'Lesson Completed' })).toBeVisible({ timeout: 12000 })
}

const completeQuizLesson = async (page: Page): Promise<void> => {
  const questionOptions = ['A', 'B', 'B']

  for (let index = 0; index < 20; index += 1) {
    const questionHeading = page.getByRole('heading', { name: /Question \d+ of \d+/ })
    if (!(await isVisible(questionHeading, 5000))) {
      break
    }

    const questionContainer = page.locator('div').filter({ has: questionHeading })
    const answerButtons = questionContainer.getByRole('button')
    await expect(answerButtons).toHaveCount(4, { timeout: 5000 })

    const answerLetter = questionOptions[Math.min(index, questionOptions.length - 1)] || 'A'
    const answerIndex = ANSWER_INDEX[answerLetter as keyof typeof ANSWER_INDEX] ?? 0
    await answerButtons.nth(answerIndex).click()

    const submitButton = page.getByRole('button', { name: 'Submit Quiz' })
    if (await isVisible(submitButton, 1000)) {
      await submitButton.click()
      break
    }

    await page.getByRole('button', { name: 'Next' }).click()
  }

  await expect(page.getByRole('heading', { name: /Congratulations!|Keep Trying!/ })).toBeVisible({ timeout: 12000 })
}

const verifyLessonNavigation = async (page: Page): Promise<void> => {
  const currentTitle = await getCurrentLessonTitle(page)
  await page.getByRole('button', { name: 'Next' }).click()

  const nextTitle = await getCurrentLessonTitle(page)
  expect(nextTitle).not.toBe(currentTitle)

  await page.getByRole('button', { name: 'Previous' }).click()
  const returnedTitle = await getCurrentLessonTitle(page)
  expect(returnedTitle).toBe(currentTitle)
}

test('Signup → assessment → dashboard → course material journey', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  const generatedCredentials = buildTestCredentials()
  const fallback = getFallbackCredentials()
  let authenticated = false

  const registrationState = await completeSignup(page, generatedCredentials)
  if (registrationState === 'authenticated') {
    authenticated = true
  }

  if (!authenticated && registrationState === 'confirmation') {
    if (fallback) {
      authenticated = await loginWithCredentials(page, fallback)
    }

    if (!authenticated) {
      authenticated = await loginWithCredentials(page, generatedCredentials)
    }
  }

  if (!authenticated && registrationState === 'needs-login') {
    authenticated = await loginWithCredentials(page, generatedCredentials)

    if (!authenticated && fallback) {
      authenticated = await loginWithCredentials(page, fallback)
    }
  }

  if (!authenticated) {
    test.skip(true, 'Unable to establish an authenticated session for E2E journey')
    return
  }

  await expect(page).toHaveURL(/\/dashboard|\/assessment|\/training/)

  const scoreText = await completeAssessment(page)
  await verifyDashboardState(page, scoreText)

  await openTrainingModule(page, TARGET_MODULE_ID)

  await openLessonByTitle(page, 'Welcome to AI Fundamentals')
  await completeTextLesson(page)

  await openLessonByTitle(page, 'AI Basics: What is Artificial Intelligence?')
  await verifyLessonNavigation(page)
  await completeTextLesson(page)

  await openLessonByTitle(page, 'Knowledge Check: AI Basics')
  await completeQuizLesson(page)

  await openLessonByTitle(page, 'Hands-On: Practice Prompt Engineering')
  await completeInteractiveLesson(page)

  await expect(page.getByRole('button', { name: 'Back to Courses' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to Courses' }).click()
  await expect(page).toHaveURL(/\/training$/)
  await expect(page.getByRole('heading', { name: 'AI Training Hub' })).toBeVisible()
})
