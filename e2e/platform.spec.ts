import { expect, test } from '@playwright/test'
import {
  PLAYWRIGHT_AUTH0_ACCESS_TOKEN,
  TARGET_MODULE_ID,
  installAuth0AppStubs,
  installCourseViewerStubs,
  readAuth0StubState,
  resetBrowserStorage
} from './auth0TestHelpers'

test('Register initiation captures the Auth0 signup intent and lands on the dashboard after callback exchange', async ({ page }) => {
  await resetBrowserStorage(page)
  const logs = await installAuth0AppStubs(page, {
    backendUser: {
      email: 'new-learner@example.com',
      first_name: 'New'
    }
  })

  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Create your account with Auth0' })).toBeVisible()

  await page.getByLabel('Email').fill('new-learner@example.com')
  await page.getByRole('button', { name: 'Continue to Create Account' }).click()

  await expect(page).toHaveURL(/\/auth\/callback/)

  const auth0State = await readAuth0StubState(page)
  expect(auth0State.lastRedirectRequest?.authorizationParams?.login_hint).toBe('new-learner@example.com')
  expect(auth0State.lastRedirectRequest?.authorizationParams?.screen_hint).toBe('signup')
  expect(auth0State.lastRedirectRequest?.appState?.returnTo).toBe('/dashboard')

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, New!/i })).toBeVisible()
  expect(logs.exchangeBodies.length).toBeGreaterThan(0)
  logs.exchangeBodies.forEach((payload) => {
    expect(payload).toEqual(expect.objectContaining({
      access_token: PLAYWRIGHT_AUTH0_ACCESS_TOKEN
    }))
  })
})

test('Protected course routes preserve returnTo across Auth0 login and restore authenticated course access', async ({ page }) => {
  await resetBrowserStorage(page)
  const logs = await installAuth0AppStubs(page, {
    backendUser: {
      email: 'course-learner@example.com',
      first_name: 'Course'
    }
  })
  await installCourseViewerStubs(page, logs, TARGET_MODULE_ID)

  await page.goto(`/training/modules/${TARGET_MODULE_ID}/learn`)

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible()

  await page.getByLabel('Email').fill('course-learner@example.com')
  await page.getByRole('button', { name: 'Continue with Email & Password' }).click()

  await expect(page).toHaveURL(/\/auth\/callback/)

  const auth0State = await readAuth0StubState(page)
  expect(auth0State.lastRedirectRequest?.appState?.returnTo).toBe(`/training/modules/${TARGET_MODULE_ID}/learn`)

  await expect(page).toHaveURL(new RegExp(`/training/modules/${TARGET_MODULE_ID}/learn$`))

  await expect(page.getByTestId('course-viewer-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome to AI Fundamentals' })).toBeVisible()
  expect(logs.exchangeBodies.length).toBeGreaterThan(0)
  logs.exchangeBodies.forEach((payload) => {
    expect(payload).toEqual(expect.objectContaining({
      access_token: PLAYWRIGHT_AUTH0_ACCESS_TOKEN
    }))
  })
  expect(logs.authorizedPaths).toEqual(
    expect.arrayContaining([
      `/api/course/modules/${TARGET_MODULE_ID}/lessons`,
      '/api/course/lessons/lesson-welcome'
    ])
  )
})
