import { expect, Page } from '@playwright/test'

export const CLERK_STUB_STATE_KEY = '__playwright_clerk_stub__'
export const TARGET_MODULE_ID = 'module-ai-fundamentals-intro'

export const resetBrowserStorage = async (page: Page): Promise<void> => {
  await page.context().clearCookies()
  await page.goto('/')
  await page.evaluate((storageKey) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.sessionStorage.removeItem(storageKey)
  }, CLERK_STUB_STATE_KEY)
}

export const readClerkStubState = async (page: Page) => {
  return page.evaluate((storageKey) => {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  }, CLERK_STUB_STATE_KEY)
}

export const signInFromLoginPage = async (page: Page) => {
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to Sign In' }).click()
}
