import { expect, test } from '@playwright/test'
import {
  PLAYWRIGHT_AUTH0_ACCESS_TOKEN,
  PLAYWRIGHT_BACKEND_TOKEN,
  installAuth0AppStubs,
  readAuth0StubState,
  readStoredBackendSession,
  resetBrowserStorage
} from './auth0TestHelpers'

test('Smoke: login redirect completes callback exchange and restores dashboard access', async ({ page }) => {
  await resetBrowserStorage(page)
  const logs = await installAuth0AppStubs(page, {
    backendUser: {
      email: 'ada@example.com',
      first_name: 'Ada'
    }
  })

  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible()

  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByRole('button', { name: 'Continue with Email & Password' }).click()

  await expect(page).toHaveURL(/\/auth\/callback/)

  const auth0State = await readAuth0StubState(page)
  expect(auth0State.lastRedirectRequest?.authorizationParams?.login_hint).toBe('ada@example.com')
  expect(auth0State.lastRedirectRequest?.appState?.returnTo).toBe('/dashboard')

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, Ada!/i })).toBeVisible()

  expect(logs.exchangeBodies.length).toBeGreaterThan(0)
  logs.exchangeBodies.forEach((payload) => {
    expect(payload).toEqual(expect.objectContaining({
      access_token: PLAYWRIGHT_AUTH0_ACCESS_TOKEN
    }))
  })
  expect(logs.authorizedPaths).toEqual(
    expect.arrayContaining([
      '/api/assessment/history',
      '/api/training/progress',
      '/api/assessment/recommendations'
    ])
  )

  const backendSession = await readStoredBackendSession(page)
  expect(backendSession).toEqual(
    expect.objectContaining({
      token: PLAYWRIGHT_BACKEND_TOKEN,
      user: expect.objectContaining({
        email: 'ada@example.com'
      })
    })
  )
})
