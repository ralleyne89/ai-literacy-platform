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

const mockClerkState = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: true,
  getToken: vi.fn(),
  redirectToSignIn: vi.fn(),
  redirectToSignUp: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockAxios.get,
    put: mockAxios.put,
    defaults: mockAxios.defaults,
  },
}))

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }) => children,
  useAuth: () => ({
    isLoaded: mockClerkState.isLoaded,
    isSignedIn: mockClerkState.isSignedIn,
    getToken: mockClerkState.getToken,
  }),
  useClerk: () => ({
    redirectToSignIn: mockClerkState.redirectToSignIn,
    redirectToSignUp: mockClerkState.redirectToSignUp,
    signOut: mockClerkState.signOut,
  }),
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

describe('AuthProvider Clerk session behavior', () => {
  const originalEnv = {
    VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  }

  beforeEach(() => {
    latestAuth = undefined
    mockAxios.get.mockReset()
    mockAxios.put.mockReset()
    mockAxios.defaults.headers.common = {}

    mockClerkState.isLoaded = true
    mockClerkState.isSignedIn = true
    mockClerkState.getToken.mockReset()
    mockClerkState.redirectToSignIn.mockReset()
    mockClerkState.redirectToSignUp.mockReset()
    mockClerkState.signOut.mockReset()

    import.meta.env.VITE_AUTH_MODE = 'clerk'
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk'
    window.sessionStorage.clear()
  })

  afterEach(() => {
    import.meta.env.VITE_AUTH_MODE = originalEnv.VITE_AUTH_MODE
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY = originalEnv.VITE_CLERK_PUBLISHABLE_KEY
  })

  it('hydrates the backend profile from a Clerk session token', async () => {
    mockClerkState.getToken.mockResolvedValue('clerk-session-token')
    mockAxios.get.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'ada@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          subscription_tier: 'free',
        },
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    expect(latestAuth.isAuthenticated).toBe(true)
    expect(latestAuth.user).toEqual(
      expect.objectContaining({
        id: 'user-123',
        email: 'ada@example.com',
      })
    )
    expect(latestAuth.token).toBe('clerk-session-token')
    expect(mockAxios.defaults.headers.common.Authorization).toBe('Bearer clerk-session-token')
    expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/auth/profile'))
  })

  it('logs out through Clerk and clears the auth header', async () => {
    mockClerkState.getToken.mockResolvedValue('clerk-session-token')
    mockClerkState.signOut.mockResolvedValue(undefined)
    mockAxios.get.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'ada@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          subscription_tier: 'free',
        },
      },
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())
    await waitFor(() => expect(latestAuth.loading).toBe(false))

    const result = await latestAuth.logout()

    expect(result).toEqual(expect.objectContaining({ success: true, redirected: true }))
    expect(mockClerkState.signOut).toHaveBeenCalled()
    expect(mockAxios.defaults.headers.common.Authorization).toBeUndefined()
  })
})
