import { expect, Page } from '@playwright/test'

export const SUPABASE_STUB_STATE_KEY = '__playwright_supabase_stub__'
export const TARGET_MODULE_ID = 'module-ai-fundamentals-intro'

export const resetBrowserStorage = async (page: Page): Promise<void> => {
  await page.context().clearCookies()
  await page.goto('/')
  await page.evaluate((storageKey) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.sessionStorage.removeItem(storageKey)
  }, SUPABASE_STUB_STATE_KEY)
}

export const readSupabaseStubState = async (page: Page) => {
  return page.evaluate((storageKey) => {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : null
  }, SUPABASE_STUB_STATE_KEY)
}

export const signInFromLoginPage = async (page: Page) => {
  await expect(page.getByRole('heading', { name: 'Sign in to LitmusAI' })).toBeVisible()
  await page.getByRole('button', { name: /Continue with Google/i }).click()
}
