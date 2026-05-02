import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthCallback from './AuthCallback'

const mockNavigate = vi.fn()
const mockLocation = {
  search: '',
  hash: '',
  state: undefined,
}
const mockAuthState = {
  loading: false,
  isAuthenticated: false,
  exchangeOAuthCodeForSession: vi.fn(),
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

describe('AuthCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockLocation.search = ''
    mockLocation.hash = ''
    mockLocation.state = undefined
    mockAuthState.loading = false
    mockAuthState.isAuthenticated = false
    mockAuthState.exchangeOAuthCodeForSession.mockReset()
    window.sessionStorage.clear()
  })

  it('exchanges a Supabase auth code and restores the stored return path', async () => {
    window.sessionStorage.setItem('ailiteracy_auth_return_to', '/training')
    mockLocation.search = '?code=supabase-code'
    mockAuthState.exchangeOAuthCodeForSession.mockResolvedValue({ success: true })

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockAuthState.exchangeOAuthCodeForSession).toHaveBeenCalledWith('supabase-code')
      expect(mockNavigate).toHaveBeenCalledWith('/training', { replace: true })
    })
  })

  it('restores the stored return path when the user is already authenticated', async () => {
    window.sessionStorage.setItem('ailiteracy_auth_return_to', '/dashboard')
    mockAuthState.isAuthenticated = true

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('redirects OAuth errors back to login', async () => {
    mockLocation.search = '?error_description=Google%20cancelled'
    mockLocation.state = { returnTo: '/training' }

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          from: { pathname: '/training' },
          authError: {
            code: 'supabase_oauth_error',
            error: 'Google cancelled',
          },
        },
      })
    })
  })

  it('redirects Google provider setup errors back to login with a config code', async () => {
    mockLocation.search = '?error_description=Unsupported%20provider%3A%20provider%20is%20not%20enabled'
    mockLocation.state = { returnTo: '/training' }

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          from: { pathname: '/training' },
          authError: {
            code: 'google_oauth_provider_misconfigured',
            error: expect.stringContaining('Google sign-in is not configured correctly'),
          },
        },
      })
    })
  })

  it('redirects back to login when the callback has no session or code', async () => {
    mockLocation.state = { returnTo: '/training' }

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          from: { pathname: '/training' },
          authError: {
            code: 'missing_supabase_callback',
            error: 'No Supabase sign-in session was found. Please sign in again.',
          },
        },
      })
    })
  })
})
