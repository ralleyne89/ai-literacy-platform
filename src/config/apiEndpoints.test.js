import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...import.meta.env }

const loadApiEndpoints = async (apiUrl) => {
  vi.resetModules()
  import.meta.env.VITE_API_URL = apiUrl
  return import('./apiEndpoints')
}

afterEach(() => {
  vi.resetModules()
  Object.keys(import.meta.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete import.meta.env[key]
    }
  })
  Object.assign(import.meta.env, originalEnv)
})

describe('apiEndpoints', () => {
  it('preserves Supabase Edge Function path segments in VITE_API_URL', async () => {
    const endpoints = await loadApiEndpoints(
      'https://project-ref.supabase.co/functions/v1/platform-api/'
    )

    expect(endpoints.API_BASE_URL).toBe(
      'https://project-ref.supabase.co/functions/v1/platform-api'
    )
    expect(endpoints.AUTH_ENDPOINTS.profile).toBe(
      'https://project-ref.supabase.co/functions/v1/platform-api/api/auth/profile'
    )
    expect(endpoints.BILLING_ENDPOINTS.config).toBe(
      'https://project-ref.supabase.co/functions/v1/platform-api/api/billing/config'
    )
  })

  it('continues to support origin-only backend API URLs', async () => {
    const endpoints = await loadApiEndpoints('https://api.example.com/')

    expect(endpoints.API_BASE_URL).toBe('https://api.example.com')
    expect(endpoints.AUTH_ENDPOINTS.profile).toBe('https://api.example.com/api/auth/profile')
  })

  it('flags Supabase REST URLs as API routing misconfiguration', async () => {
    const endpoints = await loadApiEndpoints('https://project-ref.supabase.co/rest/v1')

    expect(endpoints.getApiRoutingIssue()).toEqual({
      code: 'supabase_rest_api_misroute',
      message: expect.stringContaining('/functions/v1/platform-api'),
    })
  })

  it('requires Supabase project URLs to target the platform-api Edge Function', async () => {
    const endpoints = await loadApiEndpoints('https://project-ref.supabase.co')

    expect(endpoints.getApiRoutingIssue()).toEqual({
      code: 'supabase_edge_function_url_required',
      message: expect.stringContaining('/functions/v1/platform-api'),
    })
  })
})
