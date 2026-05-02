import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { AuthProvider, useAuth } from './AuthContext'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
}))

const mockSupabaseState = vi.hoisted(() => ({
  isConfigured: true,
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockAxios.get,
    put: mockAxios.put,
    defaults: mockAxios.defaults,
  },
}))

vi.mock('../services/supabaseClient', () => ({
  getSupabaseConfigError: () => 'Supabase is not configured.',
  isSupabaseConfigured: () => mockSupabaseState.isConfigured,
  supabase: {
    auth: {
      getSession: mockSupabaseState.getSession,
      onAuthStateChange: mockSupabaseState.onAuthStateChange,
      signInWithOAuth: mockSupabaseState.signInWithOAuth,
      signInWithPassword: mockSupabaseState.signInWithPassword,
      signUp: mockSupabaseState.signUp,
      exchangeCodeForSession: mockSupabaseState.exchangeCodeForSession,
      signOut: mockSupabaseState.signOut,
    },
  },
}))

let latestAuth

const AuthProbe = () => {
  const auth = useAuth()

  useEffect(() => {
    latestAuth = auth
  }, [auth])

  return null
}

const renderAuthProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  )

const backendUser = {
  id: 'user-123',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  subscription_tier: 'free',
}

describe('AuthProvider Supabase session behavior', () => {
  const originalEnv = {
    VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }

  beforeEach(() => {
    latestAuth = undefined
    mockAxios.get.mockReset()
    mockAxios.put.mockReset()
    mockAxios.defaults.headers.common = {}

    mockSupabaseState.isConfigured = true
    mockSupabaseState.getSession.mockReset()
    mockSupabaseState.onAuthStateChange.mockReset()
    mockSupabaseState.signInWithOAuth.mockReset()
    mockSupabaseState.signInWithPassword.mockReset()
    mockSupabaseState.signUp.mockReset()
    mockSupabaseState.exchangeCodeForSession.mockReset()
    mockSupabaseState.signOut.mockReset()
    mockSupabaseState.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    import.meta.env.VITE_AUTH_MODE = 'supabase'
    import.meta.env.VITE_SUPABASE_URL = 'https://project-ref.supabase.co'
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
    window.sessionStorage.clear()
  })

  afterEach(() => {
    import.meta.env.VITE_AUTH_MODE = originalEnv.VITE_AUTH_MODE
    import.meta.env.VITE_SUPABASE_URL = originalEnv.VITE_SUPABASE_URL
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalEnv.VITE_SUPABASE_PUBLISHABLE_KEY
  })

  it('hydrates the backend profile from a Supabase session token', async () => {
    mockSupabaseState.getSession.mockResolvedValue({
      data: { session: { access_token: 'supabase-session-token' } },
      error: null,
    })
    mockAxios.get.mockResolvedValue({
      data: {
        user: backendUser,
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    expect(latestAuth.isAuthenticated).toBe(true)
    expect(latestAuth.user).toEqual(expect.objectContaining({ id: 'user-123' }))
    expect(latestAuth.token).toBe('supabase-session-token')
    expect(mockAxios.defaults.headers.common.Authorization).toBe('Bearer supabase-session-token')
    expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/auth/profile'))
  })

  it('starts Google OAuth through Supabase', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.login()

    expect(result).toEqual(expect.objectContaining({ success: true }))
    expect(mockSupabaseState.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    )
  })

  it('returns a distinct setup error when Google OAuth is not configured', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signInWithOAuth.mockResolvedValue({
      data: null,
      error: {
        code: 'provider_disabled',
        message: 'Unsupported provider: provider is not enabled',
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.login()

    expect(result).toEqual({
      success: false,
      code: 'google_oauth_provider_misconfigured',
      error: expect.stringContaining('Google sign-in is not configured correctly'),
    })
    expect(mockAxios.get).not.toHaveBeenCalled()
  })

  it('signs in with email and password through Supabase', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'password-session-token' } },
      error: null,
    })
    mockAxios.get.mockResolvedValue({
      data: {
        user: backendUser,
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.loginWithPassword({
      email: 'Ada@Example.com ',
      password: 'secure-password',
    })

    expect(result).toEqual(expect.objectContaining({ success: true }))
    expect(mockSupabaseState.signInWithPassword).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'secure-password',
    })
    expect(mockAxios.defaults.headers.common.Authorization).toBe('Bearer password-session-token')
  })

  it('keeps invalid email and password errors distinct from deployment issues', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: {
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.loginWithPassword({
      email: 'ada@example.com',
      password: 'wrong-password',
    })

    expect(result).toEqual({
      success: false,
      code: 'invalid_credentials',
      error: 'The email or password is incorrect.',
    })
    expect(mockAxios.get).not.toHaveBeenCalled()
  })

  it('reports auth API routing problems after a valid password session', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'password-session-token' } },
      error: null,
    })
    mockAxios.get.mockRejectedValue({
      response: {
        status: 404,
        data: { error: 'Not found' },
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.loginWithPassword({
      email: 'ada@example.com',
      password: 'secure-password',
    })

    expect(result).toEqual({
      success: false,
      code: 'backend_auth_route_unavailable',
      error: expect.stringContaining('auth API route is unavailable'),
    })
    expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/auth/profile'))
  })

  it('starts email and password sign-up through Supabase', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.signUp.mockResolvedValue({
      data: { session: null, user: { email: 'new@example.com' } },
      error: null,
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.registerWithPassword({
      email: 'New@Example.com ',
      password: 'secure-password',
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      pendingConfirmation: true,
      email: 'new@example.com',
    }))
    expect(mockSupabaseState.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        password: 'secure-password',
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    )
  })

  it('exchanges a callback code and syncs the backend profile', async () => {
    mockSupabaseState.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseState.exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'exchanged-supabase-token' } },
      error: null,
    })
    mockAxios.get.mockResolvedValue({
      data: {
        user: backendUser,
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.exchangeOAuthCodeForSession('oauth-code')

    expect(result).toEqual(expect.objectContaining({ success: true }))
    expect(mockSupabaseState.exchangeCodeForSession).toHaveBeenCalledWith('oauth-code')
    await waitFor(() => {
      expect(latestAuth.user).toEqual(expect.objectContaining({ email: 'ada@example.com' }))
    })
    expect(mockAxios.defaults.headers.common.Authorization).toBe('Bearer exchanged-supabase-token')
  })

  it('logs out through Supabase and clears the auth header', async () => {
    mockSupabaseState.getSession.mockResolvedValue({
      data: { session: { access_token: 'supabase-session-token' } },
      error: null,
    })
    mockSupabaseState.signOut.mockResolvedValue({ error: null })
    mockAxios.get.mockResolvedValue({
      data: {
        user: backendUser,
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.logout()

    expect(result).toEqual(expect.objectContaining({ success: true, redirected: false }))
    expect(mockSupabaseState.signOut).toHaveBeenCalled()
    expect(mockAxios.defaults.headers.common.Authorization).toBeUndefined()
  })
})
