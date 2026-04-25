import { expect, test } from '@playwright/test'
import {
  TARGET_MODULE_ID,
  readSupabaseStubState,
  resetBrowserStorage,
  signInFromLoginPage,
} from './supabaseTestHelpers'

test('Register entrypoint launches Supabase OAuth and lands on the dashboard', async ({ page }) => {
  await resetBrowserStorage(page)

  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Create your LitmusAI account' })).toBeVisible()

  await page.getByRole('button', { name: /Continue with Google/i }).click()

  const supabaseState = await readSupabaseStubState(page)
  expect(supabaseState?.lastRedirectRequest).toEqual(
    expect.objectContaining({
      type: 'oauth',
      provider: 'google',
      redirectPath: '/auth/callback',
    })
  )

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, Demo!/i })).toBeVisible()
})

test('Protected course routes preserve returnTo across Supabase sign-in', async ({ page }) => {
  await resetBrowserStorage(page)

  await page.goto(`/training/modules/${TARGET_MODULE_ID}/learn`)

  await expect(page).toHaveURL(/\/login$/)
  await signInFromLoginPage(page)

  await expect(page).toHaveURL(new RegExp(`/training/modules/${TARGET_MODULE_ID}/learn$`))
  const supabaseState = await readSupabaseStubState(page)
  expect(supabaseState?.lastRedirectRequest).toEqual(
    expect.objectContaining({
      type: 'oauth',
      provider: 'google',
      redirectPath: '/auth/callback',
    })
  )

  await expect(page.getByTestId('course-viewer-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome to AI Fundamentals' })).toBeVisible()
})
