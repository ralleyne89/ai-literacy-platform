import { Page, Request, Route } from '@playwright/test'

export const AUTH0_STUB_STATE_KEY = '__playwright_auth0_stub__'
export const AUTH_RETURN_TO_SESSION_KEY = 'ailiteracy_auth_return_to'
export const BACKEND_SESSION_STORAGE_KEY = 'ailiteracy_backend_auth'
export const TARGET_MODULE_ID = 'module-ai-fundamentals-intro'
export const PLAYWRIGHT_AUTH0_ACCESS_TOKEN = 'playwright-auth0-access-token'
export const PLAYWRIGHT_BACKEND_TOKEN = 'header.payload.signature'

type BackendUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  organization: string
  subscription_tier: string
}

type InstallAuth0AppStubsOptions = {
  exchangeDelayMs?: number
  backendUser?: Partial<BackendUser>
}

type Auth0StubState = {
  pendingRedirect?: boolean
  isAuthenticated?: boolean
  callbackHandled?: boolean
  accessToken?: string
  user?: {
    sub?: string
    email?: string
    name?: string
  }
  lastRedirectRequest?: {
    appState?: {
      returnTo?: string
    }
    authorizationParams?: {
      login_hint?: string
      screen_hint?: string
      connection?: string
      redirect_uri?: string
    }
  }
}

export type Auth0RouteLogs = {
  exchangeBodies: Array<Record<string, unknown>>
  authorizedPaths: string[]
}

const DEFAULT_BACKEND_USER: BackendUser = {
  id: 'user-playwright',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  role: 'learner',
  organization: 'LitmusAI',
  subscription_tier: 'free'
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const jsonResponse = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body)
})

const mergeBackendUser = (backendUser?: Partial<BackendUser>): BackendUser => ({
  ...DEFAULT_BACKEND_USER,
  ...backendUser
})

const captureAuthorizedPath = (request: Request, logs: Auth0RouteLogs) => {
  const authorization = request.headers().authorization || ''
  if (!authorization.startsWith('Bearer ')) {
    return
  }

  logs.authorizedPaths.push(new URL(request.url()).pathname)
}

const parseRequestBody = (request: Request) => {
  try {
    return request.postDataJSON() as Record<string, unknown>
  } catch {
    return {}
  }
}

const fulfillExchange = async (
  route: Route,
  logs: Auth0RouteLogs,
  backendUser: BackendUser,
  exchangeDelayMs: number
) => {
  logs.exchangeBodies.push(parseRequestBody(route.request()))

  if (exchangeDelayMs > 0) {
    await wait(exchangeDelayMs)
  }

  await route.fulfill(
    jsonResponse({
      access_token: PLAYWRIGHT_BACKEND_TOKEN,
      user: backendUser
    })
  )
}

export const resetBrowserStorage = async (page: Page): Promise<void> => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
}

export const installAuth0AppStubs = async (
  page: Page,
  {
    exchangeDelayMs = 250,
    backendUser: providedBackendUser
  }: InstallAuth0AppStubsOptions = {}
): Promise<Auth0RouteLogs> => {
  const backendUser = mergeBackendUser(providedBackendUser)
  const logs: Auth0RouteLogs = {
    exchangeBodies: [],
    authorizedPaths: []
  }

  await page.route('**/api/auth/exchange', async (route) => {
    await fulfillExchange(route, logs, backendUser, exchangeDelayMs)
  })

  await page.route('**/api/assessment/history', async (route) => {
    captureAuthorizedPath(route.request(), logs)
    await route.fulfill(
      jsonResponse({
        history: [
          {
            total_score: 13,
            max_score: 15,
            percentage: 87,
            score_band: 'advanced',
            completed_at: '2026-03-05T10:30:00.000Z',
            domain_scores: JSON.stringify({
              'AI Basics': {
                score: 4,
                total: 5
              }
            }),
            recommendations: [
              {
                id: TARGET_MODULE_ID,
                title: 'AI Fundamentals Intro',
                description: 'Build a strong foundation in AI concepts.',
                reason: 'Recommended next step',
                difficulty_level: 1,
                estimated_duration_minutes: 30,
                content_type: 'module',
                is_premium: false,
                priority: 'high'
              }
            ]
          }
        ]
      })
    )
  })

  await page.route('**/api/training/progress', async (route) => {
    captureAuthorizedPath(route.request(), logs)
    await route.fulfill(
      jsonResponse({
        progress: [
          {
            module_id: TARGET_MODULE_ID,
            module_title: 'AI Fundamentals Intro',
            status: 'in_progress',
            progress_percentage: 25,
            time_spent_minutes: 15
          }
        ],
        summary: {
          completed_modules: 0,
          total_learning_time: 15,
          resume_module: {
            module_id: TARGET_MODULE_ID,
            module_title: 'AI Fundamentals Intro',
            progress_percentage: 25
          }
        }
      })
    )
  })

  await page.route('**/api/assessment/recommendations', async (route) => {
    captureAuthorizedPath(route.request(), logs)
    await route.fulfill(
      jsonResponse({
        recommendations: [
          {
            id: TARGET_MODULE_ID,
            title: 'AI Fundamentals Intro',
            description: 'Learn the essentials before moving into advanced practice.',
            reason: 'Recommended for new learners',
            difficulty_level: 1,
            estimated_duration_minutes: 30,
            content_type: 'module',
            is_premium: false,
            priority: 'high'
          }
        ]
      })
    )
  })

  return logs
}

export const installCourseViewerStubs = async (
  page: Page,
  logs: Auth0RouteLogs,
  moduleId = TARGET_MODULE_ID
): Promise<void> => {
  await page.route(`**/api/course/modules/${moduleId}/lessons`, async (route) => {
    captureAuthorizedPath(route.request(), logs)
    await route.fulfill(
      jsonResponse({
        module: {
          id: moduleId,
          title: 'AI Fundamentals Intro'
        },
        module_progress: {
          module_id: moduleId,
          progress_percentage: 0,
          resume_lesson_id: 'lesson-welcome'
        },
        lessons: [
          {
            id: 'lesson-welcome',
            title: 'Welcome to AI Fundamentals',
            status: 'in_progress',
            estimated_duration_minutes: 5,
            content_type: 'text'
          }
        ]
      })
    )
  })

  await page.route('**/api/course/lessons/lesson-welcome', async (route) => {
    captureAuthorizedPath(route.request(), logs)
    await route.fulfill(
      jsonResponse({
        id: 'lesson-welcome',
        title: 'Welcome to AI Fundamentals',
        description: 'Start with the foundations of safe and effective AI use.',
        content_type: 'text',
        progress: {
          status: 'in_progress'
        },
        content: {
          sections: [
            {
              heading: 'Course Overview',
              content: 'This lesson introduces the structure of the AI fundamentals track.'
            }
          ]
        }
      })
    )
  })
}

export const readAuth0StubState = async (page: Page): Promise<Auth0StubState> => {
  return page.evaluate((storageKey) => {
    try {
      return JSON.parse(window.sessionStorage.getItem(storageKey) || '{}')
    } catch {
      return {}
    }
  }, AUTH0_STUB_STATE_KEY)
}

export const readStoredBackendSession = async (page: Page) => {
  return page.evaluate((storageKey) => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || 'null')
    } catch {
      return null
    }
  }, BACKEND_SESSION_STORAGE_KEY)
}

export const readStoredReturnTo = async (page: Page): Promise<string> => {
  return page.evaluate((storageKey) => window.sessionStorage.getItem(storageKey) || '', AUTH_RETURN_TO_SESSION_KEY)
}
