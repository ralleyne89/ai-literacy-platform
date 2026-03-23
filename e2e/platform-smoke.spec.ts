import { expect, test } from '@playwright/test'
import {
  readClerkStubState,
  resetBrowserStorage,
  signInFromLoginPage,
} from './clerkTestHelpers'

test('Smoke: Clerk sign-in restores dashboard access', async ({ page }) => {
  await resetBrowserStorage(page)
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login$/)
  await signInFromLoginPage(page)

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, Demo!/i })).toBeVisible()

  const clerkState = await readClerkStubState(page)
  expect(clerkState).toEqual(
    expect.objectContaining({
      isSignedIn: true,
      token: 'demo',
      lastRedirectRequest: expect.objectContaining({
        type: 'sign-in',
        redirectPath: '/dashboard',
      }),
    })
  )
})
