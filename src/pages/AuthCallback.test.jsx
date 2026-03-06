import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuthCallback from './AuthCallback'

const mockNavigate = vi.fn()
const mockLocation = {
  state: undefined,
  search: ''
}
const mockAuthState = {
  syncBackendAfterLogin: vi.fn(),
  loading: false,
  isAuthenticated: false
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState
}))

describe('AuthCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockLocation.state = undefined
    mockLocation.search = ''
    mockAuthState.loading = false
    mockAuthState.isAuthenticated = false
    mockAuthState.syncBackendAfterLogin.mockReset()

    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/auth/callback')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('passes callback code details into backend sync after an Auth0 redirect', async () => {
    window.sessionStorage.setItem('ailiteracy_auth_return_to', '/dashboard')
    window.sessionStorage.setItem('ailiteracy_auth0_code_verifier', 'pkce-verifier')
    window.history.replaceState({}, '', '/auth/callback?code=callback-code&state=auth0-state')
    mockLocation.search = '?code=callback-code&state=auth0-state'
    mockAuthState.syncBackendAfterLogin.mockResolvedValue({ success: true })

    render(<AuthCallback />)

    await waitFor(() => expect(mockAuthState.syncBackendAfterLogin).toHaveBeenCalled())

    expect(mockAuthState.syncBackendAfterLogin).toHaveBeenCalledWith({
      auth0Code: 'callback-code',
      auth0CodeVerifier: 'pkce-verifier',
      auth0RedirectUri: `${window.location.origin}/auth/callback`
    })
  })

  it('redirects back to login with surfaced auth details when backend sync is unauthorized', async () => {
    vi.useFakeTimers()

    window.sessionStorage.setItem('ailiteracy_auth_return_to', '/dashboard')
    mockAuthState.syncBackendAfterLogin.mockResolvedValue({
      success: false,
      code: 'AUTH0_TOKEN_UNAUTHORIZED',
      error: 'Unauthorized',
      details: 'Auth0 audience mismatch'
    })

    render(<AuthCallback />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('Sign-in could not be completed: Unauthorized')).toBeTruthy()

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: {
        from: { pathname: '/dashboard' },
        authError: {
          code: 'AUTH0_TOKEN_UNAUTHORIZED',
          error: 'Unauthorized',
          details: 'Auth0 audience mismatch'
        }
      }
    })
  })
})
