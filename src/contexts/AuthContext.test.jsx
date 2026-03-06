import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { AuthProvider, useAuth } from './AuthContext'

const mockAuth0State = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
  error: null,
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getAccessTokenSilently: vi.fn()
}

vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }) => children,
  useAuth0: () => mockAuth0State
}))

vi.mock('axios', () => {
  const defaults = {
    headers: {
      common: {}
    }
  }

  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      defaults
    }
  }
})

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
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </MemoryRouter>
  )

describe('AuthProvider auth0 mode', () => {
  const originalEnv = {
    VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
    VITE_AUTH0_DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN,
    VITE_AUTH0_CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID,
    VITE_AUTH0_AUDIENCE: import.meta.env.VITE_AUTH0_AUDIENCE,
    VITE_AUTH0_REDIRECT_URI: import.meta.env.VITE_AUTH0_REDIRECT_URI
  }

  beforeEach(() => {
    latestAuth = undefined
    mockAuth0State.isLoading = false
    mockAuth0State.isAuthenticated = false
    mockAuth0State.user = null
    mockAuth0State.error = null
    mockAuth0State.loginWithRedirect.mockReset()
    mockAuth0State.logout.mockReset()
    mockAuth0State.getAccessTokenSilently.mockReset()

    axios.get.mockReset()
    axios.post.mockReset()
    axios.put.mockReset()
    axios.defaults.headers.common = {}

    window.localStorage.clear()
    window.sessionStorage.clear()

    import.meta.env.VITE_AUTH_MODE = 'auth0'
    import.meta.env.VITE_AUTH0_DOMAIN = 'https://litmusai.us.auth0.com'
    import.meta.env.VITE_AUTH0_CLIENT_ID = 'test-client-id'
    import.meta.env.VITE_AUTH0_AUDIENCE = 'https://litmusai.us.auth0.com/api/v2/'
    import.meta.env.VITE_AUTH0_REDIRECT_URI = 'http://localhost:5173/auth/callback'
  })

  afterEach(() => {
    import.meta.env.VITE_AUTH_MODE = originalEnv.VITE_AUTH_MODE
    import.meta.env.VITE_AUTH0_DOMAIN = originalEnv.VITE_AUTH0_DOMAIN
    import.meta.env.VITE_AUTH0_CLIENT_ID = originalEnv.VITE_AUTH0_CLIENT_ID
    import.meta.env.VITE_AUTH0_AUDIENCE = originalEnv.VITE_AUTH0_AUDIENCE
    import.meta.env.VITE_AUTH0_REDIRECT_URI = originalEnv.VITE_AUTH0_REDIRECT_URI
  })

  it('delegates login and logout to the Auth0 React SDK while preserving local session cleanup', async () => {
    mockAuth0State.isAuthenticated = true
    mockAuth0State.user = {
      sub: 'auth0|user-123',
      email: 'ada@example.com'
    }
    axios.get.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'ada@example.com'
        }
      }
    })

    window.localStorage.setItem(
      'ailiteracy_backend_auth',
      JSON.stringify({
        token: 'header.payload.signature',
        user: {
          id: 'user-123',
          email: 'ada@example.com'
        }
      })
    )
    axios.defaults.headers.common.Authorization = 'Bearer header.payload.signature'

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())

    await latestAuth.login('ada@example.com')
    expect(mockAuth0State.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        authorizationParams: expect.objectContaining({
          login_hint: 'ada@example.com'
        })
      })
    )

    await latestAuth.logout()
    expect(mockAuth0State.logout).toHaveBeenCalled()
    expect(window.localStorage.getItem('ailiteracy_backend_auth')).toBeNull()
    expect(axios.defaults.headers.common.Authorization).toBeUndefined()
  })

  it('hydrates the stable backend session from an authenticated Auth0 browser session', async () => {
    mockAuth0State.isAuthenticated = true
    mockAuth0State.user = {
      sub: 'auth0|user-123',
      email: 'ada@example.com'
    }
    mockAuth0State.getAccessTokenSilently.mockResolvedValue('auth0-access-token')

    axios.post.mockResolvedValue({
      data: {
        access_token: 'header.payload.signature',
        user: {
          id: 'user-123',
          email: 'ada@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          role: 'learner',
          organization: 'LitmusAI',
          subscription_tier: 'free'
        }
      }
    })

    renderAuthProvider()

    await waitFor(() => expect(latestAuth).toBeDefined())

    const result = await latestAuth.syncBackendAfterLogin()

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        user: expect.objectContaining({
          id: 'user-123',
          email: 'ada@example.com'
        })
      })
    )
    expect(mockAuth0State.getAccessTokenSilently).toHaveBeenCalled()
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/exchange'),
      expect.objectContaining({
        access_token: 'auth0-access-token'
      }),
      expect.any(Object)
    )
    await waitFor(() => expect(latestAuth.isAuthenticated).toBe(true))
    expect(latestAuth.user).toEqual(
      expect.objectContaining({
        id: 'user-123',
        email: 'ada@example.com'
      })
    )
    expect(latestAuth.token).toBe('header.payload.signature')
  })
})
