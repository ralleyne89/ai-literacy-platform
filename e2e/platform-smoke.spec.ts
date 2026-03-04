import { expect, Page, test } from '@playwright/test'

const FALLBACK_EMAIL =
  process.env.E2E_ADMIN_EMAIL ||
  process.env.E2E_TEST_EMAIL ||
  process.env.PLAYWRIGHT_TEST_EMAIL ||
  'reggiealleyne89@gmail.com'
const FALLBACK_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || process.env.E2E_TEST_PASSWORD || process.env.PLAYWRIGHT_TEST_PASSWORD || ''

const isVisible = async (page: Page, selector: string | RegExp, timeout = 5000): Promise<boolean> => {
  const locator = page.getByText(selector)
  try {
    await locator.waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

const assertLoginFailureState = async (page: Page): Promise<void> => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill('does-not-exist@example.com')
  await page.getByLabel('Password').fill('WrongPassword1234!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login/)
  const failureMessageVisible = await isVisible(
    page,
    /invalid|unable to|does not exist|doesn't exist|doesn'?t exist|not confirmed|not configured|supabase/i,
    6000
  )
  const fallbackErrorBannerVisible = await page.locator('.bg-red-50 .text-red-700').first().isVisible()
  await expect(failureMessageVisible || fallbackErrorBannerVisible, 'Expected a login failure state.').toBe(true)
}

const attemptLogin = async (page: Page, email: string, password: string): Promise<boolean> => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForLoadState('networkidle')
  return page.url().includes('/dashboard') || page.url().includes('/assessment') || page.url().includes('/training')
}

const assertDashboardAccessible = async (page: Page): Promise<void> => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByLabel('Email address')).not.toBeVisible()
}

test('Smoke: auth-state assertions only', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  await assertLoginFailureState(page)

  if (!FALLBACK_PASSWORD) {
    test.skip(
      true,
      'E2E_ADMIN_PASSWORD (or fallback aliases) must be set for auth smoke login assertions'
    )
  }

  const loginSucceeded = await attemptLogin(page, FALLBACK_EMAIL, FALLBACK_PASSWORD)
  await expect(loginSucceeded, 'Expected admin login to succeed.').toBe(true)

  await assertDashboardAccessible(page)
})
