import { expect, test } from '@playwright/test'
import {
  TARGET_MODULE_ID,
  readClerkStubState,
  resetBrowserStorage,
  signInFromLoginPage,
} from './clerkTestHelpers'

test('Register entrypoint launches Clerk sign-up and lands on the dashboard', async ({ page }) => {
  await resetBrowserStorage(page)

  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

  await page.getByRole('button', { name: 'Continue to Create Account' }).click()

  const clerkState = await readClerkStubState(page)
  expect(clerkState?.lastRedirectRequest).toEqual(
    expect.objectContaining({
      type: 'sign-up',
      redirectPath: '/dashboard',
    })
  )

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, Demo!/i })).toBeVisible()
})

test('Protected course routes preserve returnTo across Clerk sign-in', async ({ page }) => {
  await resetBrowserStorage(page)

  await page.goto(`/training/modules/${TARGET_MODULE_ID}/learn`)

  await expect(page).toHaveURL(/\/login$/)
  await signInFromLoginPage(page)

  await expect(page).toHaveURL(new RegExp(`/training/modules/${TARGET_MODULE_ID}/learn$`))
  const clerkState = await readClerkStubState(page)
  expect(clerkState?.lastRedirectRequest).toEqual(
    expect.objectContaining({
      type: 'sign-in',
      redirectPath: `/training/modules/${TARGET_MODULE_ID}/learn`,
    })
  )

  await expect(page.getByTestId('course-viewer-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome to AI Fundamentals' })).toBeVisible()
})
