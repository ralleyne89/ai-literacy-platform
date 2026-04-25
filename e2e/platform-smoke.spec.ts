import { expect, test } from '@playwright/test'
import {
  readSupabaseStubState,
  resetBrowserStorage,
  signInFromLoginPage,
} from './supabaseTestHelpers'

test('Smoke: Supabase sign-in restores dashboard access', async ({ page }) => {
  await resetBrowserStorage(page)
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/login$/)
  await signInFromLoginPage(page)

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, Demo!/i })).toBeVisible()

  const supabaseState = await readSupabaseStubState(page)
  expect(supabaseState).toEqual(
    expect.objectContaining({
      session: expect.objectContaining({
        access_token: 'demo',
      }),
      lastRedirectRequest: expect.objectContaining({
        type: 'oauth',
        provider: 'google',
        redirectPath: '/auth/callback',
      }),
    })
  )
})
